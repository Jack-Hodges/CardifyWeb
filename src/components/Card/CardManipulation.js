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

/**
 * Fetch flashcards from the Supabase database
 * (Includes image_url if present)
 */
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

/**
 * Add a new card (with optional image upload to Supabase storage).
 */
export const addNewCard = async (
  cards,
  newFrontContent,
  newBackContent,
  setCards,
  subjectId,
  userId,
  imageFile // <-- optional File from <input type="file" />
) => {
  let imageUrl = null;
  console.log('Adding card');

  // If an image file is provided, compress & upload
  if (imageFile) {
    console.log('Uploading image file');
    try {
      const ext = imageFile.type.split('/')[1];
      // 1) Compress the image to a dataURL
      const compressedDataURL = await compressAndConvertToDataURL(imageFile);

      // 2) Convert dataURL to Blob
      const blob = dataURLToBlob(compressedDataURL);

      // 3) Create a unique filename
      const fileName = `${uuidv4()}.${ext}`;

      // 4) Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('FlashcardImages') // your bucket name
        .upload(fileName, blob, { contentType: `image/${ext}` });

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
      } else {
        // 5) Retrieve the public URL (or a signed URL if you prefer)
        const { data: publicUrlData } = supabase.storage
          .from('FlashcardImages')
          .getPublicUrl(fileName);
        imageUrl = publicUrlData?.publicUrl || null;
      }
    } catch (err) {
      console.error('Error compressing/uploading image:', err);
    }
  }

  // Now create the new card, storing the image_url
  const newCard = {
    user_id: userId,
    question: newFrontContent,
    answer: newBackContent,
    subject_id: subjectId,
    image_url: imageUrl,
  };

  const { data, error } = await supabase
    .from('flashcards')
    .insert([newCard])
    .select();

  if (error) {
    console.error('Error adding new card:', error);
  } else if (data?.length > 0) {
    const updatedCards = [...cards, data[0]];
    setCards(updatedCards);
  } else {
    console.error('No data returned after inserting the new card.');
  }
};

/**
 * Update a card's content and optionally its image.
 */
export const updateCard = async (
  cards,
  currentCardIndex,
  updatedFrontContent,
  updatedBackContent,
  setCards,
  imageFile // <-- optional File
) => {
  const cardId = cards[currentCardIndex]?.id;

  let imageUrl = null;

  if (imageFile) {
    try {
      // Same compression/upload steps
      const compressedDataURL = await compressAndConvertToDataURL(imageFile);
      const blob = dataURLToBlob(compressedDataURL);
      const fileName = `${uuidv4()}.jpg`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('FlashcardImages')
        .upload(fileName, blob, { contentType: 'image/jpeg' });

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
      } else {
        const { data: publicUrlData } = supabase.storage
          .from('FlashcardImages')
          .getPublicUrl(fileName);
        imageUrl = publicUrlData?.publicUrl || null;
      }
    } catch (err) {
      console.error('Error compressing/uploading image:', err);
    }
  }

  // Update card in local state
  const updatedCards = cards.map((card, i) => {
    if (i === currentCardIndex) {
      return {
        ...card,
        question: updatedFrontContent,
        answer: updatedBackContent,
        // Only update image_url if we actually uploaded a new one:
        ...(imageUrl ? { image_url: imageUrl } : {}),
      };
    }
    return card;
  });
  setCards(updatedCards);

  // Prepare payload for Supabase
  const updatePayload = {
    question: updatedFrontContent,
    answer: updatedBackContent,
  };
  if (imageUrl) {
    updatePayload.image_url = imageUrl;
  }

  // Update in Supabase
  const { error } = await supabase
    .from('flashcards')
    .update(updatePayload)
    .eq('id', cardId);

  if (error) {
    console.error('Error updating card:', error);
  }
};

/**
 * Delete a card (from DB). 
 * Note: This doesn't remove the image from storage. 
 * If you want to remove the actual file, 
 * you need to store the object path and call supabase.storage.from('flashcards').remove([path]).
 */
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