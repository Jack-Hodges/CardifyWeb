import supabase from '../../supabaseClient';

// Fetch subjects
export const fetchCollections = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('collections') // Table name in Supabase
      .select('*')
      .eq('user_id', userId);
    if (error) {
      console.error('Error fetching collections:', error);
      return [];
    }
    return data;
  } catch (error) {
    console.error('Unexpected error fetching collections:', error);
    return [];
  }
};

// Add or update subject
export const saveCollection = async (id, userId, name) => {
  try {
    if (id) {
      // Update existing subject
      await supabase
        .from('collections')
        .update({ name: name})
        .eq('id', id);
    } else {
      // Insert new subject
      const { data, error } = await supabase
        .from('collections')
        .insert([{ user_id: userId, name: name}])
        .select();
      if (error) {
        console.error('Error adding new collection:', error);
        return;
      }
      return data;
    }
  } catch (error) {
    console.error('Error saving collection:', error);
  }
};

// Delete subject
export const removeCollection = async (collectionId) => {
  try {
    const { error } = await supabase
      .from('collections')
      .delete()
      .eq('id', collectionId);
    if (error) {
      console.error('Error deleting collection:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Unexpected error deleting collection:', error);
    return false;
  }
};