"use server";

import { createClient } from "@/utils/supabase/server";


type CartItemCheck = {
    id: string;
    name: string;
    sku: string;
    sell_price: number;
    quantity: number;
};

export async function checkout(cart: CartItemCheck[], customer_id: string | null = null) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return { success: false, error: "Unauthorized" };

        const { data: profile } = await supabase
            .from("profiles")
            .select("warehouse_id")
            .eq("id", user.id)
            .single();

        if (!profile?.warehouse_id) return { success: false, error: "No warehouse assigned" };

        // Calculate total
        const totalAmount = cart.reduce((sum: number, item: any) => sum + (item.sell_price * item.quantity), 0);

        // Create Checkout via Atomic RPC
        const { data: result, error: rpcError } = await (supabase.rpc('process_checkout', {
            p_user_id: user.id,
            p_warehouse_id: profile.warehouse_id,
            p_customer_id: customer_id || null, // Convert empty string to null if needed
            p_items: cart.map(item => ({
                id: item.id,
                quantity: item.quantity,
                sell_price: item.sell_price
            })),
            p_total_amount: totalAmount
        }) as any);

        if (rpcError) throw new Error(rpcError.message);
        if (result && !result.success) throw new Error(result.error || "Checkout failed at database level");

        return { success: true };
    } catch (e: any) {
        console.error("Checkout Error:", e);
        return { success: false, error: e.message || "Checkout failed" };
    }
}

export async function searchProducts(query: string) {
    try {
        const supabase = await createClient();
        let q = supabase
            .from("products")
            .select("id, name, sku, sell_price, image_url");

        if (query) {
            q = q.or(`name.ilike.%${query}%,sku.ilike.%${query}%`);
        }

        const { data, error } = await q.order('name').limit(50);

        if (error) throw error;
        return data || [];
    } catch (e) {
        console.error("Search error:", e);
        return [];
    }
}
