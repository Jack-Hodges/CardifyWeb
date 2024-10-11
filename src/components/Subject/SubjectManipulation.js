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
export const saveSubject = async (id, subjectName, subjectColor, userId, upToIndex = null, collectionId = null) => {
  try {
    if (id) {
      // Update existing subject
      await supabase
        .from('subjects')
        .update({ name: subjectName, bgCol: subjectColor, up_to_index: upToIndex, collection_id: collectionId }) // Ensure collection_id is included
        .eq('id', id);
    } else {
      // Insert new subject
      const { data, error } = await supabase
        .from('subjects')
        .insert([{ user_id: userId, name: subjectName, bgCol: subjectColor, flashcard_count: 0, up_to_index: upToIndex, collection_id: collectionId }]) // Ensure collection_id is included
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