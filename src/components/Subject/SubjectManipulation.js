import supabase from '../../supabaseClient';
import { saveProfile } from '../Profile/ProfileManipulation';

const TUTORIAL_SUBJECT_ID = Number(process.env.REACT_APP_TUTORIAL_SUBJECT_ID || 136);

// Fetch subjects
export const fetchSubjects = async (user, profile = null) => {
  try {
    // Fetch user's own subjects
    const { data: ownSubjects, error: ownError } = await supabase
      .from('subjects')
      .select('*')
      .eq('user_id', user.id)
      .is('deleted_at', null);

    if (ownError) {
      console.error('Error fetching own subjects:', ownError);
      return [];
    }

    // Get the subject_ids and permissions from subject_permissions
    const { data: permissions, error: permissionsError } = await supabase
      .from('subject_permissions')
      .select('subject_id, permission')
      .eq('recipient_email', user.email);

    if (permissionsError) {
      console.error('Error fetching subject permissions:', permissionsError);
      return ownSubjects || [];
    }

    // If we have permissions, fetch the corresponding subjects
    let sharedSubjects = [];
    if (permissions && permissions.length > 0) {
      const subjectIds = permissions.map(p => p.subject_id);
      const { data: sharedData, error: sharedError } = await supabase
        .from('subjects')
        .select('*')
        .in('id', subjectIds)
        .is('deleted_at', null);
      
      if (sharedError) {
        console.error('Error fetching shared subjects:', sharedError);
      } else {
        // Add permission information to shared subjects
        sharedSubjects = (sharedData || []).map(subject => {
          const permission = permissions.find(p => p.subject_id === subject.id);
          return {
            ...subject,
            permission: permission?.permission || 'viewer',
            isShared: true,
          };
        });
      }
    }

    

    // Combine own subjects with shared subjects
    let allSubjects = [
      ...(ownSubjects || []),
      ...sharedSubjects
    ];

    // Check if user needs tutorial subject (tutorial_subject is false)
    if (profile && profile.tutorial_subject === false && TUTORIAL_SUBJECT_ID) {
      const { data: tutorialSubject, error: tutorialError } = await supabase
        .from('subjects')
        .select('*')
        .eq('id', TUTORIAL_SUBJECT_ID)
        .is('deleted_at', null)
        .maybeSingle();

      if (!tutorialError && tutorialSubject) {
        allSubjects = [tutorialSubject, ...allSubjects];
      }
    }

    return allSubjects;
  } catch (error) {
    console.error('Unexpected error fetching subjects:', error);
    return [];
  }
};

export { TUTORIAL_SUBJECT_ID };

export const dismissTutorialSubject = async (profile) => {
  if (!profile?.id) return false;

  const updated = await saveProfile(
    profile.id,
    profile.first_name,
    profile.theme,
    profile.sort_preference,
    profile.card_art,
    profile.generation_count,
    true
  );

  return Boolean(updated);
};

