import { createClient } from "@/utils/supabase/server";
import TransactionsView from "./TransactionsView";

export default async function TransactionsPage() {
    const supabase = await createClient();

    // Fetch transactions with related data
    const { data: transactionsWithProfiles, error } = await supabase
        .from('transactions')
        .select(`
            id,
            total_amount,
            status,
            created_at,
            warehouse:warehouses(name),
            items:transaction_items(
                id,
                quantity,
                sell_price,
                product:products(name, sku)
            )
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching transactions:", error);
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Transaction History</h1>
                    <p className="text-gray-500 mt-1">View and manage past sales records.</p>
                </div>
            </div>

            <TransactionsView transactions={(transactionsWithProfiles || []) as any[]} />
        </div>
    );
}
