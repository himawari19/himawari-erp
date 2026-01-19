"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function addStock(formData: FormData) {
    const supabase = await createClient();
    const product_id = formData.get("product_id");
    const warehouse_id = formData.get("warehouse_id");
    const quantity = parseInt(formData.get("quantity") as string);
    const buy_price = parseFloat(formData.get("buy_price") as string);

    await supabase.from("inventory_batches").insert({
        product_id,
        warehouse_id,
        quantity_remaining: quantity,
        original_quantity: quantity,
        buy_price,
    });
    revalidatePath("/dashboard/inventory");
}

export async function addProduct(formData: FormData) {
    const supabase = await createClient();
    const name = formData.get("name");
    const sku = formData.get("sku");
    const sell_price = parseFloat(formData.get("sell_price") as string);

    await supabase.from("products").insert({
        name,
        sku,
        sell_price,
    });
    revalidatePath("/dashboard/inventory");
}
