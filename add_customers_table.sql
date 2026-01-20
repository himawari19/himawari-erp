-- Customer Management Schema

-- 1. Create Customers Table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  phone text,
  email text,
  address text,
  created_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Update Transactions Table
-- Add customer_id (nullable, because guests can buy too)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='customer_id') THEN
        ALTER TABLE transactions ADD COLUMN customer_id uuid REFERENCES customers(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- 4. Policies
-- Allow read/write for authenticated users (Superadmin, Gudang, Kasir need access)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all customers access') THEN
        CREATE POLICY "Allow all customers access" ON customers FOR ALL TO authenticated USING (true);
    END IF;
END $$;
