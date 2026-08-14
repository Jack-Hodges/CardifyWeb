import Create from './Pages/Create';
import Welcome from './Pages/Welcome';
import Practice from './Pages/Practice';
import Dashboard from './Pages/Dashboard';
import Home from './Pages/Home';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { ToastViewport } from './components/Toast';

const Memory = lazy(() => import('./Pages/Card Games/Memory'));
const Quiz = lazy(() => import('./Pages/Card Games/Quiz'));
const Scramble = lazy(() => import('./Pages/Card Games/Scramble'));
const Dash = lazy(() => import('./Pages/Card Games/Dash'));
const Type = lazy(() => import('./Pages/Card Games/Type'));
const Match = lazy(() => import('./Pages/Card Games/Match'));
const PublicStudy = lazy(() => import('./Pages/PublicStudy'));
const Discover = lazy(() => import('./Pages/Discover'));
const DiscoverStudy = lazy(() => import('./Pages/DiscoverStudy'));
const Learn = lazy(() => import('./Pages/Card Games/Learn'));
const Cipher = lazy(() => import('./Pages/Card Games/Cipher'));
const TrueFalse = lazy(() => import('./Pages/Card Games/True'));
const Admin = lazy(() => import('./Pages/Admin'));

function App() {
  return (
    <div
      className="w-full min-h-screen overflow-x-hidden"
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
            <Route path="/discover" element={<Discover />} />
            <Route path="/discover/:subjectId" element={<DiscoverStudy />} />
            <Route path="/admin" element={<Admin />} />
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
            <Route path="/learn" element={<Learn />} />
            <Route path="/learn/:subjectId" element={<Learn />} />
            <Route path="/cipher" element={<Cipher />} />
            <Route path="/cipher/:subjectId" element={<Cipher />} />
            <Route path="/true" element={<TrueFalse />} />
            <Route path="/true/:subjectId" element={<TrueFalse />} />
            <Route path="/review" element={<Practice />} />
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
