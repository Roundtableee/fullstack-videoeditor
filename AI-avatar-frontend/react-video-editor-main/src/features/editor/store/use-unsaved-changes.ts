import { create } from 'zustand';
import { dispatch, filter, subject } from '@designcombo/events';
import { HISTORY_UNDO, HISTORY_REDO } from '@designcombo/state';

interface UnsavedChangesState {
  hasUnsavedChanges: boolean;
  actions: {
    setHasUnsavedChanges: (hasChanges: boolean) => void;
    resetUnsavedChanges: () => void;
  };
}

export const useUnsavedChanges = create<UnsavedChangesState>((set) => ({
  hasUnsavedChanges: false,
  actions: {
    setHasUnsavedChanges: (hasChanges) => set({ hasUnsavedChanges: hasChanges }),
    resetUnsavedChanges: () => set({ hasUnsavedChanges: false }),
  },
})); 