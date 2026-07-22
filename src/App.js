import Create from './Pages/Create';
import Welcome from './Pages/Welcome';
import Practice from './Pages/Practice';
import Dashboard from './Pages/Dashboard';
import Home from './Pages/Home';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import { ToastViewport } from './components/Toast';

const Memory = lazy(() => import('./Pages/Card Games/Memory'));
const Quiz = lazy(() => import('./Pages/Card Games/Quiz'));
const Scramble = lazy(() => import('./Pages/Card Games/Scramble'));
const Dash = lazy(() => import('./Pages/Card Games/Dash'));
const Type = lazy(() => import('./Pages/Card Games/Type'));
const Match = lazy(() => import('./Pages/Card Games/Match'));
const PublicStudy = lazy(() => import('./Pages/PublicStudy'));

function App() {
  useEffect(() => {
    const handleTouchStart = () => {
      setTimeout(() => {
        window.scrollTo(0, 1);
        setTimeout(() => window.scrollTo(0, 0), 50);
      }, 100);
    };

    document.addEventListener('touchstart', handleTouchStart, { once: true, passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
    };
  }, []);

  return (
    <div
      className="w-screen min-h-screen dark:bg-gray-800"
      style={{
        backgroundColor: 'transparent',
      }}
    >
      <Router>
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center text-white/80 font-semibold">
              Loading…
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/home" element={<Home />} />
            <Route path="/create" element={<Create />} />
            <Route path="/create/:subjectId" element={<Create />} />
            <Route path="/practice" element={<Practice />} />
            <Route path="/practice/:subjectId" element={<Practice />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/memory" element={<Memory />} />
            <Route path="/memory/:subjectId" element={<Memory />} />
            <Route path="/quiz" element={<Quiz />} />
            <Route path="/quiz/:subjectId" element={<Quiz />} />
            <Route path="/scramble" element={<Scramble />} />
            <Route path="/scramble/:subjectId" element={<Scramble />} />
            <Route path="/dash" element={<Dash />} />
            <Route path="/dash/:subjectId" element={<Dash />} />
            <Route path="/type" element={<Type />} />
            <Route path="/type/:subjectId" element={<Type />} />
            <Route path="/match" element={<Match />} />
            <Route path="/match/:subjectId" element={<Match />} />
            <Route path="/study/:token" element={<PublicStudy />} />
          </Routes>
        </Suspense>
        <ToastViewport />
      </Router>
    </div>
  );
}

export default App;
