import type {
  WorkflowDefinition,
  WorkflowExecutionResult,
  WorkflowQueueItem,
  WorkflowStep,
  WorkflowStepType
} from '@/features/automation/automation-types';

interface ExecutionContext {
  workingFiles: string[];
  outputDirectory: string;
}

interface ExecutionHandlers {
  onStepStart: (stepIndex: number, step: WorkflowStep) => void;
}

const STEP_LABELS: Record<WorkflowStepType, string> = {
  ocr: 'OCR',
  compress: 'Compress',
  merge: 'Merge',
  watermark: 'Watermark',
  'extract-pages': 'Extract pages',
  rename: 'Rename',
  save: 'Save'
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function trimExtension(name: string): string {
  const index = name.lastIndexOf('.');
  return index <= 0 ? name : name.slice(0, index);
}

function extension(name: string): string {
  const index = name.lastIndexOf('.');
  return index <= 0 ? '' : name.slice(index);
}

function basename(path: string): string {
  const normalized = path.replace(/\\/g, '/');
  const parts = normalized.split('/');
  return parts[parts.length - 1] ?? path;
}

function withSuffix(path: string, suffix: string): string {
  const fileName = basename(path);
  const ext = extension(fileName);
  const base = trimExtension(fileName);
  return path.replace(fileName, `${base}${suffix}${ext || '.pdf'}`);
}

function requireInputFiles(step: WorkflowStep, files: string[]): void {
  if (files.length === 0) {
    throw new Error(`${STEP_LABELS[step.type]} needs at least one input file.`);
  }
}

async function runStep(step: WorkflowStep, ctx: ExecutionContext): Promise<ExecutionContext> {
  await delay(130);

  switch (step.type) {
    case 'ocr': {
      requireInputFiles(step, ctx.workingFiles);
      return { ...ctx, workingFiles: ctx.workingFiles.map((file) => withSuffix(file, '_ocr')) };
    }
    case 'compress': {
      requireInputFiles(step, ctx.workingFiles);
      const quality = String(step.options.quality ?? 'medium');
      if (!['low', 'medium', 'high'].includes(quality)) {
        throw new Error('Compress quality must be low, medium, or high.');
      }
      return { ...ctx, workingFiles: ctx.workingFiles.map((file) => withSuffix(file, `_compressed_${quality}`)) };
    }
    case 'merge': {
      requireInputFiles(step, ctx.workingFiles);
      if (ctx.workingFiles.length < 2) {
        throw new Error('Merge needs at least two source files.');
      }
      const merged = `${ctx.outputDirectory}/merged-${Date.now()}.pdf`;
      return { ...ctx, workingFiles: [merged] };
    }
    case 'watermark': {
      requireInputFiles(step, ctx.workingFiles);
      const text = String(step.options.text ?? '').trim();
      if (!text) {
        throw new Error('Watermark text cannot be empty.');
      }
      return { ...ctx, workingFiles: ctx.workingFiles.map((file) => withSuffix(file, '_watermarked')) };
    }
    case 'extract-pages': {
      requireInputFiles(step, ctx.workingFiles);
      const range = String(step.options.range ?? '').trim();
      if (!range) {
        throw new Error('Extract pages range is required (example: 1-3).');
      }
      return { ...ctx, workingFiles: ctx.workingFiles.map((file) => withSuffix(file, `_pages_${range.replace(/\s+/g, '')}`)) };
    }
    case 'rename': {
      requireInputFiles(step, ctx.workingFiles);
      const pattern = String(step.options.pattern ?? '').trim();
      if (!pattern) {
        throw new Error('Rename pattern is required. Use {index} for numbering.');
      }

      const renamed = ctx.workingFiles.map((file, index) => {
        const fileName = basename(file);
        const ext = extension(fileName) || '.pdf';
        const rendered = pattern.split('{index}').join(String(index + 1));
        const safe = rendered.replace(/\//g, '-').trim();
        return `${ctx.outputDirectory}/${safe}${ext}`;
      });

      return { ...ctx, workingFiles: renamed };
    }
    case 'save': {
      requireInputFiles(step, ctx.workingFiles);
      const subfolder = String(step.options.subfolder ?? '').trim();
      if (subfolder) {
        return { ...ctx, workingFiles: ctx.workingFiles.map((file) => `${ctx.outputDirectory}/${subfolder}/${basename(file)}`) };
      }
      return ctx;
    }
    default:
      return ctx;
  }
}

export function stepLabel(type: WorkflowStepType): string {
  return STEP_LABELS[type];
}

export async function executeWorkflow(
  workflow: WorkflowDefinition,
  queueItem: WorkflowQueueItem,
  handlers: ExecutionHandlers
): Promise<WorkflowExecutionResult> {
  if (workflow.steps.length === 0) {
    throw new Error('Workflow has no steps. Add at least one step before running.');
  }

  let context: ExecutionContext = {
    workingFiles: [...queueItem.sourcePaths],
    outputDirectory: queueItem.outputDirectory
  };

  const executedSteps: string[] = [];

  for (let index = 0; index < workflow.steps.length; index += 1) {
    const step = workflow.steps[index];
    handlers.onStepStart(index, step);

    try {
      context = await runStep(step, context);
      executedSteps.push(stepLabel(step.type));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown workflow step failure.';
      throw new Error(`Step ${index + 1} (${stepLabel(step.type)}) failed: ${message}`);
    }
  }

  return {
    executedSteps,
    outputFiles: context.workingFiles
  };
}
