import CardMain from './components/Card/CardMain';
import MenuBar from './components/Navigation/MenuBar';
import Welcome from './Pages/Welcome';

function App() {
  return (
    <div class="w-screen h-screen overflow-y-hidden bg-[#f1ebe0] dark:bg-gray-900">
      <MenuBar />
      <CardMain />
      {/* <Welcome /> */}
    </div>
    
  );
}

export default App;