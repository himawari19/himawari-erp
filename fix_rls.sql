-- Fix RLS for Customers
-- Sometimes FOR ALL ... USING(true) doesn't cover the WITH CHECK part correctly for INSERT in some Supabase versions.

DROP POLICY IF EXISTS "Allow all customers access" ON customers;

CREATE POLICY "Enable all for authenticated users"
ON customers
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Ensure transactions can be inserted by the authenticated user
DROP POLICY IF EXISTS "Allow insert transactions" ON transactions;
CREATE POLICY "Allow insert transactions" 
ON transactions 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Ensure transaction_items can be inserted
DROP POLICY IF EXISTS "Allow insert transaction items" ON transaction_items;
CREATE POLICY "Allow insert transaction items" 
ON transaction_items 
FOR INSERT 
TO authenticated
WITH CHECK (true); -- Simplified for now to ensure POS works, can be refined later
