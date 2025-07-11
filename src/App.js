import Create from './Pages/Create';
import Welcome from './Pages/Welcome';
import Practice from './Pages/Practice';
import Dashboard from './Pages/Dashboard';
import Memory from './Pages/Card Games/Memory';
import Home from './Pages/Home';
import Quiz from './Pages/Card Games/Quiz';
import Scramble from './Pages/Card Games/Scramble';
import Dash from './Pages/Card Games/Dash';
import Type from './Pages/Card Games/Type';
import Match from './Pages/Card Games/Match';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { useUser } from './UserContext';
import { useEffect } from 'react';

function App() {

  const { theme } = useUser();

  useEffect(() => {
    // Force iOS to hide navigation bar on scroll by triggering document scroll
    const handleTouchStart = () => {
      // Trigger a small scroll to enable iOS navigation bar hiding
      setTimeout(() => {
        window.scrollTo(0, 1);
        setTimeout(() => window.scrollTo(0, 0), 50);
      }, 100);
    };

    // Add a one-time touch listener to trigger navigation bar hiding
    document.addEventListener('touchstart', handleTouchStart, { once: true, passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
    };
  }, []);

  return (
    <div 
      className="w-screen min-h-screen dark:bg-gray-800"
      style={{ 
        backgroundColor: 'transparent'
      }}
    >
      <Router>
        {/* MenuBar will be rendered on all pages */}

        {/* Define routes for different pages */}
        <Routes>
          <Route path="/" element={<Welcome />} /> {/* Default route */}
          <Route path="/home" element={<Home />} />
          <Route path="/create" element={<Create />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/memory" element={<Memory />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/scramble" element={<Scramble />} />
          <Route path="/dash" element={<Dash />} />
          <Route path="/type" element={<Type />} />
          <Route path="/match" element={<Match />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;