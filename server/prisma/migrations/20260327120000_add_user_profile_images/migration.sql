-- Add Cloudinary image fields for user profile pictures
ALTER TABLE `users`
ADD COLUMN `profileImageUrl` VARCHAR(1024) NULL,
ADD COLUMN `profileImagePublicId` VARCHAR(255) NULL;
