import pica from 'pica';

/**
 * Resizes an image file using Pica and exports it as a WebP Blob.
 *
 * @param {File} file - The input image file.
 * @param {number} maxWidth - The maximum width for the output image.
 * @param {number} quality - WebP quality from 0 to 1.
 * @returns {Promise<Blob>}
 */
export async function compressAndConvertToBlob(file, maxWidth = 600, quality = 0.9) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async function (event) {
      const img = new Image();
      img.onload = async function () {
        const targetWidth = img.width > maxWidth ? maxWidth : img.width;
        const scaleFactor = targetWidth / img.width;
        const targetHeight = Math.round(img.height * scaleFactor);

        const sourceCanvas = document.createElement('canvas');
        sourceCanvas.width = img.width;
        sourceCanvas.height = img.height;
        const srcCtx = sourceCanvas.getContext('2d');
        srcCtx.drawImage(img, 0, 0);

        const targetCanvas = document.createElement('canvas');
        targetCanvas.width = targetWidth;
        targetCanvas.height = targetHeight;

        try {
          await pica().resize(sourceCanvas, targetCanvas, {
            quality: 0,
            unsharpAmount: 80,
            unsharpRadius: 0.6,
            unsharpThreshold: 2,
          });
        } catch (resizeError) {
          return reject(resizeError);
        }

        targetCanvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Canvas is empty'));
          },
          'image/webp',
          quality
        );
      };
      img.onerror = (err) => reject(err);
      img.src = event.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
