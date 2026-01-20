import { createClient } from "@/utils/supabase/server";
import { DollarSign, ShoppingCart, TrendingUp, Clock, AlertTriangle, PackageSearch } from "lucide-react";

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Get basic profile info
    const { data: profile } = await supabase
        .from('profiles')
        .select('*, warehouse:warehouses(name)')
        .eq('id', user?.id)
        .single();

    // DATE FILTER: Today (UTC)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Fetch Transactions for Today
    // Note: In production we should respect timezone, for now assuming UTC or server time simple approximation
    const { data: todayTransactions } = await supabase
        .from('transactions')
        .select(`
            id, 
            total_amount, 
            created_at,
            transaction_items (
                buy_price_total
            )
        `)
        .gte('created_at', todayStart.toISOString())
        .lte('created_at', todayEnd.toISOString());

    // Calculate Stats
    const totalTransactions = todayTransactions?.length || 0;
    const totalRevenue = todayTransactions?.reduce((sum: number, t: any) => sum + t.total_amount, 0) || 0;

    // Calculate Profit: Revenue - COGS (Sum of buy_price_total)
    const totalCost = todayTransactions?.reduce((sum: number, t: any) => {
        const txCost = t.transaction_items.reduce((itemSum: number, item: any) => itemSum + item.buy_price_total, 0);
        return sum + txCost;
    }, 0) || 0;
    const totalProfit = totalRevenue - totalCost;

    // Fetch Recent 5 Transactions (All time)
    const { data: recentTransactions } = await supabase
        .from('transactions')
        .select('id, total_amount, created_at, status')
        .order('created_at', { ascending: false })
        .limit(5);

    // Fetch Inventory for Low Stock Alerts
    const { data: inventoryBatches } = await supabase
        .from('inventory_batches')
        .select('quantity_remaining, buy_price, product:products(id, name, sku, low_stock_threshold)');

    // Aggregate Stock for Alerts
    const stockMap = new Map<string, { name: string, sku: string, total: number, threshold: number }>();
    inventoryBatches?.forEach((batch: any) => {
        const p = batch.product as any;
        if (!p) return;
        const key = p.sku;
        const existing = stockMap.get(key) || {
            name: p.name,
            sku: p.sku,
            total: 0,
            threshold: p.low_stock_threshold || 10
        };
        existing.total += batch.quantity_remaining;
        stockMap.set(key, existing);
    });

    const lowStockItems = Array.from(stockMap.values()).filter(item => item.total <= item.threshold);


    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
                    <p className="text-gray-500 mt-1">
                        Welcome back, <span className="font-medium text-indigo-600 capitalize">{profile?.full_name || 'User'}</span>.
                        Here is what&apos;s happening today at <span className="font-medium">{profile?.warehouse?.name || 'All Warehouses'}</span>.
                    </p>
                </div>
                <div className="flex items-center gap-2 text-sm bg-white border px-3 py-1 rounded-full shadow-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                {/* Revenue Card */}
                <div className="rounded-xl border bg-white p-6 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Today&apos;s Revenue</p>
                        <h3 className="text-2xl font-bold text-gray-900 mt-1">Rp {totalRevenue.toLocaleString('id-ID')}</h3>
                    </div>
                    <div className="p-3 bg-green-50 rounded-full text-green-600">
                        <DollarSign className="w-6 h-6" />
                    </div>
                </div>

                {/* Profit Card */}
                <div className="rounded-xl border bg-white p-6 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Today&apos;s Profit</p>
                        <h3 className="text-2xl font-bold text-indigo-600 mt-1">Rp {totalProfit.toLocaleString('id-ID')}</h3>
                    </div>
                    <div className="p-3 bg-indigo-50 rounded-full text-indigo-600">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                </div>

                {/* Transactions Card */}
                <div className="rounded-xl border bg-white p-6 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Transactions Count</p>
                        <h3 className="text-2xl font-bold text-gray-900 mt-1">{totalTransactions}</h3>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-full text-blue-600">
                        <ShoppingCart className="w-6 h-6" />
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Left Column: Recent Transactions */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
                        <div className="p-6 border-b bg-gray-50/50 flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900">Recent Transactions</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-white text-gray-500 border-b">
                                    <tr>
                                        <th className="px-6 py-3 font-medium">ID</th>
                                        <th className="px-6 py-3 font-medium">Time</th>
                                        <th className="px-6 py-3 font-medium">Amount</th>
                                        <th className="px-6 py-3 font-medium text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {recentTransactions?.map((tx) => (
                                        <tr key={tx.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 font-mono text-xs text-gray-500">{tx.id.slice(0, 8)}</td>
                                            <td className="px-6 py-4">{new Date(tx.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</td>
                                            <td className="px-6 py-4 font-medium">Rp {tx.total_amount.toLocaleString('id-ID')}</td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">{tx.status}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right Column: Alerts */}
                <div className="space-y-6">
                    <div className="rounded-xl border border-red-100 bg-white shadow-sm overflow-hidden">
                        <div className="p-6 border-b bg-red-50/50 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                            <h3 className="font-bold text-red-900 uppercase tracking-wider text-sm">Low Stock Alerts</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            {lowStockItems.length > 0 ? (
                                lowStockItems.slice(0, 5).map(item => (
                                    <div key={item.sku} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm">{item.name}</p>
                                            <p className="text-[10px] text-gray-400 font-mono uppercase">{item.sku}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-sm font-bold ${item.total === 0 ? 'text-red-600' : 'text-amber-600'}`}>
                                                {item.total} Units
                                            </p>
                                            <p className="text-[10px] text-gray-400">Limit: {item.threshold}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8">
                                    <PackageSearch className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                    <p className="text-sm text-gray-400">All stock levels are healthy.</p>
                                </div>
                            )}
                            {lowStockItems.length > 5 && (
                                <p className="text-center text-xs text-gray-500 italic">
                                    + {lowStockItems.length - 5} more items low on stock
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
