// CardManipulation.js
import supabase from '../../supabaseClient';
import { v4 as uuidv4 } from 'uuid';

/**
 * Utility function: compress an image file in the browser,
 * returning a dataURL (Base64) at ~maxWidth and ~quality.
 */
async function compressAndConvertToDataURL(file, maxWidth = 600, quality = 0.5) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function (event) {
      const img = new Image();
      img.onload = function () {
        // Create a <canvas> and draw the compressed image
        const canvas = document.createElement('canvas');
        const scaleSize = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Convert canvas to a base64 string (JPEG, quality ~0.7)
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.src = event.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Utility function: convert a dataURL to a Blob for uploading.
 */
function dataURLToBlob(dataURL) {
  const [meta, base64Content] = dataURL.split(',');
  const byteString = atob(base64Content);
  const mimeString = meta.match(/:(.*?);/)?.[1] || 'image/jpeg';

  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
}

// Fetches all cards for a given subject
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

// Removes a present card from database
export const deleteCard = async (
  cards,
  cardId,
  currentCardIndex,
  setCards,
  setCurrentCardIndex
) => {
  const updatedCards = cards.filter(card => card.id !== cardId);

  // Adjust current index if needed
  let newCurrentIndex = currentCardIndex;
  if (currentCardIndex === updatedCards.length) {
    newCurrentIndex = currentCardIndex - 1;
  }
  setCards(updatedCards);
  setCurrentCardIndex(Math.max(newCurrentIndex, 0));

  // Delete row in Supabase
  const { error } = await supabase
    .from('flashcards')
    .delete()
    .eq('id', cardId);

  if (error) {
    console.error('Error deleting card:', error);
  }
};

/**
 * Sort an array of cards by ID ascending
 */
export const sortCardsById = (cards) => {
  return cards.sort((a, b) => a.id - b.id);
};

// Updates or inserts a card if not present
export const upsertCard = async (card, imageFile) => {
  try {
    let newImageUrl = card.image_url || null;

    // 1) If a new image file is provided, compress & upload to Supabase Storage
    if (imageFile) {
      try {
        const ext = imageFile.type.split('/')[1] || 'jpg';

        // Compress & convert to dataURL
        const compressedDataURL = await compressAndConvertToDataURL(imageFile);
        // Convert dataURL to Blob
        const blob = dataURLToBlob(compressedDataURL);

        // Unique filename
        const fileName = `${uuidv4()}.${ext}`;

        // Upload to bucket "FlashcardImages"
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('FlashcardImages')
          .upload(fileName, blob, { contentType: `image/${ext}` });

        if (uploadError) {
          console.error('Error uploading image:', uploadError);
        } else {
          // Grab the public URL
          const { data: publicUrlData } = supabase.storage
            .from('FlashcardImages')
            .getPublicUrl(fileName);
          newImageUrl = publicUrlData?.publicUrl || null;
        }
      } catch (err) {
        console.error('Error compressing/uploading image:', err);
      }
    }

    // 2) Prepare the DB payload
    const payload = {
      user_id: card.user_id,
      question: card.question,
      answer: card.answer,
      subject_id: card.subject_id,
      image_url: newImageUrl,
      frontMode: card.frontMode,
      backMode: card.backMode,
    };

    // 3) Upsert logic: if card.id => update, else insert
    if (card.id) {
      // ---- Update existing record ----
      const { data, error } = await supabase
        .from('flashcards')
        .update(payload)
        .eq('id', card.id)
        .select();

      if (error) {
        console.error('Error updating card:', error);
        return null;
      }
      // Return the updated record (usually data[0])
      return data?.[0] || null;
    } else {
      // ---- Insert new record ----
      const { data, error } = await supabase
        .from('flashcards')
        .insert([payload])
        .select();

      if (error) {
        console.error('Error inserting new card:', error);
        return null;
      }

      // Return the newly inserted record
      return data?.[0] || null;
    }
  } catch (err) {
    console.error('Unexpected error in upsertCard:', err);
    return null;
  }
};
