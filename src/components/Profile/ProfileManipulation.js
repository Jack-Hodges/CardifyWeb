import supabase from '../../supabaseClient';
import { compressAndConvertToBlob } from '../Functions/compressImage';

const PROFILE_PICTURE_BUCKET = 'ProfilePictures';
const PROFILE_PICTURE_MAX_WIDTH = 128;
const PROFILE_PICTURE_QUALITY = 0.75;

function profilePicturePath(userId) {
  return `${userId}/avatar.webp`;
}

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

export const adjustLocalFlashcardCount = (setProfile, delta) => {
  if (typeof setProfile !== 'function' || !delta) return;
  setProfile((current) => {
    if (!current) return current;
    return {
      ...current,
      flashcard_count: Math.max(0, (current.flashcard_count || 0) + delta),
    };
  });
};

export const saveProfile = async (id, firstName, theme, sort_preference = 0, card_art = 'none', tutorial_subject = null) => {
  try {
    if (id) {
      // Update existing profile
      const updateData = { 
        first_name: firstName, 
        theme: theme, 
        sort_preference: sort_preference, 
        card_art: card_art, 
      };
      
      // Only include tutorial_subject in update if it's provided
      if (tutorial_subject !== null) {
        updateData.tutorial_subject = tutorial_subject;
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', id)
        .select();

      if (error) {
        console.error('Error updating profile:', error);
        return null;
      }

      return data?.[0] || null;
    } else {
      // Insert new profile
      const insertData = { 
        id: id, 
        first_name: firstName, 
        theme: theme, 
        sort_preference: sort_preference 
      };
      
      // Only include tutorial_subject in insert if it's provided
      if (tutorial_subject !== null) {
        insertData.tutorial_subject = tutorial_subject;
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .insert([insertData])
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

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

export const normalizeUsername = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');

export const isValidUsernameFormat = (value) => USERNAME_RE.test(normalizeUsername(value));

/**
 * Set Discover username. Required, unique (case-insensitive).
 */
export const saveUsername = async (userId, username) => {
  try {
    const normalized = normalizeUsername(username);

    if (!normalized) {
      return { ok: false, error: 'Username is required.' };
    }

    if (!USERNAME_RE.test(normalized)) {
      return {
        ok: false,
        error: 'Username must be 3–20 characters: lowercase letters, numbers, or underscores.',
      };
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({ username: normalized })
      .eq('id', userId)
      .select()
      .maybeSingle();

    if (error) {
      if (error.code === '23505') {
        return { ok: false, error: 'That username is already taken.' };
      }
      if (error.code === '23514') {
        return {
          ok: false,
          error: 'Username must be 3–20 characters: lowercase letters, numbers, or underscores.',
        };
      }
      console.error('saveUsername', error);
      return { ok: false, error: error.message || 'Could not save username.' };
    }

    return { ok: true, profile: data };
  } catch (error) {
    console.error('Unexpected error saving username:', error);
    return { ok: false, error: 'Could not save username.' };
  }
};

export const uploadProfilePicture = async (userId, imageFile) => {
  try {
    const blob = await compressAndConvertToBlob(
      imageFile,
      PROFILE_PICTURE_MAX_WIDTH,
      PROFILE_PICTURE_QUALITY
    );
    const filePath = profilePicturePath(userId);

    const { error: uploadError } = await supabase.storage
      .from(PROFILE_PICTURE_BUCKET)
      .upload(filePath, blob, { contentType: 'image/webp', upsert: true });

    if (uploadError) {
      console.error('Error uploading profile picture:', uploadError);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from(PROFILE_PICTURE_BUCKET)
      .getPublicUrl(filePath);

    const avatarUrl = publicUrlData?.publicUrl || null;
    if (!avatarUrl) return null;

    const { data, error } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', userId)
      .select();

    if (error) {
      console.error('Error saving profile picture URL:', error);
      return null;
    }

    return data?.[0] || null;
  } catch (error) {
    console.error('Unexpected error uploading profile picture:', error);
    return null;
  }
};

export const removeProfilePicture = async (userId) => {
  try {
    const { error: deleteError } = await supabase.storage
      .from(PROFILE_PICTURE_BUCKET)
      .remove([profilePicturePath(userId)]);

    if (deleteError) {
      console.error('Error deleting profile picture:', deleteError);
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({ avatar_url: null })
      .eq('id', userId)
      .select();

    if (error) {
      console.error('Error clearing profile picture URL:', error);
      return null;
    }

    return data?.[0] || null;
  } catch (error) {
    console.error('Unexpected error removing profile picture:', error);
    return null;
  }
};