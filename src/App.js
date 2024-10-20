import CreateCards from './Pages/CreateCards';
import Welcome from './Pages/Welcome';
import Practice from './Pages/Practice';
import Dashboard from './Pages/Dashboard';
import Memory from './Pages/Card Games/Memory';
import Home from './Pages/Home';
import Quiz from './Pages/Card Games/Quiz';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

function App() {
  return (
    <div className="w-screen h-[100dvh] overflow-y-scroll sm:overflow-y-hidden bg-[#f1ebe0] dark:bg-gray-900">
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
        </Routes>
      </Router>
    </div>
  );
}

export default App;