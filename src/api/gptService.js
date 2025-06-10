import { parseCSVString } from '../components/Card/ImportService';

export const generateFlashcards = async (description, number) => {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description, number })
  });

  if (!response.ok) {
    throw new Error('Failed to generate flashcards');
  }

  const { csv } = await response.json();
  return await parseCSVString(csv);
};
