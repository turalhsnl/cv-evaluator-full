import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isHome = location.pathname === '/';
  const isDashboard = location.pathname === '/dashboard';
  const isLogin = location.pathname === '/login';
  const isSignup = location.pathname === '/signup';

  return (
    <>
      <header className="bg-white border-b shadow-sm px-6 py-4 flex justify-between gap-3 items-center sticky top-0 z-50">
        <h1 className="text-2xl font-bold text-blue-600">CV Evaluator 🧠</h1>
        <div className="flex gap-3">
          {isHome && (
            <>
              <Button onClick={() => navigate('/dashboard')}>
                📊 Go to Dashboard
              </Button>
              <Button onClick={() => navigate('/login')}>🔑 Login</Button>
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
