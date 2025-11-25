import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useSession } from '@/contexts/session/session-context';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useSession();

  const isHome = location.pathname === '/';
  const isDashboard = location.pathname === '/dashboard';
  const isLogin = location.pathname === '/login';
  const isSignup = location.pathname === '/signup';

  async function logout() {
    const res = await fetch('/api/logout', {
      method: 'POST',
      credentials: 'include',
    });
    if (res.ok) {
      window.location.href = '/';
    }
  }

  return (
    <>
      <header className="bg-white border-b shadow-sm px-6 py-4 flex justify-between gap-3 items-center sticky top-0 z-50">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold text-blue-600">CV Evaluator 🧠</h1>
          {user && (
            <h2 className="font-bold">
              Logged in as:{' '}
              <span className="text-blue-600">{user.username}</span>
            </h2>
          )}
        </div>

        <div className="flex gap-3">
          {isHome && (
            <>
              <Button onClick={() => navigate('/dashboard')}>
                📊 Go to Dashboard
              </Button>
              {user ? (
                <Button onClick={logout}>🔑 Log out</Button>
              ) : (
                <Button onClick={() => navigate('/login')}>🔑 Login</Button>
              )}
            </>
          )}
          {(isDashboard || isLogin || isSignup) && (
            <Button onClick={() => navigate('/')}>⬅️ Back to Upload</Button>
          )}
        </div>
      </header>
      <Outlet />
    </>
  );
};

export default Header;
