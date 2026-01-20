-- Create Stock Transfers Table
CREATE TABLE IF NOT EXISTS stock_transfers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  from_warehouse_id uuid REFERENCES warehouses(id) ON DELETE CASCADE NOT NULL,
  to_warehouse_id uuid REFERENCES warehouses(id) ON DELETE CASCADE NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  user_id uuid REFERENCES auth.users(id),
  created_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE stock_transfers ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Stock transfers visibility') THEN
        CREATE POLICY "Stock transfers visibility" ON stock_transfers FOR SELECT USING (
          is_superadmin() OR
          from_warehouse_id = (SELECT warehouse_id FROM profiles WHERE id = auth.uid()) OR
          to_warehouse_id = (SELECT warehouse_id FROM profiles WHERE id = auth.uid())
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow insert stock transfers') THEN
        CREATE POLICY "Allow insert stock transfers" ON stock_transfers FOR INSERT WITH CHECK (
          is_superadmin() OR
          from_warehouse_id = (SELECT warehouse_id FROM profiles WHERE id = auth.uid())
        );
    END IF;
END $$;
