import { create } from 'zustand';
import type { User as FirebaseUser } from 'firebase/auth';

interface AuthState {
  firebaseUser: FirebaseUser | null;
  initializing: boolean;
  setFirebaseUser: (user: FirebaseUser | null) => void;
  setInitializing: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  firebaseUser: null,
  initializing: true,
  setFirebaseUser: (firebaseUser) => set({ firebaseUser }),
  setInitializing: (initializing) => set({ initializing }),
}));
