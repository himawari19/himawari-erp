-- Create Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  created_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Suppliers Table
CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  contact_name text,
  phone text,
  address text,
  created_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Update Products Table
ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES categories(id) ON DELETE SET NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS low_stock_threshold integer DEFAULT 10;

-- Create Stock Opnames Table
CREATE TABLE IF NOT EXISTS stock_opnames (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  warehouse_id uuid REFERENCES warehouses(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  system_stock integer NOT NULL,
  actual_stock integer NOT NULL,
  difference integer NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  notes text,
  created_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_opnames ENABLE ROW LEVEL SECURITY;

-- Simple Policies (assuming exists is_superadmin or similar check from previous setup)
DO $$ 
BEGIN
    -- Categories Policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow select categories') THEN
        CREATE POLICY "Allow select categories" ON categories FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all categories superadmin') THEN
        CREATE POLICY "Allow all categories superadmin" ON categories FOR ALL TO authenticated USING (is_superadmin());
    END IF;

    -- Suppliers Policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow select suppliers') THEN
        CREATE POLICY "Allow select suppliers" ON suppliers FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all suppliers superadmin') THEN
        CREATE POLICY "Allow all suppliers superadmin" ON suppliers FOR ALL TO authenticated USING (is_superadmin());
    END IF;

    -- Stock Opname Policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow select stock opnames') THEN
        CREATE POLICY "Allow select stock opnames" ON stock_opnames FOR SELECT TO authenticated USING (
            is_superadmin() OR warehouse_id = (SELECT warehouse_id FROM profiles WHERE id = auth.uid())
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow insert stock opnames') THEN
        CREATE POLICY "Allow insert stock opnames" ON stock_opnames FOR INSERT TO authenticated WITH CHECK (
            is_superadmin() OR warehouse_id = (SELECT warehouse_id FROM profiles WHERE id = auth.uid())
        );
    END IF;
END $$;
