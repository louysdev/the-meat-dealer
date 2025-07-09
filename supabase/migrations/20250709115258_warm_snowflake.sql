/*
  # Add is_favorite column to profiles table

  1. Changes
    - Add `is_favorite` column to `profiles` table
      - Type: boolean
      - Default: false
      - Nullable: true
    - Add index for better query performance on favorite status

  2. Security
    - No RLS changes needed as existing policies cover this column
*/

-- Add is_favorite column to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_favorite'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_favorite boolean DEFAULT false;
  END IF;
END $$;

-- Add index for better performance when filtering by favorite status
CREATE INDEX IF NOT EXISTS idx_profiles_is_favorite ON profiles (is_favorite);