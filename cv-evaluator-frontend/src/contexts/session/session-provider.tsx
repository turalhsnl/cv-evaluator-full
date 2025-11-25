import { useEffect, useState } from 'react';
import { Session, SessionContext } from './session-context';

export default function SessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sessionData, setSessionData] = useState<Session>({
    user: undefined,
  });

  // 🤮🤮🤮 (I'm not installing react-query just for this)
  useEffect(() => {
    const getSession = async () => {
      try {
        const res = await fetch('/api/session', {
          credentials: 'include',
        });

        if (res.ok) {
          const data = await res.json();
          setSessionData(data);
        } else {
          setSessionData({
            user: undefined,
          });
        }
      } catch (error) {
        console.error('Auth check failed', error);
        setSessionData({
          user: undefined,
        });
      }
    };

    getSession();
  }, []);

  return (
    <SessionContext.Provider value={sessionData}>
      {children}
    </SessionContext.Provider>
  );
}
