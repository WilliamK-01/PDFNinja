import React, { createContext, useContext, useMemo, useReducer } from 'react';
import type { AnnotationItem, AppRoute, AppSettings, AppState, JobItem, OpenDocument } from '@/shared/types';

interface AppStateContextValue {
  state: AppState;
  navigate: (route: AppRoute) => void;
  setActiveTool: (tool: string | null) => void;
  openDocument: (doc: OpenDocument) => void;
  closeDocument: (id: string) => void;
  updateDocument: (id: string, patch: Partial<OpenDocument>) => void;
  queueJob: (job: JobItem) => void;
  updateJob: (id: string, patch: Partial<JobItem>) => void;
  updateSettings: (patch: Partial<AppSettings>) => void;
  addAnnotation: (annotation: AnnotationItem) => void;
  updateAnnotation: (id: string, documentId: string, patch: Partial<AnnotationItem>) => void;
  deleteAnnotation: (id: string, documentId: string) => void;
  selectAnnotation: (id: string | null) => void;
}

type Action =
  | { type: 'NAVIGATE'; payload: AppRoute }
  | { type: 'SET_ACTIVE_TOOL'; payload: string | null }
  | { type: 'OPEN_DOCUMENT'; payload: OpenDocument }
  | { type: 'CLOSE_DOCUMENT'; payload: string }
  | { type: 'UPDATE_DOCUMENT'; payload: { id: string; patch: Partial<OpenDocument> } }
  | { type: 'QUEUE_JOB'; payload: JobItem }
  | { type: 'UPDATE_JOB'; payload: { id: string; patch: Partial<JobItem> } }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppSettings> }
  | { type: 'ADD_ANNOTATION'; payload: AnnotationItem }
  | { type: 'UPDATE_ANNOTATION'; payload: { id: string; documentId: string; patch: Partial<AnnotationItem> } }
  | { type: 'DELETE_ANNOTATION'; payload: { id: string; documentId: string } }
  | { type: 'SELECT_ANNOTATION'; payload: string | null };

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
  },
  sessionAnnotations: {},
  selectedAnnotationId: null
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
        ? state.openDocuments.map((doc) => (doc.id === action.payload.id ? { ...doc, ...action.payload } : doc))
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
    case 'UPDATE_DOCUMENT':
      return {
        ...state,
        openDocuments: state.openDocuments.map((doc) =>
          doc.id === action.payload.id ? { ...doc, ...action.payload.patch } : doc
        )
      };
    case 'QUEUE_JOB':
      return { ...state, jobs: [...state.jobs, action.payload] };
    case 'UPDATE_JOB':
      return {
        ...state,
        jobs: state.jobs.map((job) =>
          job.id === action.payload.id ? { ...job, ...action.payload.patch, updatedAt: new Date().toISOString() } : job
        )
      };
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };

    case 'ADD_ANNOTATION': {
      const current = state.sessionAnnotations[action.payload.documentId] ?? [];
      return {
        ...state,
        sessionAnnotations: {
          ...state.sessionAnnotations,
          [action.payload.documentId]: [...current, action.payload]
        },
        selectedAnnotationId: action.payload.id
      };
    }
    case 'UPDATE_ANNOTATION': {
      const current = state.sessionAnnotations[action.payload.documentId] ?? [];
      return {
        ...state,
        sessionAnnotations: {
          ...state.sessionAnnotations,
          [action.payload.documentId]: current.map((item) =>
            item.id === action.payload.id ? { ...item, ...action.payload.patch, updatedAt: new Date().toISOString() } : item
          )
        }
      };
    }
    case 'DELETE_ANNOTATION': {
      const current = state.sessionAnnotations[action.payload.documentId] ?? [];
      return {
        ...state,
        sessionAnnotations: {
          ...state.sessionAnnotations,
          [action.payload.documentId]: current.filter((item) => item.id !== action.payload.id)
        },
        selectedAnnotationId: state.selectedAnnotationId === action.payload.id ? null : state.selectedAnnotationId
      };
    }
    case 'SELECT_ANNOTATION':
      return { ...state, selectedAnnotationId: action.payload };

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
      updateDocument: (id, patch) => dispatch({ type: 'UPDATE_DOCUMENT', payload: { id, patch } }),
      queueJob: (job) => dispatch({ type: 'QUEUE_JOB', payload: job }),
      updateJob: (id, patch) => dispatch({ type: 'UPDATE_JOB', payload: { id, patch } }),
      updateSettings: (patch) => dispatch({ type: 'UPDATE_SETTINGS', payload: patch }),
      addAnnotation: (annotation) => dispatch({ type: 'ADD_ANNOTATION', payload: annotation }),
      updateAnnotation: (id, documentId, patch) => dispatch({ type: 'UPDATE_ANNOTATION', payload: { id, documentId, patch } }),
      deleteAnnotation: (id, documentId) => dispatch({ type: 'DELETE_ANNOTATION', payload: { id, documentId } }),
      selectAnnotation: (id) => dispatch({ type: 'SELECT_ANNOTATION', payload: id })
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
