import { createContext, useContext } from 'react';

export type Session = {
  user?: {
    username: string;
  };
};

export const SessionContext = createContext<Session | undefined>(undefined);

export function useSession() {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }

  return context;
}
