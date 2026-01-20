"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function getWarehouses() {
    const supabase = await createClient();
    const { data, error } = await supabase.from("warehouses").select("*").order("name");
    if (error) throw new Error(error.message);
    return data;
}

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

export async function deleteStock(id: string) {
    const supabase = await createClient();
    const { error } = await supabase.from("inventory_batches").delete().eq("id", id);
    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/inventory");
}

export async function updateStock(id: string, quantity: number, buy_price: number) {
    const supabase = await createClient();
    const { error } = await supabase.from("inventory_batches").update({
        quantity_remaining: quantity,
        buy_price: buy_price
    }).eq("id", id);
    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/inventory");
}

export async function deleteProduct(id: string) {
    const supabase = await createClient();
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/inventory");
}

export async function updateProduct(id: string, name: string, sku: string, sell_price: number) {
    const supabase = await createClient();
    const { error } = await supabase.from("products").update({
        name,
        sku,
        sell_price
    }).eq("id", id);
    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/inventory");
}

export async function transferStock(formData: FormData) {
    const supabase = await createClient();
    const productId = formData.get("product_id") as string;
    const fromWarehouseId = formData.get("from_warehouse_id") as string;
    const toWarehouseId = formData.get("to_warehouse_id") as string;
    const quantity = parseInt(formData.get("quantity") as string);

    if (fromWarehouseId === toWarehouseId) {
        throw new Error("Source and destination warehouses must be different");
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Start Transaction Logic (Deduct from Source)
    // Fetch batches ordered by date (FIFO)
    const { data: batches, error: fetchError } = await supabase
        .from("inventory_batches")
        .select("*")
        .eq("product_id", productId)
        .eq("warehouse_id", fromWarehouseId)
        .gt("quantity_remaining", 0)
        .order("received_at", { ascending: true });

    if (fetchError) throw new Error(fetchError.message);
    if (!batches || batches.length === 0) throw new Error("No stock available in source warehouse");

    const totalAvailable = batches.reduce((sum, b) => sum + b.quantity_remaining, 0);
    if (totalAvailable < quantity) throw new Error(`Insufficient stock. Available: ${totalAvailable}`);

    let remainingToTransfer = quantity;

    for (const batch of batches) {
        if (remainingToTransfer <= 0) break;

        const take = Math.min(batch.quantity_remaining, remainingToTransfer);

        // 1. Deduct from Source Batch
        const { error: updateError } = await supabase
            .from("inventory_batches")
            .update({ quantity_remaining: batch.quantity_remaining - take })
            .eq("id", batch.id);

        if (updateError) throw new Error(`Failed to deduct stock from batch ${batch.id}`);

        // 2. Add to Destination (Create new batch in destination warehouse with same buy_price)
        const { error: insertError } = await supabase
            .from("inventory_batches")
            .insert({
                product_id: productId,
                warehouse_id: toWarehouseId,
                quantity_remaining: take,
                original_quantity: take,
                buy_price: batch.buy_price,
                received_at: new Date().toISOString() // Or keep original? Usually new arrival date.
            });

        if (insertError) throw new Error(`Failed to add stock to destination warehouse: ${insertError.message}`);

        remainingToTransfer -= take;
    }

    // 3. Log the transfer
    const { error: logError } = await supabase
        .from("stock_transfers")
        .insert({
            product_id: productId,
            from_warehouse_id: fromWarehouseId,
            to_warehouse_id: toWarehouseId,
            quantity: quantity,
            user_id: user.id
        });

    if (logError) console.error("Failed to log transfer:", logError.message);

    revalidatePath("/dashboard/inventory");
    return { success: true };
}

// Phase 2: Categories Actions
export async function addCategory(formData: FormData) {
    const supabase = await createClient();
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;

    const { error } = await supabase.from("categories").insert({ name, description });
    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/inventory");
}

export async function updateCategory(id: string, name: string, description: string) {
    const supabase = await createClient();
    const { error } = await supabase.from("categories").update({ name, description }).eq("id", id);
    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/inventory");
}

export async function deleteCategory(id: string) {
    const supabase = await createClient();
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/inventory");
}

// Phase 2: Supplier Actions
export async function addSupplier(formData: FormData) {
    const supabase = await createClient();
    const name = formData.get("name") as string;
    const contact_name = formData.get("contact_name") as string;
    const phone = formData.get("phone") as string;
    const address = formData.get("address") as string;

    const { error } = await supabase.from("suppliers").insert({ name, contact_name, phone, address });
    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/inventory");
}

export async function updateSupplier(id: string, name: string, contact_name: string, phone: string, address: string) {
    const supabase = await createClient();
    const { error } = await supabase.from("suppliers").update({ name, contact_name, phone, address }).eq("id", id);
    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/inventory");
}

export async function deleteSupplier(id: string) {
    const supabase = await createClient();
    const { error } = await supabase.from("suppliers").delete().eq("id", id);
    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/inventory");
}

// Phase 2: Stock Opname Action
export async function recordStockOpname(formData: FormData) {
    const supabase = await createClient();
    const warehouse_id = formData.get("warehouse_id") as string;
    const product_id = formData.get("product_id") as string;
    const system_stock = parseInt(formData.get("system_stock") as string);
    const actual_stock = parseInt(formData.get("actual_stock") as string);
    const notes = formData.get("notes") as string;
    const difference = actual_stock - system_stock;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { error } = await supabase.from("stock_opnames").insert({
        warehouse_id,
        product_id,
        system_stock,
        actual_stock,
        difference,
        user_id: user.id,
        notes
    });

    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/inventory");
    return { success: true };
}
