import { useState, useEffect } from 'react';
import './App.css';

import Card from './components/Card';
import CardControls from './components/CardControls';

function App() {
  const cards = [
    { frontContent: "What is the largest planet in the Solar System?", backContent: "The largest planet in the Solar System is Jupiter!" },
    { frontContent: "What is the smallest country in the world?", backContent: "The smallest country in the world is Vatican City." },
    { frontContent: "What is the capital of France?", backContent: "Flip" },
    { frontContent: "What element does 'O' represent on the periodic table?", backContent: "'O' represents Oxygen." },
    { frontContent: "What is the longest river in the world?", backContent: "The longest river in the world is the Nile." },
    { frontContent: "What is the hardest natural substance on Earth?", backContent: "The hardest natural substance on Earth is Diamond." }
  ];

  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [animateFlip, setAnimateFlip] = useState(true); // New state to control flip animation

  const handlePrevClick = () => {
    resetFlip();
    setCurrentCardIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : cards.length - 1));
  };

  const handleNextClick = () => {
    resetFlip();
    setCurrentCardIndex((prevIndex) => (prevIndex < cards.length - 1 ? prevIndex + 1 : 0));
  };

  const resetFlip = () => {
    setAnimateFlip(false); // Disable animation
    setFlipped(false);
  };

  useEffect(() => {
    setAnimateFlip(true); // Re-enable animation for regular flips
  }, [currentCardIndex]);

  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center">
      <div className="w-3/5 h-1/2 m-auto">
        <Card 
          frontContent={cards[currentCardIndex].frontContent} 
          backContent={cards[currentCardIndex].backContent} 
          flipped={flipped}
          setFlipped={setFlipped}
          animateFlip={animateFlip} // Pass the animation control state
        />
        <CardControls 
          currentCardIndex={currentCardIndex + 1} 
          totalCards={cards.length} 
          onPrevClick={handlePrevClick} 
          onNextClick={handleNextClick} 
        />
      </div>
    </div>
  );
}

export default App;