let previousId: string | null = null;

interface AppState {
  activeId: string | null;
}

function createStore<T>(initialState: T) {
  let state = initialState;
  const listeners = new Set<(state: T) => void>();

  const getState = () => state;

  const setState = (newState: Partial<T> | ((state: T) => Partial<T>)) => {
    const nextState =
      typeof newState === "function" ? (newState as Function)(state) : newState;
    state = { ...state, ...nextState };
    listeners.forEach((listener) => listener(state));
  };

  const subscribe = (listener: (state: T) => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };
  return { getState, setState, subscribe };
}

const stateStore = createStore<AppState>({
  activeId: null,
});

stateStore.subscribe((state) => {
  if (state.activeId !== previousId) {
    previousId = state.activeId;
    window.noteAPI.setActiveNote(state.activeId);
  }
});

export { stateStore };
