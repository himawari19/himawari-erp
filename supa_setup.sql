-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create Enums
create type user_role as enum ('superadmin', 'gudang', 'kasir');

-- Create Warehouses Table
create table warehouses (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  location text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Seed Warehouses
insert into warehouses (name, location) values 
('Gudang Jakbar', 'Jakarta Barat'),
('Gudang Jaktim', 'Jakarta Timur');

-- Create Profiles Table (extends Auth Users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  role user_role not null default 'kasir',
  warehouse_id uuid references warehouses(id), -- Null for superadmin
  full_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Products Table
create table products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  sku text unique,
  description text,
  sell_price numeric not null, -- Fixed selling price
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Inventory Batches (For FIFO Costing)
create table inventory_batches (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references products(id) on delete cascade not null,
  warehouse_id uuid references warehouses(id) on delete cascade not null,
  buy_price numeric not null, -- Variable buying price
  quantity_remaining integer not null check (quantity_remaining >= 0),
  original_quantity integer not null,
  received_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Transactions Table
create table transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id),
  warehouse_id uuid references warehouses(id),
  total_amount numeric not null,
  status text default 'completed',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Transaction Items Table
create table transaction_items (
  id uuid primary key default uuid_generate_v4(),
  transaction_id uuid references transactions(id) on delete cascade not null,
  product_id uuid references products(id) not null,
  quantity integer not null,
  sell_price numeric not null, -- Price at moment of sale
  buy_price_total numeric not null, -- Calculated cost of goods sold (COGS) for this item based on FIFO
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table profiles enable row level security;
alter table warehouses enable row level security;
alter table products enable row level security;
alter table inventory_batches enable row level security;
alter table transactions enable row level security;
alter table transaction_items enable row level security;

-- Policies
-- Superadmin can view all
create policy "Superadmin view all profiles" on profiles for select using (
  auth.uid() in (select id from profiles where role = 'superadmin')
);

-- Warehouses: readable by all auth users
create policy "Warehouses readable by all" on warehouses for select using (true);

-- Products: readable by all auth users
create policy "Products readable by all" on products for select using (true);

-- Inventory: 
-- Superadmin: all
-- Gudang: own warehouse
-- Kasir: own warehouse (to check stock)
create policy "Inventory visibility" on inventory_batches for select using (
  (auth.uid() in (select id from profiles where role = 'superadmin')) or
  (warehouse_id = (select warehouse_id from profiles where id = auth.uid()))
);

-- Transactions:
-- Superadmin: all
-- Others: own warehouse
create policy "Transactions visibility" on transactions for select using (
  (auth.uid() in (select id from profiles where role = 'superadmin')) or
  (warehouse_id = (select warehouse_id from profiles where id = auth.uid()))
);

-- Function to handle new user signup (automatically create profile)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role, full_name)
  values (new.id, new.email, 'kasir', new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- SECURITY DEFINER Helper for safe Admin checking
create or replace function public.is_superadmin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'superadmin'
  );
end;
$$ language plpgsql security definer;

-- Enable RLS
alter table profiles enable row level security;
alter table warehouses enable row level security;
alter table products enable row level security;
alter table inventory_batches enable row level security;
alter table transactions enable row level security;
alter table transaction_items enable row level security;

-- Policies

-- 1. PROFILES
create policy "Users can view own profile" 
on profiles for select 
using ( auth.uid() = id );

create policy "Superadmin view all profiles" 
on profiles for select 
using ( is_superadmin() );

-- 2. WAREHOUSES
create policy "Warehouses readable by all" on warehouses for select using (true);

-- 3. PRODUCTS
create policy "Products readable by all" on products for select using (true);
create policy "Superadmin can insert products" on products for insert with check ( is_superadmin() );
create policy "Superadmin can update products" on products for update using ( is_superadmin() );

-- 4. INVENTORY
create policy "Inventory visibility" on inventory_batches for select using (
  is_superadmin() OR
  warehouse_id = (select warehouse_id from profiles where id = auth.uid())
);

create policy "Allow insert inventory" on inventory_batches for insert with check (
  is_superadmin() OR 
  warehouse_id = (select warehouse_id from profiles where id = auth.uid())
);

create policy "Allow update inventory" on inventory_batches for update using (
  is_superadmin() OR 
  warehouse_id = (select warehouse_id from profiles where id = auth.uid())
);

-- 5. TRANSACTIONS
create policy "Transactions visibility" on transactions for select using (
  is_superadmin() OR
  warehouse_id = (select warehouse_id from profiles where id = auth.uid())
);

-- Allow Insert Transactions (User can insert their own transaction)
create policy "Allow insert transactions" on transactions for insert with check ( auth.uid() = user_id );
create policy "Allow insert transaction items" on transaction_items for insert with check ( 
  exists (select 1 from transactions where id = transaction_id and user_id = auth.uid())
);
