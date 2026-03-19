import type { ReactNode } from 'react';

export function WorkspaceShell({ children }: { children: ReactNode }): JSX.Element {
  return <main className="flex-1 bg-background p-5">{children}</main>;
}
