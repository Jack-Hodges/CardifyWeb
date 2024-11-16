import supabase from '../../supabaseClient';

export const fetchProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId);

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    if (data && data.length > 0) {
      return data[0];
    } else {
      console.warn('No profile found for the given user ID.');
      return null;
    }
  } catch (error) {
    console.error('Unexpected error fetching user profile:', error);
    return null;
  }
};

export const saveProfile = async (id, firstName, theme) => {
  try {
    if (id) {
      // Update existing profile
      const { data, error } = await supabase
        .from('profiles')
        .update( { first_name: firstName, theme: theme } )
        .eq('id', id)
        .select();

      if (error) {
        console.error('Error updating profile:', error);
        return null;
      }

      return data?.[0] || null;
    } else {
      // Insert new profile
      const { data, error } = await supabase
        .from('profiles')
        .insert([{ id: id, first_name: firstName, theme: theme }])
        .select();

      if (error) {
        console.error('Error creating new profile:', error);
        return null;
      }

      return data?.[0] || null;
    }
  } catch (error) {
    console.error('Unexpected error saving profile:', error);
    return null;
  }
};