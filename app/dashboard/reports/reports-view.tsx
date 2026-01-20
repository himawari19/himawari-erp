"use client";

import { useState } from "react";
import { DateRangePicker } from "./date-range-picker";
import { SalesReportItem, IncomingStockItem, MutationItem, DailySalesStat, TopProductStat } from "./actions";
import { FileText, Truck, ArrowLeftRight, TrendingUp, Package, AlertCircle } from "lucide-react";
import { ChartsView } from "./charts-view";

interface ReportsViewProps {
    sales: SalesReportItem[];
    incoming: IncomingStockItem[];
    mutations: MutationItem[];
    dailyStats: DailySalesStat[];
    topProducts: TopProductStat[];
    startDate: string;
    endDate: string;
    onDateChange: (start: string, end: string) => void;
}

export function ReportsView({ sales, incoming, mutations, dailyStats, topProducts, startDate, endDate, onDateChange }: ReportsViewProps) {
    const [activeTab, setActiveTab] = useState<"sales" | "incoming" | "mutations">("sales");

    return (
        <div className="space-y-6">
            {/* Header & Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Reports Center</h1>
                    <p className="text-sm text-gray-500 mt-1">Analyze business performance and stock movements.</p>
                </div>
                <div className="flex items-center gap-2">
                    <DateRangePicker startDate={startDate} endDate={endDate} onRangeChange={onDateChange} />
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex p-1 bg-gray-100 rounded-lg self-start w-fit">
                <button
                    onClick={() => setActiveTab("sales")}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${activeTab === "sales" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                >
                    <TrendingUp className="h-4 w-4" />
                    Sales Report
                </button>
                <button
                    onClick={() => setActiveTab("incoming")}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${activeTab === "incoming" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                >
                    <Truck className="h-4 w-4" />
                    Incoming Stock
                </button>
                <button
                    onClick={() => setActiveTab("mutations")}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${activeTab === "mutations" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                >
                    <ArrowLeftRight className="h-4 w-4" />
                    Stock Mutations
                </button>
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-xl border shadow-sm min-h-[400px]">
                {activeTab === "sales" && <SalesTab data={sales} dailyStats={dailyStats} topProducts={topProducts} />}
                {activeTab === "incoming" && <IncomingTab data={incoming} />}
                {activeTab === "mutations" && <MutationsTab data={mutations} />}
            </div>
        </div>
    );
}

function SalesTab({ data, dailyStats, topProducts }: { data: SalesReportItem[], dailyStats: DailySalesStat[], topProducts: TopProductStat[] }) {
    const totalRevenue = data.reduce((sum, item) => sum + item.total_amount, 0);
    const totalTx = data.length;

    return (
        <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <ChartsView dailyStats={dailyStats} topProducts={topProducts} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100">
                    <p className="text-xs text-indigo-600 font-bold uppercase tracking-wider">Total Revenue</p>
                    <p className="text-2xl font-bold text-indigo-900 mt-1">Rp {totalRevenue.toLocaleString("id-ID")}</p>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                    <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider">Transactions</p>
                    <p className="text-2xl font-bold text-emerald-900 mt-1">{totalTx}</p>
                </div>
            </div>

            <div className="relative overflow-x-auto rounded-lg border">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3">Transaction ID</th>
                            <th className="px-6 py-3">Customer</th>
                            <th className="px-6 py-3">Items</th>
                            <th className="px-6 py-3 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {data.length > 0 ? (
                            data.map((item) => (
                                <tr key={item.transaction_id} className="bg-white hover:bg-gray-50">
                                    <td className="px-6 py-4">{new Date(item.created_at).toLocaleDateString("id-ID", {
                                        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                    })}</td>
                                    <td className="px-6 py-4 font-mono text-xs">{item.transaction_id.slice(0, 8)}...</td>
                                    <td className="px-6 py-4">{item.customer_name || "Guest"}</td>
                                    <td className="px-6 py-4">{item.items_count}</td>
                                    <td className="px-6 py-4 text-right font-medium">Rp {item.total_amount.toLocaleString("id-ID")}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">No sales data in this period</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function IncomingTab({ data }: { data: IncomingStockItem[] }) {
    return (
        <div className="p-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="relative overflow-x-auto rounded-lg border">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-3">Date Received</th>
                            <th className="px-6 py-3">Product</th>
                            <th className="px-6 py-3">Warehouse</th>
                            <th className="px-6 py-3 text-right">Qty</th>
                            <th className="px-6 py-3 text-right">Buy Price</th>
                            <th className="px-6 py-3 text-right">Total Value</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {data.length > 0 ? (
                            data.map((item) => (
                                <tr key={item.id} className="bg-white hover:bg-gray-50">
                                    <td className="px-6 py-4">{new Date(item.received_at).toLocaleDateString("id-ID")}</td>
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-gray-900">{item.product_name}</div>
                                        <div className="text-xs text-gray-500">{item.sku}</div>
                                    </td>
                                    <td className="px-6 py-4">{item.warehouse_name}</td>
                                    <td className="px-6 py-4 text-right font-bold text-green-600">+{item.quantity}</td>
                                    <td className="px-6 py-4 text-right">Rp {item.buy_price.toLocaleString("id-ID")}</td>
                                    <td className="px-6 py-4 text-right font-medium">Rp {(item.quantity * item.buy_price).toLocaleString("id-ID")}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">No stock received in this period</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function MutationsTab({ data }: { data: MutationItem[] }) {
    return (
        <div className="p-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="relative overflow-x-auto rounded-lg border">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3">Type</th>
                            <th className="px-6 py-3">Product</th>
                            <th className="px-6 py-3">Description</th>
                            <th className="px-6 py-3 text-right">Change</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {data.length > 0 ? (
                            data.map((item) => (
                                <tr key={item.id} className="bg-white hover:bg-gray-50">
                                    <td className="px-6 py-4">{new Date(item.date).toLocaleDateString("id-ID", { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${item.type === 'TRANSFER' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                                            }`}>
                                            {item.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium">{item.product_name}</div>
                                        <div className="text-xs text-gray-500">{item.sku}</div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">{item.description}</td>
                                    <td className={`px-6 py-4 text-right font-bold ${item.quantity_change > 0 ? 'text-green-600' : item.quantity_change < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                                        {item.quantity_change > 0 ? '+' : ''}{item.quantity_change}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">No mutations found in this period</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
