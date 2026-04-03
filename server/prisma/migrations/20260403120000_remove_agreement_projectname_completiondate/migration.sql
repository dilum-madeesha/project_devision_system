-- Drop agreement projectName and completionDate columns
ALTER TABLE `agreements`
  DROP COLUMN `projectName`,
  DROP COLUMN `completionDate`;