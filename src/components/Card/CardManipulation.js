// CardManipulation.js
import supabase from '../../supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import pica from 'pica';

/**
 * Resizes an image file using Pica and exports it as a WebP Blob.
 * This uses high‑quality resizing so the output stays as sharp as possible
 * while producing a smaller file size.
 *
 * @param {File} file - The input image file.
 * @param {number} maxWidth - The maximum width for the output image.
 * @returns {Promise<Blob>} - A promise that resolves with the WebP Blob.
 */
async function compressAndConvertToBlob(file, maxWidth = 600) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async function (event) {
      const img = new Image();
      img.onload = async function () {
        // Only resize if needed.
        const targetWidth = img.width > maxWidth ? maxWidth : img.width;
        const scaleFactor = targetWidth / img.width;
        const targetHeight = Math.round(img.height * scaleFactor);

        // Create a source canvas with the full-size image.
        const sourceCanvas = document.createElement('canvas');
        sourceCanvas.width = img.width;
        sourceCanvas.height = img.height;
        const srcCtx = sourceCanvas.getContext('2d');
        srcCtx.drawImage(img, 0, 0);

        // Create a target canvas for the resized image.
        const targetCanvas = document.createElement('canvas');
        targetCanvas.width = targetWidth;
        targetCanvas.height = targetHeight;

        // Use Pica to resize from the source canvas into the target canvas.
        try {
          await pica().resize(sourceCanvas, targetCanvas, {
            quality: 0, // Lower interpolation quality if desired.
            unsharpAmount: 80,
            unsharpRadius: 0.6,
            unsharpThreshold: 2,
          });
        } catch (resizeError) {
          return reject(resizeError);
        }

        // Export the resized canvas to a WebP Blob with reduced quality.
        targetCanvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Canvas is empty'));
            }
          },
          'image/webp', // Use WebP format.
          0.9 // Lower quality (range: 0 to 1) produces a smaller file size.
        );
      };
      img.onerror = (err) => reject(err);
      img.src = event.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Fetches all cards for a given subject.
export const fetchCards = async (subjectId) => {
  try {
    const { data, error } = await supabase
      .from('flashcards')
      .select('*')
      .eq('subject_id', subjectId);

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

export const deleteCard = async (
  cards,
  cardId,
  currentCardIndex,
  setCards,
  setCurrentCardIndex
) => {
  // 1. Find the card that is about to be deleted.
  const cardToDelete = cards.find((card) => card.id === cardId);

  // 2. If an image URL exists, extract the file path and delete the image.
  if (cardToDelete && cardToDelete.image_url) {
    // Split by '/FlashcardImages/' to get the file part.
    const parts = cardToDelete.image_url.split('/FlashcardImages/');
    if (parts.length > 1) {
      // parts[1] might start with an extra '/', so remove any leading slashes.
      let filePath = parts[1].replace(/^\/+/, ''); 
      // filePath should now be "b0ba536b-1b95-43b9-8950-f0c441a46e0b.webp"
      
      // Delete the file from Supabase Storage.
      const { error: storageError } = await supabase.storage
        .from('FlashcardImages')
        .remove(filePath);
        
      if (storageError) {
        console.error('Error deleting image from storage:', storageError);
      } else {
        console.log('Image deleted successfully from storage.');
      }
    }
  }

  // 3. Update the UI optimistically by removing the card.
  const updatedCards = cards.filter((card) => card.id !== cardId);
  let newCurrentIndex = currentCardIndex;
  if (currentCardIndex === updatedCards.length) {
    newCurrentIndex = currentCardIndex - 1;
  }
  setCards(updatedCards);
  setCurrentCardIndex(Math.max(newCurrentIndex, 0));

  // 4. Delete the card from the database.
  const { error } = await supabase
    .from('flashcards')
    .delete()
    .eq('id', cardId);

  if (error) {
    console.error('Error deleting card from database:', error);
  } else {
    // 5. Decrement the flashcard_count in the user's profile
    const { error: profileError } = await supabase.rpc('decrement_flashcard_count', {
      user_id: cardToDelete.user_id
    });

    if (profileError) {
      console.error('Error updating profile flashcard count:', profileError);
    }
  }
};

/**
 * Sort an array of cards by ID ascending.
 */
export const sortCardsById = (cards) => {
  return cards.sort((a, b) => a.id - b.id);
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

    let result = null;

    // 3) Upsert: update if card.id exists; otherwise, insert.
    if (card.id) {
      const { data, error } = await supabase
        .from('flashcards')
        .update(payload)
        .eq('id', card.id)
        .select();

      if (error) {
        console.error('Error updating card:', error);
        return null;
      }
      result = data?.[0] || null;
    } else {
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