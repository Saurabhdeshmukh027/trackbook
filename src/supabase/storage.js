import { supabase } from './config';

/**
 * Compress an image File to ~200KB max before upload.
 */
export const compressImage = (file, maxSizeKB = 200) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        const maxDim = 800;
        if (width > maxDim || height > maxDim) {
          if (width > height) { height = (height / width) * maxDim; width = maxDim; }
          else { width = (width / height) * maxDim; height = maxDim; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        let quality = 0.85;
        const tryCompress = () => {
          canvas.toBlob(
            (blob) => {
              if (blob.size / 1024 > maxSizeKB && quality > 0.3) {
                quality -= 0.1;
                tryCompress();
              } else {
                resolve(new File([blob], file.name, { type: 'image/jpeg' }));
              }
            },
            'image/jpeg',
            quality
          );
        };
        tryCompress();
      };
      const dataUrl = e.target.result;
      // Sanitize data URL to prevent XSS
      if (typeof dataUrl === 'string' && dataUrl.startsWith('data:image/')) {
        img.src = dataUrl;
      }
    };
    reader.readAsDataURL(file);
  });
};

/**
 * Upload a member photo to Supabase Storage and return the public URL.
 */
export const uploadMemberPhoto = async (businessId, memberId, file) => {
  const compressed = await compressImage(file);
  const path = `businesses/${businessId}/members/${memberId}/photo_${Date.now()}.jpg`;
  
  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, compressed, {
      cacheControl: '3600',
      upsert: true
    });
    
  if (error) {
    throw error;
  }
  
  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(path);
    
  return data.publicUrl;
};
