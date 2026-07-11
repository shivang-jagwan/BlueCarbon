-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Migrate existing JSONB spatial columns to real geometry types
-- First add new geometry columns alongside existing ones
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS location_point  GEOGRAPHY(POINT, 4326),
  ADD COLUMN IF NOT EXISTS boundary_geom   GEOGRAPHY(POLYGON, 4326);

-- Populate from existing lat/lng columns
UPDATE public.projects
SET location_point = ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)::geography
WHERE center_lat IS NOT NULL AND center_lng IS NOT NULL;

-- Create spatial index for fast geospatial queries
CREATE INDEX IF NOT EXISTS idx_projects_location
  ON public.projects USING GIST(location_point);

CREATE INDEX IF NOT EXISTS idx_projects_boundary
  ON public.projects USING GIST(boundary_geom);
