import supabase from '../../supabaseClient';

// Fetch subjects
export const fetchSubjects = async (userId, userEmail) => {
  try {
    // Fetch user's own subjects
    const { data: ownSubjects, error: ownError } = await supabase
      .from('subjects')
      .select('*')
      .eq('user_id', userId);

    if (ownError) {
      console.error('Error fetching own subjects:', ownError);
      return [];
    }

    // Get the subject_ids and permissions from subject_permissions
    const { data: permissions, error: permissionsError } = await supabase
      .from('subject_permissions')
      .select('subject_id, permission')
      .eq('recipient_email', userEmail);

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
        .in('id', subjectIds);
      
      if (sharedError) {
        console.error('Error fetching shared subjects:', sharedError);
      } else {
        // Add permission information to shared subjects
        sharedSubjects = (sharedData || []).map(subject => {
          const permission = permissions.find(p => p.subject_id === subject.id);
          return {
            ...subject,
            permission: permission?.permission || 'viewer' // Default to viewer if no permission found
          };
        });
      }
    }

    // Combine own subjects with shared subjects
    const allSubjects = [
      ...(ownSubjects || []),
      ...sharedSubjects
    ];

    return allSubjects;
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