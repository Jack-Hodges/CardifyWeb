import supabase from '../../supabaseClient';
import { cachedAsync } from '../../utils/asyncCache';

// Fetch subjects
export const fetchCollections = async (userId) => {
  const key = `collections:${userId}`;
  return cachedAsync(key, async () => {
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
  }, 30_000);
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