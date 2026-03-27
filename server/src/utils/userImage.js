import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const USER_IMAGES_DIR = path.join(__dirname, '../../uploads/user-images');

export const ensureUserImagesDir = () => {
  if (!fs.existsSync(USER_IMAGES_DIR)) {
    fs.mkdirSync(USER_IMAGES_DIR, { recursive: true });
  }
};

export const listUserImageFiles = (userId) => {
  ensureUserImagesDir();
  const prefix = `${userId}.`;
  return fs.readdirSync(USER_IMAGES_DIR).filter((name) => name.startsWith(prefix));
};

export const findUserImageFilename = (userId) => {
  const matches = listUserImageFiles(userId);
  return matches.length > 0 ? matches[0] : null;
};

export const buildUserImageUrl = (userId) => {
  const filename = findUserImageFilename(userId);
  return filename ? `/uploads/user-images/${filename}` : null;
};

export const deleteUserImageFiles = (userId) => {
  const files = listUserImageFiles(userId);
  files.forEach((filename) => {
    const filePath = path.join(USER_IMAGES_DIR, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });
  return files.length;
};
