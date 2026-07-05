import { create } from 'zustand';
import type { User as FirebaseUser } from 'firebase/auth';
import type { UserProfile } from '@grocery/shared';

interface AuthState {
  firebaseUser: FirebaseUser | null;
  profile: UserProfile | null;
  initializing: boolean;
  setFirebaseUser: (user: FirebaseUser | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setInitializing: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  firebaseUser: null,
  profile: null,
  initializing: true,
  setFirebaseUser: (firebaseUser) => set({ firebaseUser }),
  setProfile: (profile) => set({ profile }),
  setInitializing: (initializing) => set({ initializing }),
}));
