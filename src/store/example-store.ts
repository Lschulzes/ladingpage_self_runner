import { create } from 'zustand';

interface ExampleState {
  count: number;
  message: string;
  increment: () => void;
  decrement: () => void;
  setMessage: (message: string) => void;
}

export const useExampleStore = create<ExampleState>((set) => ({
  count: 0,
  message: 'Hello from Zustand!',
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  setMessage: (message) => set({ message }),
}));
