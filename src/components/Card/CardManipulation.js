// CardManipulation.js
import supabase from '../../supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import { compressAndConvertToBlob } from '../Functions/compressImage';

// Fetches all cards for a given subject (excludes soft-deleted).
export const fetchCards = async (subjectId) => {
  try {
    const { data, error } = await supabase
      .from('flashcards')
      .select('*')
      .eq('subject_id', subjectId)
      .is('deleted_at', null)
      .order('sort_order', { ascending: true, nullsFirst: false })
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching flashcards:', error);
      return [];
    }
    return data;
  } catch (error) {
    console.error('Unexpected error fetching flashcards:', error);
    return [];
  }
};

/** Soft-delete a card; returns the deleted card for undo. */
export const deleteCard = async (
  cards,
  cardId,
  currentCardIndex,
  setCards,
  setCurrentCardIndex
) => {
  const cardToDelete = cards.find((card) => card.id === cardId);
  if (!cardToDelete) return null;

  const updatedCards = cards.filter((card) => card.id !== cardId);
  let newCurrentIndex = currentCardIndex;
  if (currentCardIndex === updatedCards.length) {
    newCurrentIndex = currentCardIndex - 1;
  }
  setCards(updatedCards);
  setCurrentCardIndex(Math.max(newCurrentIndex, 0));

  const { error } = await supabase
    .from('flashcards')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', cardId);

  if (error) {
    console.error('Error soft-deleting card:', error);
    setCards(cards);
    setCurrentCardIndex(currentCardIndex);
    return null;
  }

  const { error: profileError } = await supabase.rpc('decrement_flashcard_count', {
    user_id: cardToDelete.user_id,
  });
  if (profileError) {
    console.error('Error updating profile flashcard count:', profileError);
  }

  return cardToDelete;
};

export const restoreCard = async (card) => {
  if (!card?.id) return null;
  const { data, error } = await supabase
    .from('flashcards')
    .update({ deleted_at: null })
    .eq('id', card.id)
    .select()
    .single();
  if (error) {
    console.error('Error restoring card:', error);
    return null;
  }
  await supabase.rpc('increment_flashcard_count', { user_id: card.user_id });
  return data;
};

export const updateCardsSortOrder = async (orderedCards) => {
  try {
    await Promise.all(
      orderedCards.map((card, index) =>
        supabase
          .from('flashcards')
          .update({ sort_order: index + 1 })
          .eq('id', card.id)
      )
    );
    return true;
  } catch (error) {
    console.error('Error updating sort order:', error);
    return false;
  }
};

/**
 * Sort cards by sort_order, then id.
 */
export const sortCardsById = (cards) => {
  return cards.sort((a, b) => {
    const ao = a.sort_order ?? a.id;
    const bo = b.sort_order ?? b.id;
    if (ao !== bo) return ao - bo;
    return a.id - b.id;
  });
};

/**
 * Upserts a card.
 *
 * If an image file is provided, the file is resized with Pica and
 * converted to a WebP Blob before uploading it to Supabase Storage.
 */
