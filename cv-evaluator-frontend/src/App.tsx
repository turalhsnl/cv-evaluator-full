import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CVEvaluator from './components/CVEvaluator';
import Dashboard from './components/Dashboard';
import Header from './components/Header';
import type { Evaluation } from './components/Dashboard';
import Login from './components/Login';
import Signup from './components/Signup';

function App() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);

  // Load saved evaluations from localStorage on first mount
  useEffect(() => {
    const saved = localStorage.getItem('evaluations');
    if (saved) {
      try {
        setEvaluations(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved evaluations:', e);
      }
    }
  }, []);

  // Sync to localStorage whenever evaluations change
  useEffect(() => {
    localStorage.setItem('evaluations', JSON.stringify(evaluations));
  }, [evaluations]);

  return (
    <Router>
      <Header />
      <Routes>
        <Route
          path="/"
          element={
            <CVEvaluator
              evaluations={evaluations}
              setEvaluations={setEvaluations}
            />
          }
        />
        <Route
          path="/dashboard"
          element={<Dashboard evaluations={evaluations} />}
        />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
    </Router>
  );
}

export default App;
