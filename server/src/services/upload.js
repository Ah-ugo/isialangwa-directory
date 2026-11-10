import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';
import { env } from '../config/env.js';

export const cloudinaryEnabled = Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);
if (cloudinaryEnabled) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

/** Upload an image buffer to Cloudinary. Returns { url, publicId } from the service result. */
export const uploadImage = (buffer, options = {}) =>
  new Promise((resolve, reject) => {
    if (!cloudinaryEnabled) return reject(new Error('Image uploads are not configured on the server'));
    const stream = cloudinary.uploader.upload_stream(
      { folder: env.CLOUDINARY_FOLDER || 'isialangwa/people', resource_type: 'image', ...options },
      (err, result) => (err ? reject(err) : resolve({ url: result.secure_url, publicId: result.public_id })),
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });

/** Delete a previously uploaded image by its Cloudinary public id. Best effort. */
export const destroyImage = (publicId) => {
  if (!cloudinaryEnabled || !publicId) return Promise.resolve();
  return cloudinary.uploader.destroy(publicId);
};
