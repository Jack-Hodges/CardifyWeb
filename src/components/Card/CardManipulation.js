import supabase from '../../supabaseClient';

// Fetch flashcards from the Supabase database
export const fetchCards = async (subjectId) => {
  try {
    const { data, error } = await supabase
      .from('flashcards') // Table name in Supabase
      .select('*')
      .eq('subject_id', subjectId); // Fetch flashcards for a specific subject

    if (error) {
      console.error('Error fetching flashcards:', error);
      return [];
    }
    return data;
  } catch (error) {
    console.error('Unexpected error fetching flashcards:', error);
    return [];
  }
};

// Function to update a card's content
export const updateCard = async (cards, currentCardIndex, updatedFrontContent, updatedBackContent, setCards) => {
  // Get the current card ID
  const cardId = cards[currentCardIndex]?.id;

  // Update the card in the state
  const updatedCards = cards.map((card, i) =>
    i === currentCardIndex
      ? { ...card, question: updatedFrontContent, answer: updatedBackContent }
      : card
  );
  setCards(updatedCards);

  // Update the card in Supabase
  const { error } = await supabase
    .from('flashcards') // Table name in Supabase
    .update({ question: updatedFrontContent, answer: updatedBackContent })
    .eq('id', cardId); // Only update the card with the current card's ID

  if (error) {
    console.error('Error updating card:', error);
  } else {
  }
};

// Function to add a new card
export const addNewCard = async (cards, newFrontContent, newBackContent, setCards, subjectId, userId) => {
  const newCard = {
    user_id: userId,
    question: newFrontContent,
    answer: newBackContent,
    subject_id: subjectId
  };

  const { data, error } = await supabase
    .from('flashcards')
    .insert([newCard])
    .select(); // Fetch the newly added card

  if (error) {
    console.error('Error adding new card:', error);
  } else if (data?.length > 0) {
    const updatedCards = [...cards, data[0]]; // Add the new card from Supabase to the existing array
    setCards(updatedCards); // Update the cards array
  } else {
    console.error('No data returned after inserting the new card.');
  }
};

// Function to delete a card
export const deleteCard = async (cards, cardId, currentCardIndex, setCards, setCurrentCardIndex) => {
  const updatedCards = cards.filter(card => card.id !== cardId); // Remove the deleted card by filtering it out

  // Determine the new current index
  let newCurrentIndex = currentCardIndex;
  if (currentCardIndex === updatedCards.length) {
    // If the current card is the last one, show the previous one
    newCurrentIndex = currentCardIndex - 1;
  }

  setCards(updatedCards); // Update the cards array to reflect the removal
  setCurrentCardIndex(Math.max(newCurrentIndex, 0)); // Ensure index is not negative

  // Delete the card from Supabase
  const { error } = await supabase
    .from('flashcards')
    .delete()
    .eq('id', cardId); // Only delete the card with the specified ID

  if (error) {
    console.error('Error deleting card:', error);
  } else {
  }
};

export const sortCardsById = (cards) => {
  return cards.sort((a, b) => a.id - b.id); // Sort numerically by id
};