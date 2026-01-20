"use server";

import { createClient } from "@/utils/supabase/server";

export type DailySalesStat = {
    date: string;
    total_sales: number;
    transaction_count: number;
};

export type TopProductStat = {
    name: string;
    quantity: number;
    revenue: number;
};

export async function getDailySalesStats(startDate: string, endDate: string) {
    const supabase = await createClient();
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const { data: transactions, error } = await supabase
        .from("transactions")
        .select("created_at, total_amount")
        .eq("status", "completed")
        .gte("created_at", startDate)
        .lte("created_at", end.toISOString())
        .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);

    // Group by date
    const dailyMap = new Map<string, { total: number; count: number }>();

    transactions.forEach((t) => {
        const dateKey = new Date(t.created_at).toLocaleDateString("en-CA"); // YYYY-MM-DD
        const current = dailyMap.get(dateKey) || { total: 0, count: 0 };
        dailyMap.set(dateKey, {
            total: current.total + t.total_amount,
            count: current.count + 1,
        });
    });

    return Array.from(dailyMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, stat]) => ({
            date,
            total_sales: stat.total,
            transaction_count: stat.count,
        }));
}

export async function getTopProducts(startDate: string, endDate: string) {
    const supabase = await createClient();
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const { data: items, error } = await supabase
        .from("transaction_items")
        .select(`
            quantity,
            sell_price,
            products (name)
        `)
        .gte("created_at", startDate)
        .lte("created_at", end.toISOString());

    if (error) throw new Error(error.message);

    const productMap = new Map<string, { quantity: number; revenue: number }>();

    items.forEach((item) => {
        const product = item.products as any;
        const name = product?.name || "Unknown";
        const current = productMap.get(name) || { quantity: 0, revenue: 0 };

        productMap.set(name, {
            quantity: current.quantity + item.quantity,
            revenue: current.revenue + (item.quantity * item.sell_price),
        });
    });

    // Sort by quantity desc and take top 5
    return Array.from(productMap.entries())
        .map(([name, stat]) => ({
            name,
            quantity: stat.quantity,
            revenue: stat.revenue,
        }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);
}

export type SalesReportItem = {
    transaction_id: string;
    created_at: string;
    total_amount: number;
    items_count: number;
    customer_name: string | null;
};

export type IncomingStockItem = {
    id: string;
    received_at: string;
    product_name: string;
    sku: string;
    quantity: number;
    buy_price: number;
    warehouse_name: string;
};

export type MutationItem = {
    id: string;
    type: "TRANSFER" | "OPNAME";
    date: string;
    product_name: string;
    sku: string;
    description: string;
    quantity_change: number;
    user_name: string;
};

export async function getSalesReport(startDate: string, endDate: string) {
    const supabase = await createClient();

    // Adjust end date to include the whole day
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const { data: transactions, error } = await supabase
        .from("transactions")
        .select(`
            id,
            created_at,
            total_amount,
            customer_id,
            customers (name),
            transaction_items (count)
        `)
        .eq("status", "completed")
        .gte("created_at", startDate)
        .lte("created_at", end.toISOString())
        .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    return transactions.map((t: any) => ({
        transaction_id: t.id,
        created_at: t.created_at,
        total_amount: t.total_amount,
        items_count: t.transaction_items[0]?.count || 0,
        customer_name: t.customers?.name || "Guest"
    }));
}

export async function getIncomingStockReport(startDate: string, endDate: string) {
    const supabase = await createClient();
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const { data: batches, error } = await supabase
        .from("inventory_batches")
        .select(`
            id,
            received_at,
            quantity_remaining,
            original_quantity,
            buy_price,
            products (name, sku),
            warehouses (name)
        `)
        .gte("received_at", startDate)
        .lte("received_at", end.toISOString())
        .order("received_at", { ascending: false });

    if (error) throw new Error(error.message);

    return batches.map(b => {
        const product = b.products as any;
        const warehouse = b.warehouses as any;
        return {
            id: b.id,
            received_at: b.received_at,
            product_name: product?.name || "Unknown",
            sku: product?.sku || "-",
            quantity: b.original_quantity, // Show original received amount
            buy_price: b.buy_price,
            warehouse_name: warehouse?.name || "-"
        };
    });
}

export async function getStockMutationsReport(startDate: string, endDate: string) {
    const supabase = await createClient();
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Fetch Transfers
    const { data: transfers, error: transferError } = await supabase
        .from("stock_transfers")
        .select(`
            id,
            created_at,
            quantity,
            products (name, sku),
            from:warehouses!from_warehouse_id(name),
            to:warehouses!to_warehouse_id(name)
        `)
        .gte("created_at", startDate)
        .lte("created_at", end.toISOString());

    if (transferError) throw new Error(transferError.message);

    // Fetch Opnames
    const { data: opnames, error: opnameError } = await supabase
        .from("stock_opnames")
        .select(`
            id,
            created_at,
            difference,
            notes,
            products (name, sku),
            warehouses (name)
        `)
        .gte("created_at", startDate)
        .lte("created_at", end.toISOString());

    if (opnameError) throw new Error(opnameError.message);

    const mutationList: MutationItem[] = [];

    transfers?.forEach(t => {
        const product = t.products as any;
        const fromVal = t.from as any;
        const toVal = t.to as any;

        mutationList.push({
            id: t.id,
            type: "TRANSFER",
            date: t.created_at,
            product_name: product?.name || "Unknown",
            sku: product?.sku || "-",
            description: `From ${fromVal?.name} to ${toVal?.name}`,
            quantity_change: t.quantity,
            user_name: "System" // Transfers track user_id but we didn't join profiles yet, acceptable for MVP
        });
    });

    opnames?.forEach(o => {
        const product = o.products as any;

        mutationList.push({
            id: o.id,
            type: "OPNAME",
            date: o.created_at,
            product_name: product?.name || "Unknown",
            sku: product?.sku || "-",
            description: `Audit: ${o.notes || "No notes"}`,
            quantity_change: o.difference,
            user_name: "System"
        });
    });

    // Sort combined list by date desc
    return mutationList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
