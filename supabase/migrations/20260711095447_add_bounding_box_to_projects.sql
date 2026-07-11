-- Migration to add bounding_box to projects table

ALTER TABLE projects ADD COLUMN bounding_box jsonb;
