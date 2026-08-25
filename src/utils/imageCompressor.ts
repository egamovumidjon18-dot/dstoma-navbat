// Firestore caps a single document at 1 MiB, and images are stored as base64
// data URIs inside the document (there is no Firebase Storage in this project).
// base64 inflates bytes by ~33%, so the usable image budget is well under 1 MiB.
// Staying comfortably below it means an upload never fails at write time — which
// used to happen silently, leaving the dialog open with no explanation.
export const MAX_STORED_IMAGE_BYTES = 700 * 1024;

/** Rough decoded size of a data URI, without allocating a copy of it. */
export const dataUrlBytes = (dataUrl: string): number => {
  const comma = dataUrl.indexOf(',');
  if (comma === -1) return dataUrl.length;
  const b64 = dataUrl.length - comma - 1;
  return Math.floor(b64 * 0.75);
};

export class ImageTooLargeError extends Error {
  constructor(public bytes: number) {
    super('Rasm hajmi juda katta');
    this.name = 'ImageTooLargeError';
  }
}

export class ImageUnreadableError extends Error {
  constructor() {
    super("Rasm formatini o'qib bo'lmadi");
    this.name = 'ImageUnreadableError';
  }
}

/**
 * Downscale and re-encode an image to a data URI.
 *
 * Retries at progressively lower quality (and then a smaller size) when the
 * result would not fit in a Firestore document, instead of handing back
 * something that will fail to save.
 */
export const compressImage = (file: File, maxSize: number = 800): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const render = (targetSize: number, quality: number): string | null => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height && width > targetSize) {
            height = Math.round((height * targetSize) / width);
            width = targetSize;
          } else if (height > targetSize) {
            width = Math.round((width * targetSize) / height);
            height = targetSize;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return null;
          ctx.drawImage(img, 0, 0, width, height);
          return canvas.toDataURL('image/jpeg', quality);
        };

        const attempts: Array<[number, number]> = [
          [maxSize, 0.6],
          [maxSize, 0.45],
          [Math.round(maxSize * 0.75), 0.45],
          [Math.round(maxSize * 0.6), 0.4],
        ];

        let last: string | null = null;
        for (const [size, quality] of attempts) {
          const out = render(size, quality);
          if (!out) break;
          last = out;
          if (dataUrlBytes(out) <= MAX_STORED_IMAGE_BYTES) {
            resolve(out);
            return;
          }
        }

        if (last) reject(new ImageTooLargeError(dataUrlBytes(last)));
        else resolve(e.target?.result as string); // no canvas context — pass through
      };
      img.onerror = () => reject(new ImageUnreadableError());
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new ImageUnreadableError());
    reader.readAsDataURL(file);
  });
};
