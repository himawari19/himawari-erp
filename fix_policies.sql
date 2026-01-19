-- FIX: Add missing DELETE policies for Products and Inventory

-- 1. Allow Superadmin to DELETE products
-- This is secure because is_superadmin() checks the profile role
create policy "Superadmin can delete products" 
on products 
for delete 
using ( is_superadmin() );

-- 2. Allow Superadmin to DELETE inventory
create policy "Superadmin can delete inventory" 
on inventory_batches 
for delete 
using ( is_superadmin() );

-- 3. Verify existing policies (Optional, just comments)
-- Previous policies only covered SELECT, INSERT, UPDATE. 
-- RLS denies everything else by default, which is why DELETE failed.
