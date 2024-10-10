import supabase from '../../supabaseClient';

export const fetchProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles') // Table name in Supabase
      .select('*')
      .eq('id', userId);

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    if (data && data.length > 0) {
      return data[0]; // Return the user's profile data
    } else {
      console.warn('No profile found for the given user ID.');
      return null;
    }
  } catch (error) {
    console.error('Unexpected error fetching user profile:', error);
    return null;
  }
};