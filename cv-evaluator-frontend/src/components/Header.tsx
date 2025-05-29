import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isDashboard = location.pathname === '/dashboard';

  return (
    <header className="bg-white border-b shadow-sm px-6 py-4 flex justify-between items-center sticky top-0 z-50">
      <h1 className="text-2xl font-bold text-blue-600">
        CV Evaluator 🧠
      </h1>
      <div>
        {isDashboard ? (
          <Button onClick={() => navigate('/')}>⬅️ Back to Upload</Button>
        ) : (
          <Button onClick={() => navigate('/dashboard')}>📊 Go to Dashboard</Button>
        )}
      </div>
    </header>
  );
};

export default Header;
