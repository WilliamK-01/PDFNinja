import type { AppSettings } from '@/shared/types';
import { ModuleCard } from '@/components/layout/module-card';

interface SettingsScreenProps {
  settings: AppSettings;
  onUpdate: (patch: Partial<AppSettings>) => void;
}

export function SettingsScreen({ settings, onUpdate }: SettingsScreenProps): JSX.Element {
  return (
    <div className="space-y-4">
      <ModuleCard title="Application Settings" description="Local-only preferences saved via Rust storage service.">
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm text-textSecondary">
            Default zoom (%)
            <input
              className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-textPrimary"
              value={settings.defaultZoom}
              onChange={(event) => onUpdate({ defaultZoom: Number(event.target.value) || 100 })}
            />
          </label>
          <label className="text-sm text-textSecondary">
            Autosave (minutes)
            <input
              className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-textPrimary"
              value={settings.autosaveMinutes}
              onChange={(event) => onUpdate({ autosaveMinutes: Number(event.target.value) || 3 })}
            />
          </label>
        </div>
      </ModuleCard>
    </div>
  );
}