export const upsertCard = async (card, imageFile) => {
  try {
    let newImageUrl = card.image_url || null;

    // 1) If a new image file is provided, delete the old image (if one exists) and then upload the new image.
    if (imageFile) {
      // If the card already exists and has an image_url, delete the old image.
      if (card.id && card.image_url) {
        const parts = card.image_url.split('/FlashcardImages/');
        if (parts.length > 1) {
          // Remove any leading slashes from the file path.
          const filePath = parts[1].replace(/^\/+/, '');
          const { error: deleteError } = await supabase.storage
            .from('FlashcardImages')
            .remove(filePath);
          if (deleteError) {
            console.error('Error deleting old image:', deleteError);
          } else {
            console.log('Old image deleted successfully.');
          }
        }
      }

      try {
        const ext = 'webp';
        // Compress and convert the image file to a WebP blob.
        const blob = await compressAndConvertToBlob(imageFile, 600);
        // Generate a unique filename with the .webp extension.
        const fileName = `${uuidv4()}.${ext}`;

        // Upload the WebP blob to the "FlashcardImages" bucket.
        const { error: uploadError } = await supabase.storage
          .from('FlashcardImages')
          .upload(fileName, blob, { contentType: `image/${ext}` });

        if (uploadError) {
          console.error('Error uploading image:', uploadError);
        } else {
          // Retrieve the public URL for the uploaded image.
          const { data: publicUrlData } = supabase.storage
            .from('FlashcardImages')
            .getPublicUrl(fileName);
          newImageUrl = publicUrlData?.publicUrl || null;
        }
      } catch (err) {
        console.error('Error compressing/uploading image:', err);
      }
    }

    // 2) Prepare the payload.
    const payload = {
      user_id: card.user_id,
      question: card.question,
      answer: card.answer,
      subject_id: card.subject_id,
      image_url: newImageUrl,
      frontMode: card.frontMode,
      backMode: card.backMode,
    };
    if (card.sort_order != null) payload.sort_order = card.sort_order;

    let result = null;

    // 3) Upsert: update if card.id exists; otherwise, insert.
    if (card.id) {
      const { data, error } = await supabase
        .from('flashcards')
        .update(payload)
        .eq('id', card.id)
        .is('deleted_at', null)
        .select();

      if (error) {
        console.error('Error updating card:', error);
        return null;
      }
      result = data?.[0] || null;
    } else {
      if (payload.sort_order == null) {
        const { data: maxRow } = await supabase
          .from('flashcards')
          .select('sort_order')
          .eq('subject_id', card.subject_id)
          .is('deleted_at', null)
          .order('sort_order', { ascending: false })
          .limit(1)
          .maybeSingle();
        payload.sort_order = (maxRow?.sort_order || 0) + 1;
      }
      const { data, error } = await supabase
        .from('flashcards')
        .insert([payload])
        .select();

      if (error) {
        console.error('Error inserting new card:', error);
        return null;
      }
      result = data?.[0] || null;

      // If this was a new card, increment the flashcard_count in the user's profile
      if (result) {
        const { error: profileError } = await supabase.rpc('increment_flashcard_count', {
          user_id: card.user_id
        });

        if (profileError) {
          console.error('Error updating profile flashcard count:', profileError);
        }
      }
    }

    return result;
  } catch (err) {
    console.error('Unexpected error in upsertCard:', err);
    return null;
  }
};

const BULK_INSERT_CHUNK = 100;

/**
 * Insert many new cards in chunked batches (no images).
 * One sort_order lookup, one profile count RPC — used by import / AI generate.
 */
export const bulkInsertCards = async (cards) => {
  if (!cards?.length) return [];

  const subjectId = cards[0].subject_id;
  const userId = cards[0].user_id;
  if (!subjectId || !userId) {
    throw new Error('Each card needs subject_id and user_id');
  }

  const { data: maxRow, error: maxError } = await supabase
    .from('flashcards')
    .select('sort_order')
    .eq('subject_id', subjectId)
    .is('deleted_at', null)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (maxError) {
    console.error('Error reading max sort_order:', maxError);
    throw maxError;
  }

  let nextOrder = (maxRow?.sort_order || 0) + 1;
  const payloads = cards.map((card) => ({
    user_id: card.user_id,
    question: card.question,
    answer: card.answer,
    subject_id: card.subject_id,
    image_url: card.image_url || null,
    frontMode: card.frontMode || 'text',
    backMode: card.backMode || 'text',
    sort_order: card.sort_order != null ? card.sort_order : nextOrder++,
  }));

  const inserted = [];
  for (let i = 0; i < payloads.length; i += BULK_INSERT_CHUNK) {
    const chunk = payloads.slice(i, i + BULK_INSERT_CHUNK);
    const { data, error } = await supabase.from('flashcards').insert(chunk).select();
    if (error) {
      console.error('Error bulk inserting cards:', error);
      throw error;
    }
    inserted.push(...(data || []));
  }

  if (inserted.length > 0) {
    const { error: profileError } = await supabase.rpc('increment_flashcard_count_by', {
      user_id: userId,
      amount: inserted.length,
    });
    if (profileError) {
      console.error('Error updating profile flashcard count:', profileError);
    }
  }

  return inserted;
};