-- Remove total_duration_minutes from get_private_video_stats function
CREATE OR REPLACE FUNCTION get_private_video_stats(profile_uuid uuid)
RETURNS TABLE(
  videos_count integer,
  photos_count integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE((SELECT COUNT(*)::integer FROM private_videos WHERE profile_id = profile_uuid), 0) as videos_count,
    COALESCE((SELECT COUNT(*)::integer FROM private_photos WHERE profile_id = profile_uuid), 0) as photos_count;
END;
$$ LANGUAGE plpgsql STABLE;
