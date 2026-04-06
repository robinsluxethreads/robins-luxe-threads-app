-- =====================================================
-- ADMIN DASHBOARD RLS POLICIES
-- Run this in your Supabase SQL editor
-- =====================================================

-- Drop existing conflicting policies first
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- Helper function to check if user email is an admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT email IN (
      'robinsluxethreads@gmail.com',
      'robinsthangeshwari@gmail.com',
      'wilsonponnupandi@gmail.com'
    )
    FROM auth.users
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =====================================================
-- PRODUCTS TABLE
-- =====================================================

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Anyone can read active products
CREATE POLICY "Public can read active products" ON products
  FOR SELECT USING (is_active = true);

-- Admins can read all products (including inactive)
CREATE POLICY "Admins can read all products" ON products
  FOR SELECT USING (is_admin());

-- Admins can insert products
CREATE POLICY "Admins can insert products" ON products
  FOR INSERT WITH CHECK (is_admin());

-- Admins can update products
CREATE POLICY "Admins can update products" ON products
  FOR UPDATE USING (is_admin());

-- Admins can delete products
CREATE POLICY "Admins can delete products" ON products
  FOR DELETE USING (is_admin());


-- =====================================================
-- ORDERS TABLE
-- =====================================================

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Users can read their own orders
CREATE POLICY "Users can read own orders" ON orders
  FOR SELECT USING (customer_id = auth.uid());

-- Admins can read all orders
CREATE POLICY "Admins can read all orders" ON orders
  FOR SELECT USING (is_admin());

-- Authenticated users can insert orders (placing orders)
CREATE POLICY "Authenticated can insert orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Admins can update orders (status changes)
CREATE POLICY "Admins can update orders" ON orders
  FOR UPDATE USING (is_admin());


-- =====================================================
-- MESSAGES TABLE
-- =====================================================

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Anyone can insert messages (contact form)
CREATE POLICY "Anyone can insert messages" ON messages
  FOR INSERT WITH CHECK (true);

-- Admins can read all messages
CREATE POLICY "Admins can read messages" ON messages
  FOR SELECT USING (is_admin());

-- Admins can update messages (mark read/unread)
CREATE POLICY "Admins can update messages" ON messages
  FOR UPDATE USING (is_admin());

-- Admins can delete messages
CREATE POLICY "Admins can delete messages" ON messages
  FOR DELETE USING (is_admin());


-- =====================================================
-- SUBSCRIBERS TABLE
-- =====================================================

ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (subscribe)
CREATE POLICY "Anyone can subscribe" ON subscribers
  FOR INSERT WITH CHECK (true);

-- Admins can read all subscribers
CREATE POLICY "Admins can read subscribers" ON subscribers
  FOR SELECT USING (is_admin());

-- Admins can update subscribers
CREATE POLICY "Admins can update subscribers" ON subscribers
  FOR UPDATE USING (is_admin());


-- =====================================================
-- PROFILES TABLE
-- =====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (id = auth.uid());

-- Admins can read all profiles
CREATE POLICY "Admins can read all profiles" ON profiles
  FOR SELECT USING (is_admin());

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (id = auth.uid());


-- =====================================================
-- SITE_CONFIG TABLE
-- =====================================================

ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;

-- Anyone can read site config
CREATE POLICY "Anyone can read site config" ON site_config
  FOR SELECT USING (true);

-- Admins can insert/update/delete site config
CREATE POLICY "Admins can insert site config" ON site_config
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can update site config" ON site_config
  FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can delete site config" ON site_config
  FOR DELETE USING (is_admin());


-- =====================================================
-- CATEGORIES TABLE
-- =====================================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Anyone can read categories
CREATE POLICY "Anyone can read categories" ON categories
  FOR SELECT USING (true);

-- Admins can manage categories
CREATE POLICY "Admins can insert categories" ON categories
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can update categories" ON categories
  FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can delete categories" ON categories
  FOR DELETE USING (is_admin());


-- =====================================================
-- Add is_read column to messages if not exists
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'is_read'
  ) THEN
    ALTER TABLE messages ADD COLUMN is_read boolean DEFAULT false;
  END IF;
END $$;

-- =====================================================
-- Add is_active column to subscribers if not exists
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscribers' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE subscribers ADD COLUMN is_active boolean DEFAULT true;
  END IF;
END $$;

-- =====================================================
-- Ensure site_config has unique key constraint
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'site_config_key_key'
  ) THEN
    ALTER TABLE site_config ADD CONSTRAINT site_config_key_key UNIQUE (key);
  END IF;
END $$;
