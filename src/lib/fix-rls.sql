-- ==========================================
-- RLS Policies for Robins Luxe Threads
-- Run this in Supabase SQL Editor
-- ==========================================

-- Drop ALL existing policies first
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- Recreate is_admin function (checks email)
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

-- PRODUCTS: anyone reads, admin writes
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read products" ON products FOR SELECT USING (true);
CREATE POLICY "Admin can insert products" ON products FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admin can update products" ON products FOR UPDATE USING (is_admin());
CREATE POLICY "Admin can delete products" ON products FOR DELETE USING (is_admin());

-- CATEGORIES: anyone reads, admin writes
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Admin can insert categories" ON categories FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admin can update categories" ON categories FOR UPDATE USING (is_admin());
CREATE POLICY "Admin can delete categories" ON categories FOR DELETE USING (is_admin());

-- ORDERS: users see own, admin sees all, anyone can insert
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (customer_id = auth.uid() OR is_admin());
CREATE POLICY "Anyone can create orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can update orders" ON orders FOR UPDATE USING (is_admin());

-- SUBSCRIBERS: anyone inserts, admin reads/updates
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can subscribe" ON subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can read subscribers" ON subscribers FOR SELECT USING (is_admin());
CREATE POLICY "Admin can update subscribers" ON subscribers FOR UPDATE USING (is_admin());

-- MESSAGES: anyone inserts, admin manages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can send messages" ON messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can read messages" ON messages FOR SELECT USING (is_admin());
CREATE POLICY "Admin can update messages" ON messages FOR UPDATE USING (is_admin());
CREATE POLICY "Admin can delete messages" ON messages FOR DELETE USING (is_admin());

-- PROFILES: users manage own, admin reads all
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (id = auth.uid() OR is_admin());
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (id = auth.uid());

-- SITE CONFIG: anyone reads, admin writes
ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read config" ON site_config FOR SELECT USING (true);
CREATE POLICY "Admin can write config" ON site_config FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admin can update config" ON site_config FOR UPDATE USING (is_admin());

-- Set all products active
UPDATE products SET is_active = true WHERE is_active IS NULL;
