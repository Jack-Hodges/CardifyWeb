import CreateCards from './Pages/CreateCards';
import MenuBar from './components/Navigation/MenuBar';
import Welcome from './Pages/Welcome';
import FlashcardQuiz from './Pages/FlashcardQuiz';
import Dashboard from './Pages/Dashboard';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

function App() {
  return (
    <div className="w-screen h-[100dvh] overflow-y-scroll bg-[#f1ebe0] dark:bg-gray-900">
      <Router>
        {/* MenuBar will be rendered on all pages */}
        <MenuBar />

        {/* Define routes for different pages */}
        <Routes>
          <Route path="/" element={<Dashboard />} /> {/* Default route */}
          <Route path="/create" element={<CreateCards />} />
          <Route path="/practice" element={<FlashcardQuiz />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;