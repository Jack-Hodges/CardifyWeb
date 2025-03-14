import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreateCards from '../components/CreateCards/CreateCards'; // Adjust the path if necessary
import { fetchCards, addNewCard, updateCard, deleteCard } from '../components/Card/CardManipulation'; // Mock the external functions

// Mock the CardManipulation functions
jest.mock('../components/Card/CardManipulation');

describe('CreateCards Component', () => {

  beforeEach(() => {
    // Mock the initial state of flashcards fetched from the database
    fetchCards.mockResolvedValue([
      { id: 1, question: 'Card 1', answer: 'Answer 1' },
    ]);
  });

  it('should render the CreateCards component and fetch cards on load', async () => {
    render(<CreateCards />);

    // Ensure the flashcards are rendered correctly
    await waitFor(() => {
      expect(screen.getByText('Card 1')).toBeInTheDocument();
    });
  });

  it('should add a new card and display it', async () => {
    render(<CreateCards />);

    // Simulate clicking the Add button
    const addButton = screen.getByText('Add');
    fireEvent.click(addButton);

    // Fill in the new card details in the modal
    const questionInput = screen.getByPlaceholderText('Enter the question here');
    fireEvent.change(questionInput, { target: { value: 'New Question' } });

    const answerInput = screen.getByPlaceholderText('Enter the answer here');
    fireEvent.change(answerInput, { target: { value: 'New Answer' } });

    // Mock adding a new card and the result from Supabase
    addNewCard.mockResolvedValueOnce([
      { id: 2, question: 'New Question', answer: 'New Answer' },
    ]);

    // Simulate clicking the Save button
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    // Verify that the new card is now displayed
    await waitFor(() => {
      expect(screen.getByText('New Question')).toBeInTheDocument();
    });
  });

  it('should update a card and display the updated content', async () => {
    render(<CreateCards />);

    // Click on the card to open the edit modal
    const card = screen.getByText('Card 1');
    fireEvent.click(card);

    // Simulate editing the card by opening the edit modal
    const editButton = screen.getByText('Edit Question and Answer');
    fireEvent.click(editButton);

    // Change the question and answer
    const questionInput = screen.getByPlaceholderText('Enter the question here');
    fireEvent.change(questionInput, { target: { value: 'Updated Question' } });

    const answerInput = screen.getByPlaceholderText('Enter the answer here');
    fireEvent.change(answerInput, { target: { value: 'Updated Answer' } });

    // Mock updating the card
    updateCard.mockResolvedValueOnce([
      { id: 1, question: 'Updated Question', answer: 'Updated Answer' },
    ]);

    // Simulate clicking the Save button
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    // Verify that the card is updated with the new content
    await waitFor(() => {
      expect(screen.getByText('Updated Question')).toBeInTheDocument();
      expect(screen.getByText('Updated Answer')).toBeInTheDocument();
    });
  });

  it('should delete a card and remove it from the list', async () => {
    render(<CreateCards />);

    // Click on the card to open the delete modal
    const card = screen.getByText('Card 1');
    fireEvent.click(card);

    // Simulate clicking the delete button
    const deleteButton = screen.getByText('Delete Flashcard');
    fireEvent.click(deleteButton);

    // Mock the delete operation
    deleteCard.mockResolvedValueOnce([]);

    // Confirm the deletion
    const confirmDeleteButton = screen.getByText('Delete');
    fireEvent.click(confirmDeleteButton);

    // Verify that the card is removed from the UI
    await waitFor(() => {
      expect(screen.queryByText('Card 1')).not.toBeInTheDocument();
    });
  });
});