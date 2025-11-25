import { useState } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Link } from 'react-router-dom';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="pt-[35%]">
      <div className="p-8 h-[50vh] bg-gray-100">
        <h1 className="text-3xl font-bold mb-6">🔑 Login</h1>

        <form
          className="flex flex-col gap-4"
          onSubmit={async (e) => {
            e.preventDefault();

            const res = await fetch('/api/login', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({ username, password }),
            });

            if (res.ok) {
              window.location.href = '/';
            }
          }}
        >
          <Input
            placeholder="Username..."
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <Input
            placeholder="Password..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button
            type="submit"
            variant="outline"
            disabled={!username || !password}
            className="bg-blue-600 text-white disabled:opacity-50 disabled:hover:bg-blue-600"
          >
            Login
          </Button>

          <p>
            Don't have an account? Click{' '}
            <Link className="text-blue-600" to="/signup">
              here
            </Link>{' '}
            to sign up.
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
