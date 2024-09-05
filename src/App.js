import CardMain from './components/Card/CardMain';
import MenuBar from './components/Navigation/MenuBar';

function App() {
  return (
    <div class="w-screen h-screen overflow-y-hidden bg-white dark:bg-gray-900">
      <MenuBar />
      <CardMain />
    </div>
    
  );
}

export default App;