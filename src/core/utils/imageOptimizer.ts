/**
 * Optimizador de Imágenes en el Cliente para GastroFlow / Los Brownies de Josefina.
 *
 * Reduce el tiempo de subida a Supabase Storage y el tiempo de carga en la tienda web
 * mediante redimensionamiento proporcional (máx. 1200px) y conversión a WebP de alta fidelidad.
 */

export interface ImageOptimizationOptions {
  maxDimension?: number;
  quality?: number;
  mimeType?: string;
}

const DEFAULT_OPTIONS: Required<ImageOptimizationOptions> = {
  maxDimension: 1200,
  quality: 0.82,
  mimeType: 'image/webp',
};

/**
 * Calcula las dimensiones proporcionales para no exceder la dimensión máxima especificada.
 */
export function calculateTargetDimensions(
  width: number,
  height: number,
  maxDimension: number = 1200
): { width: number; height: number } {
  if (width <= 0 || height <= 0) {
    return { width: Math.max(1, width), height: Math.max(1, height) };
  }

  if (width <= maxDimension && height <= maxDimension) {
    return { width, height };
  }

  if (width > height) {
    const ratio = height / width;
    return {
      width: maxDimension,
      height: Math.round(maxDimension * ratio),
    };
  } else {
    const ratio = width / height;
    return {
      width: Math.round(maxDimension * ratio),
      height: maxDimension,
    };
  }
}

/**
 * Optimiza y comprime un archivo de imagen en el navegador.
 * Si el archivo no es una imagen o falla el procesamiento en canvas,
 * devuelve el archivo original de forma segura (graceful degradation).
 */
export async function compressAndOptimizeImage(
  file: File,
  options: ImageOptimizationOptions = {}
): Promise<File> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Si no es un formato de imagen procesable o estamos en un entorno sin DOM, retornar original
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
    return file;
  }

  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return file;
  }

  return new Promise<File>((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      try {
        const { width: targetWidth, height: targetHeight } = calculateTargetDimensions(
          img.naturalWidth || img.width,
          img.naturalHeight || img.height,
          opts.maxDimension
        );

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        // Suavizado de imagen de alta calidad
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }

            // Si el blob optimizado es más pesado que el original (raro), mantener el original
            if (blob.size >= file.size && file.type === opts.mimeType) {
              resolve(file);
              return;
            }

            const originalNameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
            const newExtension = opts.mimeType === 'image/webp' ? '.webp' : '.jpg';
            const optimizedFile = new File([blob], `${originalNameWithoutExt}${newExtension}`, {
              type: opts.mimeType,
              lastModified: Date.now(),
            });

            resolve(optimizedFile);
          },
          opts.mimeType,
          opts.quality
        );
      } catch (err) {
        console.warn('Advertencia en compresión de imagen, usando original:', err);
        resolve(file);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}
