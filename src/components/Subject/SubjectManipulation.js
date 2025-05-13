import supabase from '../../supabaseClient';

// Fetch subjects
export const fetchSubjects = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('subjects') // Table name in Supabase
      .select('*')
      .eq('user_id', userId);
    if (error) {
      console.error('Error fetching subjects:', error);
      return [];
    }
    return data;
  } catch (error) {
    console.error('Unexpected error fetching subjects:', error);
    return [];
  }
};

// Add or update subject
export const saveSubject = async (id, subjectName, subjectColor, subjectIntensity, userId, upToIndex = null, collectionId = null, pinned = false) => {
  try {
    if (id) {
      // Update existing subject
      await supabase
        .from('subjects')
        .update({ name: subjectName, colourText: subjectColor, colourIntensity: subjectIntensity, up_to_index: upToIndex, collection_id: collectionId, pinned: pinned }) // Ensure collection_id is included
        .eq('id', id);
    } else {
      // Insert new subject
      const { data, error } = await supabase
        .from('subjects')
        .insert([{ user_id: userId, name: subjectName, colourText: subjectColor, colourIntensity: subjectIntensity, flashcard_count: 0, up_to_index: upToIndex, collection_id: collectionId }]) // Ensure collection_id is included
        .select();
      if (error) {
        console.error('Error adding new subject:', error);
        return;
      }
      return data;
    }
  } catch (error) {
    console.error('Error saving subject:', error);
  }
};

// Delete subject
export const removeSubject = async (subjectId) => {
  try {
    // First, get the count of cards in this subject
    const { data: cards, error: countError } = await supabase
      .from('flashcards')
      .select('id, user_id')
      .eq('subject_id', subjectId);

    if (countError) {
      console.error('Error fetching cards for subject:', countError);
      return false;
    }

    // If there are cards, update the user's profile count
    if (cards && cards.length > 0) {
      const userId = cards[0].user_id; // All cards in a subject belong to the same user
      const cardCount = cards.length;

      // Decrement the flashcard_count in the user's profile by the number of cards
      const { error: profileError } = await supabase.rpc('decrement_flashcard_count_by', {
        user_id: userId,
        amount: cardCount
      });

      if (profileError) {
        console.error('Error updating profile flashcard count:', profileError);
        return false;
      }
    }

    // Now delete the subject (this will cascade delete the cards)
    const { error } = await supabase
      .from('subjects')
      .delete()
      .eq('id', subjectId);

    if (error) {
      console.error('Error deleting subject:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Unexpected error deleting subject:', error);
    return false;
  }
};