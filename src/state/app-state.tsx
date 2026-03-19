import React, { createContext, useContext, useMemo, useReducer } from 'react';
import type { AppRoute, AppSettings, AppState, JobItem, OpenDocument } from '@/shared/types';

interface AppStateContextValue {
  state: AppState;
  navigate: (route: AppRoute) => void;
  setActiveTool: (tool: string | null) => void;
  openDocument: (doc: OpenDocument) => void;
  closeDocument: (id: string) => void;
  queueJob: (job: JobItem) => void;
  updateJob: (id: string, patch: Partial<JobItem>) => void;
  updateSettings: (patch: Partial<AppSettings>) => void;
}

type Action =
  | { type: 'NAVIGATE'; payload: AppRoute }
  | { type: 'SET_ACTIVE_TOOL'; payload: string | null }
  | { type: 'OPEN_DOCUMENT'; payload: OpenDocument }
  | { type: 'CLOSE_DOCUMENT'; payload: string }
  | { type: 'QUEUE_JOB'; payload: JobItem }
  | { type: 'UPDATE_JOB'; payload: { id: string; patch: Partial<JobItem> } }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppSettings> };

const initialState: AppState = {
  route: 'home',
  openDocuments: [],
  activeDocumentId: null,
  activeTool: null,
  jobs: [],
  settings: {
    theme: 'dark',
    defaultZoom: 100,
    autosaveMinutes: 3,
    recentLimit: 15,
    scratchDirectory: ''
  }
};

const AppStateContext = createContext<AppStateContextValue | undefined>(undefined);

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'NAVIGATE':
      return { ...state, route: action.payload };
    case 'SET_ACTIVE_TOOL':
      return { ...state, activeTool: action.payload };
    case 'OPEN_DOCUMENT': {
      const existing = state.openDocuments.find((doc) => doc.id === action.payload.id);
      const openDocuments = existing
        ? state.openDocuments.map((doc) => (doc.id === action.payload.id ? action.payload : doc))
        : [...state.openDocuments, action.payload];

      return {
        ...state,
        openDocuments,
        activeDocumentId: action.payload.id,
        route: 'editor'
      };
    }
    case 'CLOSE_DOCUMENT': {
      const openDocuments = state.openDocuments.filter((doc) => doc.id !== action.payload);
      const activeDocumentId =
        state.activeDocumentId === action.payload ? openDocuments[0]?.id ?? null : state.activeDocumentId;
      return { ...state, openDocuments, activeDocumentId };
    }
    case 'QUEUE_JOB':
      return { ...state, jobs: [...state.jobs, action.payload], route: 'automation' };
    case 'UPDATE_JOB':
      return {
        ...state,
        jobs: state.jobs.map((job) =>
          job.id === action.payload.id ? { ...job, ...action.payload.patch, updatedAt: new Date().toISOString() } : job
        )
      };
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };
    default:
      return state;
  }
}

export function AppStateProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [state, dispatch] = useReducer(reducer, initialState);

  const value = useMemo<AppStateContextValue>(
    () => ({
      state,
      navigate: (route) => dispatch({ type: 'NAVIGATE', payload: route }),
      setActiveTool: (tool) => dispatch({ type: 'SET_ACTIVE_TOOL', payload: tool }),
      openDocument: (doc) => dispatch({ type: 'OPEN_DOCUMENT', payload: doc }),
      closeDocument: (id) => dispatch({ type: 'CLOSE_DOCUMENT', payload: id }),
      queueJob: (job) => dispatch({ type: 'QUEUE_JOB', payload: job }),
      updateJob: (id, patch) => dispatch({ type: 'UPDATE_JOB', payload: { id, patch } }),
      updateSettings: (patch) => dispatch({ type: 'UPDATE_SETTINGS', payload: patch })
    }),
    [state]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateContextValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return ctx;
}
