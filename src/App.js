import CreateCards from './Pages/CreateCards';
import Welcome from './Pages/Welcome';
import Practice from './Pages/Practice';
import Dashboard from './Pages/Dashboard';
import Memory from './Pages/Card Games/Memory';
import Home from './Pages/Home';
import Quiz from './Pages/Card Games/Quiz';
import Scramble from './Pages/Card Games/Scramble';
import Dash from './Pages/Card Games/Dash';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { useUser } from './UserContext';

function App() {

  const { theme } = useUser();

  return (
    <div className="w-screen h-[100dvh] overflow-y-scroll sm:overflow-y-hidden bg-[#f1ebe0] dark:bg-gray-800 bg-cover bg-screen" style={{ backgroundImage: theme ? theme.image : ''}}>
      <Router>
        {/* MenuBar will be rendered on all pages */}

        {/* Define routes for different pages */}
        <Routes>
          <Route path="/" element={<Welcome />} /> {/* Default route */}
          <Route path="/home" element={<Home />} />
          <Route path="/create" element={<CreateCards />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/memory" element={<Memory />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/scramble" element={<Scramble />} />
          <Route path="/dash" element={<Dash />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;