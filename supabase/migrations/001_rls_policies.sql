-- ============================================================
-- NEPSOP Supabase RLS Policies
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable RLS on both tables
ALTER TABLE site_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- site_stats policies
-- ============================================================

-- Public can read site_stats
CREATE POLICY "Public can view site_stats"
  ON site_stats
  FOR SELECT
  TO public
  USING (true);

-- Only authenticated users can update site_stats
CREATE POLICY "Authenticated users can update site_stats"
  ON site_stats
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Only authenticated users can insert site_stats
CREATE POLICY "Authenticated users can insert site_stats"
  ON site_stats
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================
-- blogs policies
-- ============================================================

-- Public can read published blogs
CREATE POLICY "Public can view published blogs"
  ON blogs
  FOR SELECT
  TO public
  USING (status = 'published');

-- Authenticated users can read all blogs (including drafts)
CREATE POLICY "Authenticated users can view all blogs"
  ON blogs
  FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can create blogs
CREATE POLICY "Authenticated users can create blogs"
  ON blogs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated users can update blogs
CREATE POLICY "Authenticated users can update blogs"
  ON blogs
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Authenticated users can delete blogs
CREATE POLICY "Authenticated users can delete blogs"
  ON blogs
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- Prevent public sign-ups (no public registration)
-- ============================================================
-- Note: Supabase allows disabling sign-ups in the dashboard:
-- Authentication > Settings > Disable Sign-ups
-- Or run this SQL to revoke the ability for anon to sign up:

-- If you want to block anonymous inserts entirely on auth schema,
-- that's handled at the Supabase dashboard level.
-- Make sure to disable "Allow sign-ups" in:
-- Authentication > Settings
