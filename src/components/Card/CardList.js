function CardList({ cards, onCardClick }) {
    return (
      <div className="w-full px-4">
        <h2 className="font-bold text-2xl mb-4 bg-gradient-to-br from-blue-500 to-green-300 bg-clip-text text-transparent">All Flashcards</h2>
        <ul className="flex flex-col space-y-4">
          {cards.map((card, index) => (
            <li 
              key={index} 
              className="bg-gray-50 dark:bg-gray-700 rounded-lg shadow-md p-4 h-24 flex items-center justify-center text-center overflow-hidden cursor-pointer"
              onClick={() => onCardClick(index)} // Handle card click
            >
              <p className="text-ellipsis overflow-hidden whitespace-nowrap w-full text-gray-500 dark:text-gray-200">
                {card.frontContent}
              </p>
            </li>
          ))}
        </ul>
      </div>
    );
  }
  
  export default CardList;