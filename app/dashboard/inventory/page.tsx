import { createClient } from "@/utils/supabase/server";
import { InventoryView } from "./inventory-view";

export default async function InventoryPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    // Get User Role & Warehouse
    const { data: profile } = await supabase
        .from("profiles")
        .select("role, warehouse_id")
        .eq("id", user.id)
        .single();

    const isAdmin = profile?.role === "superadmin";

    // Fetch Inventory
    const { data: inventory } = await supabase
        .from("inventory_batches")
        .select(`
            id,
            quantity_remaining,
            buy_price,
            received_at,
            warehouse:warehouses(name),
            product:products(name, sku)
        `)
        .order("received_at", { ascending: false });

    // Fetch Products (for master list & dropdown)
    const { data: products } = await supabase
        .from("products")
        .select("*")
        .order("name", { ascending: true });

    // Fetch Warehouses
    const { data: warehouses } = await supabase
        .from("warehouses")
        .select("*");

    return (
        <InventoryView
            products={products}
            warehouses={warehouses}
            inventory={inventory as any}
            isAdmin={isAdmin}
            userWarehouseId={profile?.warehouse_id}
        />
    );
}