// Add or update subject
export const saveSubject = async (id, subjectName, subjectColor, subjectIntensity, userId, upToIndex = null, collectionId = null, pinned = false) => {
  try {
    if (id) {
      // Update existing subject
      const { data, error } = await supabase
        .from('subjects')
        .update({ name: subjectName, colourText: subjectColor, colourIntensity: subjectIntensity, up_to_index: upToIndex, collection_id: collectionId, pinned: pinned })
        .eq('id', id)
        .select();
      if (error) {
        console.error('Error updating subject:', error);
        return;
      }
      return data;
    } else {
      // Insert new subject
      const { data, error } = await supabase
        .from('subjects')
        .insert([{ user_id: userId, name: subjectName, colourText: subjectColor, colourIntensity: subjectIntensity, flashcard_count: 0, up_to_index: upToIndex, collection_id: collectionId }])
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

/** Only touch up_to_index — used by Practice “In Progress” tracking */
export const saveSubjectProgress = async (subjectId, upToIndex) => {
  try {
    const { data, error } = await supabase
      .from('subjects')
      .update({ up_to_index: upToIndex })
      .eq('id', subjectId)
      .select('id, up_to_index')
      .maybeSingle();
    if (error) {
      console.error('Error saving subject progress:', error);
      return null;
    }
    return data;
  } catch (error) {
    console.error('Unexpected error saving subject progress:', error);
    return null;
  }
};

// Soft-delete subject (and its cards)
export const removeSubject = async (subjectId) => {
  try {
    const now = new Date().toISOString();
    const { data: cards, error: countError } = await supabase
      .from('flashcards')
      .select('id, user_id')
      .eq('subject_id', subjectId)
      .is('deleted_at', null);

    if (countError) {
      console.error('Error fetching cards for subject:', countError);
      return false;
    }

    if (cards && cards.length > 0) {
      const userId = cards[0].user_id;
      const cardCount = cards.length;

      const { error: profileError } = await supabase.rpc('decrement_flashcard_count_by', {
        user_id: userId,
        amount: cardCount,
      });

      if (profileError) {
        console.error('Error updating profile flashcard count:', profileError);
        return false;
      }

      await supabase
        .from('flashcards')
        .update({ deleted_at: now })
        .eq('subject_id', subjectId)
        .is('deleted_at', null);
    }

    const { error } = await supabase
      .from('subjects')
      .update({ deleted_at: now })
      .eq('id', subjectId);

    if (error) {
      console.error('Error soft-deleting subject:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Unexpected error deleting subject:', error);
    return false;
  }
};

export const restoreSubject = async (subjectId) => {
  try {
    const { error } = await supabase
      .from('subjects')
      .update({ deleted_at: null })
      .eq('id', subjectId);
    if (error) {
      console.error('Error restoring subject:', error);
      return false;
    }
    await supabase
      .from('flashcards')
      .update({ deleted_at: null })
      .eq('subject_id', subjectId);
    return true;
  } catch (error) {
    console.error('Unexpected error restoring subject:', error);
    return false;
  }
};

export const fetchPendingShareInvites = async (email) => {
  if (!email) return [];
  const { data, error } = await supabase
    .from('share_invites')
    .select('*, subjects(id, name, colourText)')
    .eq('status', 'pending')
    .ilike('recipient_email', email);
  if (error) {
    console.error('fetchPendingShareInvites', error);
    return [];
  }
  return data || [];
};

export const respondShareInvite = async (invite, accept, recipientUserId) => {
  const status = accept ? 'accepted' : 'declined';
  const { error } = await supabase
    .from('share_invites')
    .update({ status })
    .eq('id', invite.id);
  if (error) {
    console.error('respondShareInvite', error);
    return false;
  }
  if (accept) {
    return saveShare(
      null,
      invite.owner_id,
      invite.subject_id,
      invite.recipient_email,
      invite.permission
    );
  }
  return true;
};

export const createShareInvite = async (ownerId, subjectId, recipientEmail, permission) => {
  const { data, error } = await supabase
    .from('share_invites')
    .insert([{
      owner_id: ownerId,
      subject_id: subjectId,
      recipient_email: recipientEmail,
      permission,
      status: 'pending',
    }])
    .select()
    .single();
  if (error) {
    console.error('createShareInvite', error);
    return null;
  }
  return data;
};

export const fetchPublicLink = async (subjectId, userId) => {
  const { data, error } = await supabase
    .from('public_subject_links')
    .select('*')
    .eq('subject_id', subjectId)
    .eq('created_by', userId)
    .is('revoked_at', null)
    .maybeSingle();

  if (error) {
    console.error('fetchPublicLink', error);
    return null;
  }

  return data;
};

export const createOrGetPublicLink = async (subjectId, userId) => {
  const { data: existing } = await supabase
    .from('public_subject_links')
    .select('*')
    .eq('subject_id', subjectId)
    .eq('created_by', userId)
    .is('revoked_at', null)
    .maybeSingle();
  if (existing) return existing;

  const token = crypto.randomUUID().replace(/-/g, '');
  const { data, error } = await supabase
    .from('public_subject_links')
    .insert([{ subject_id: subjectId, created_by: userId, token }])
    .select()
    .single();
  if (error) {
    console.error('createOrGetPublicLink', error);
    return null;
  }
  return data;
};

export const revokePublicLink = async (linkId) => {
  const { error } = await supabase
    .from('public_subject_links')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', linkId);
  if (error) {
    console.error('revokePublicLink', error);
    return false;
  }
  return true;
};

// Save or update subject share permissions
export const saveShare = async (id, ownerId, subjectId, recipientEmail, permission) => {
  try {
    if (id) {
      // Update existing permission
      console.log("Updating share for subject:", subjectId, "and recipient:", recipientEmail, "with permission:", permission);
      const { error: updateError } = await supabase
        .from('subject_permissions')
        .update({ 
          permission: permission,
        })
        .eq('id', id);

        console.log("Completed");
      if (updateError) {
        console.error('Error updating subject permission:', updateError);
        return false;
      }
    } else {
      // Create new permission
      const { error: insertError } = await supabase
        .from('subject_permissions')
        .insert([{
          owner_id: ownerId,
          subject_id: subjectId,
          recipient_email: recipientEmail,
          permission: permission,
        }]);

      if (insertError) {
        console.error('Error creating subject permission:', insertError);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Unexpected error saving share:', error);
    return false;
  }
};

// Remove subject share permission
export const removeShare = async (subjectId, recipientEmail) => {
  console.log("Removing share for subject:", subjectId, "and recipient:", recipientEmail);
  try {
    const { error } = await supabase
      .from('subject_permissions')
      .delete()
      .eq('subject_id', subjectId)
      .eq('recipient_email', recipientEmail);

    if (error) {
      console.error('Error removing subject permission:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Unexpected error removing share:', error);
    return false;
  }
};

// Get all shares for subjects owned by a specific user
export const getShares = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('subject_permissions')
      .select('*')
      .eq('owner_id', userId)

    if (error) {
      console.error('Error fetching subject shares:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Unexpected error fetching subject shares:', error);
    return [];
  }
};