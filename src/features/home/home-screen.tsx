import { ModuleCard } from '@/components/layout/module-card';

export function HomeScreen(): JSX.Element {
  return (
    <div className="grid grid-cols-2 gap-4">
      <ModuleCard
        title="Welcome to PDFNinja"
        description="Offline-first desktop PDF workflows built for quick tasks and advanced document control."
      />
      <ModuleCard
        title="Recent Activity"
        description="Your recently opened files and queued jobs will appear here once command integrations are connected."
      />
      <ModuleCard
        title="Getting Started"
        description="Use Quick Tools for one-off jobs, Editor for in-depth modifications, and Automation for reusable pipelines."
      />
      <ModuleCard
        title="System Health"
        description="Background worker health, storage usage, and local indexing status will be displayed in this tile."
      />
    </div>
  );
}
