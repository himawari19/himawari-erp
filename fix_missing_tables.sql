-- Consolidated schema fix for missing tables (Transfer, Categories, Suppliers, Opnames)

-- 1. Create Stock Transfers Table
CREATE TABLE IF NOT EXISTS stock_transfers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  from_warehouse_id uuid REFERENCES warehouses(id) ON DELETE CASCADE NOT NULL,
  to_warehouse_id uuid REFERENCES warehouses(id) ON DELETE CASCADE NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  user_id uuid REFERENCES auth.users(id),
  created_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Transfers
ALTER TABLE stock_transfers ENABLE ROW LEVEL SECURITY;

-- 2. Create Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  created_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Suppliers Table
CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  contact_name text,
  phone text,
  address text,
  created_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Stock Opnames Table
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

-- Enable RLS for new tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_opnames ENABLE ROW LEVEL SECURITY;

-- Update Products Table (Add Columns if missing)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='category_id') THEN
        ALTER TABLE products ADD COLUMN category_id uuid REFERENCES categories(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='supplier_id') THEN
        ALTER TABLE products ADD COLUMN supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='low_stock_threshold') THEN
        ALTER TABLE products ADD COLUMN low_stock_threshold integer DEFAULT 10;
    END IF;
END $$;

-- Policies
DO $$ 
BEGIN
    -- Stock transfers visibility
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Stock transfers visibility') THEN
        CREATE POLICY "Stock transfers visibility" ON stock_transfers FOR SELECT USING (
          is_superadmin() OR
          from_warehouse_id = (SELECT warehouse_id FROM profiles WHERE id = auth.uid()) OR
          to_warehouse_id = (SELECT warehouse_id FROM profiles WHERE id = auth.uid())
        );
    END IF;

    -- Allow insert stock transfers
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow insert stock transfers') THEN
        CREATE POLICY "Allow insert stock transfers" ON stock_transfers FOR INSERT WITH CHECK (
          is_superadmin() OR
          from_warehouse_id = (SELECT warehouse_id FROM profiles WHERE id = auth.uid())
        );
    END IF;

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
