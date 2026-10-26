import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();

const isConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  console.log(`[Cloudinary] Configured successfully for cloud: ${process.env.CLOUDINARY_CLOUD_NAME}`);
} else {
  console.log(`[Cloudinary] Inactive (credentials not set in .env). Data will be stored inline.`);
}

export function getCloudinaryStatus() {
  return {
    isConfigured,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || null,
  };
}

/**
 * Uploads a base64 dataUrl or remote URL to Cloudinary.
 * If Cloudinary is not configured or an error occurs, it safely returns the original input.
 *
 * @param {string} dataUri - Base64 dataUrl or image URL
 * @param {string} folder - Folder name in Cloudinary (e.g. 'tripnest/tickets' or 'tripnest/covers')
 * @returns {Promise<{ url: string, publicId: string | null }>}
 */
export async function uploadToCloudinary(dataUri, folder = 'tripnest') {
  if (!dataUri || typeof dataUri !== 'string') {
    return { url: dataUri, publicId: null };
  }

  // If already an external HTTP/HTTPS URL and not a base64 string, no need to re-upload
  if (dataUri.startsWith('http://') || dataUri.startsWith('https://')) {
    return { url: dataUri, publicId: null };
  }

  // If Cloudinary credentials are not provided, return the dataUri directly
  if (!isConfigured) {
    return { url: dataUri, publicId: null };
  }

  try {
    const uploadRes = await cloudinary.uploader.upload(dataUri, {
      folder,
      resource_type: 'auto', // Automatically handles PDF documents and images
    });
    return {
      url: uploadRes.secure_url,
      publicId: uploadRes.public_id,
    };
  } catch (err) {
    console.warn(`[Cloudinary Warning] Upload failed: ${err.message}. Retaining direct data URL.`);
    return { url: dataUri, publicId: null };
  }
}
