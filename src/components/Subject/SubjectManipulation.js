import supabase from '../../supabaseClient';

// Fetch subjects
export const fetchSubjects = async (user, profile = null) => {
  try {
    // Fetch user's own subjects
    const { data: ownSubjects, error: ownError } = await supabase
      .from('subjects')
      .select('*')
      .eq('user_id', user.id);

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

    // Fetch studyhub subjects for this user (subject ids in store_subjects)
    let studyhubSubjects = [];
    const { data: storeSubjectIds, error: storeSubjectsError } = await supabase
      .from('store_subjects')
      .select('subject_id, colour, intensity')
      .eq('owner_id', user.id);

    let studyhubIds = [];
    if (storeSubjectsError) {
      console.error('Error fetching store_subjects:', storeSubjectsError);
    } else if (storeSubjectIds && storeSubjectIds.length > 0) {
      studyhubIds = storeSubjectIds.map(row => row.subject_id);
      const { data: fetchedStudyhubSubjects, error: studyhubError } = await supabase
        .from('subjects')
        .select('*')
        .in('id', studyhubIds);
      if (studyhubError) {
        console.error('Error fetching studyhub subjects:', studyhubError);
      } else {
        // Merge the color/intensity from store_subjects into the subject
        studyhubSubjects = (fetchedStudyhubSubjects || []).map(subject => {
          const storeEntry = storeSubjectIds.find(row => row.subject_id === subject.id);
          return {
            ...subject,
            colour: storeEntry?.colour,         // Use StudyHub colour
            intensity: storeEntry?.intensity,   // Use StudyHub intensity
            studyhub: true
          };
        });
      }
    }

    // Remove StudyHub subjects from sharedSubjects
    if (studyhubIds.length > 0) {
      sharedSubjects = sharedSubjects.filter(subject => !studyhubIds.includes(subject.id));
    }

    // Combine own subjects, shared subjects, and studyhub subjects
    let allSubjects = [
      ...(ownSubjects || []),
      ...sharedSubjects,
      ...studyhubSubjects
    ];

    // Remove duplicate subjects by id
    const seen = new Set();
    allSubjects = allSubjects.filter(subject => {
      if (seen.has(subject.id)) return false;
      seen.add(subject.id);
      return true;
    });

    // Check if user needs tutorial subject (tutorial_subject is false)
    if (profile && profile.tutorial_subject === false) {
      // Fetch the tutorial subject with ID 136
      const { data: tutorialSubject, error: tutorialError } = await supabase
        .from('subjects')
        .select('*')
        .eq('id', 136)
        .single();

      if (!tutorialError && tutorialSubject) {
        // Add tutorial subject to the beginning of the list
        allSubjects = [tutorialSubject, ...allSubjects];
      }
    }

    return allSubjects;
  } catch (error) {
    console.error('Unexpected error fetching subjects:', error);
    return [];
  }
};

// Add or update subject
export const saveSubject = async (id, subjectName, subjectColor, subjectIntensity, userId, upToIndex = null, collectionId = null, pinned = false, studyhubVisibility) => {

  try {
    if (id) {
      // Update existing subject
      await supabase
        .from('subjects')
        .update({ name: subjectName, colourText: subjectColor, colourIntensity: subjectIntensity, up_to_index: upToIndex, collection_id: collectionId, pinned: pinned, published: studyhubVisibility }) // Ensure collection_id is included
        .eq('id', id);
    } else {
      // Insert new subject
      const { data, error } = await supabase
        .from('subjects')
        .insert([{ user_id: userId, name: subjectName, colourText: subjectColor, colourIntensity: subjectIntensity, flashcard_count: 0, up_to_index: upToIndex, collection_id: collectionId, published: studyhubVisibility }]) // Ensure collection_id is included
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

export const saveStudyHubSubject = async (id, userId, subjectColor, subjectIntensity) => {
  try {
    if (id) {
      // Update existing subject
      await supabase
        .from('store_subjects')
        .update({colour: subjectColor, intensity: subjectIntensity})
        .eq('subject_id', id)
        .eq('owner_id', userId);
    } else {
      console.error('Error saving studyhub subject: No id provided');
    }
  } catch (error) {
    console.error('Error saving studyhub subject:', error);
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
      const { error: updateError } = await supabase
        .from('subject_permissions')
        .update({ 
          permission: permission,
        })
        .eq('id', id);

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