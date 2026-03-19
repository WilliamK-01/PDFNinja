import { useMemo } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { TopToolbar } from '@/components/layout/top-toolbar';
import { WorkspaceShell } from '@/components/layout/workspace-shell';
import { InspectorPanel } from '@/components/layout/inspector-panel';
import { JobsPanel } from '@/components/layout/jobs-panel';
import { HomeScreen } from '@/features/home/home-screen';
import { QuickToolsScreen } from '@/features/quick-tools/quick-tools-screen';
import { EditorScreen } from '@/features/editor/editor-screen';
import { AutomationScreen } from '@/features/automation/automation-screen';
import { SettingsScreen } from '@/features/settings/settings-screen';
import { useAppState } from '@/state/app-state';
import type { AppRoute, OpenDocument } from '@/shared/types';

const titles: Record<AppRoute, string> = {
  home: 'Home',
  'quick-tools': 'Quick Tools',
  editor: 'Editor',
  automation: 'Automation',
  settings: 'Settings'
};

export function App(): JSX.Element {
  const { state, navigate, updateSettings, openDocument } = useAppState();

  const content = useMemo(() => {
    switch (state.route) {
      case 'home':
        return <HomeScreen recentFiles={state.openDocuments} onNavigate={navigate} onOpenRecent={(doc: OpenDocument) => openDocument(doc)} />;
      case 'quick-tools':
        return <QuickToolsScreen />;
      case 'editor':
        return <EditorScreen documents={state.openDocuments} activeDocumentId={state.activeDocumentId} />;
      case 'automation':
        return <AutomationScreen jobs={state.jobs} />;
      case 'settings':
        return <SettingsScreen settings={state.settings} onUpdate={updateSettings} />;
      default:
        return <HomeScreen recentFiles={state.openDocuments} onNavigate={navigate} onOpenRecent={(doc: OpenDocument) => openDocument(doc)} />;
    }
  }, [navigate, openDocument, state, updateSettings]);

  return (
    <div className="flex h-full bg-background text-textPrimary">
      <Sidebar route={state.route} onNavigate={navigate} />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopToolbar title={titles[state.route]} activeTool={state.activeTool} />

        <div className="flex min-h-0 flex-1">
          <WorkspaceShell>{content}</WorkspaceShell>
          {state.route === 'editor' ? null : <InspectorPanel />}
        </div>

        <JobsPanel jobs={state.jobs} />
      </div>
    </div>
  );
}
