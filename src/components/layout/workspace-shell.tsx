import type { ReactNode } from 'react';

export function WorkspaceShell({ children }: { children: ReactNode }): JSX.Element {
  return <main className="flex-1 overflow-auto bg-background px-6 py-5">{children}</main>;
}
