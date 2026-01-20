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

        // Create Transaction Record
        const { data: transaction, error: txError } = await supabase
            .from("transactions")
            .insert({
                user_id: user.id,
                warehouse_id: profile.warehouse_id,
                customer_id: customer_id, // Add customer link
                total_amount: totalAmount,
                status: 'completed'
            })
            .select()
            .single();

        if (txError) throw new Error(`Transaction failed: ${txError.message}`);

        // Process items and deduct stock (FIFO)
        for (const item of cart) {
            let qtyToDeduct = item.quantity;
            let totalCostOfGoods = 0;

            // Fetch batches ordered by date (FIFO)
            const { data: batches } = await supabase
                .from("inventory_batches")
                .select("*")
                .eq("product_id", item.id)
                .eq("warehouse_id", profile.warehouse_id)
                .gt("quantity_remaining", 0)
                .order("received_at", { ascending: true });

            if (!batches || batches.length === 0) {
                throw new Error(`Out of stock for ${item.name}`);
            }

            let remainingNeeded = qtyToDeduct;

            for (const batch of batches) {
                if (remainingNeeded <= 0) break;

                const take = Math.min(batch.quantity_remaining, remainingNeeded);

                // Update batch
                const { error: updateError } = await supabase
                    .from("inventory_batches")
                    .update({ quantity_remaining: batch.quantity_remaining - take })
                    .eq("id", batch.id);

                if (updateError) throw new Error(`Failed to update stock for ${item.name}`);

                totalCostOfGoods += take * batch.buy_price;
                remainingNeeded -= take;
            }

            if (remainingNeeded > 0) {
                throw new Error(`Insufficient stock for ${item.name}. Only partial stock available.`);
            }

            // Create Transaction Item
            const { error: itemError } = await supabase.from("transaction_items").insert({
                transaction_id: transaction.id,
                product_id: item.id,
                quantity: item.quantity,
                sell_price: item.sell_price,
                buy_price_total: totalCostOfGoods
            });

            if (itemError) throw new Error(`Failed to record item ${item.name}: ${itemError.message}`);
        }

        return { success: true };
    } catch (e: any) {
        console.error("Checkout Error:", e);
        return { success: false, error: e.message || "Checkout failed" };
    }
}
