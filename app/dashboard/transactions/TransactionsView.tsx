"use client";

import { useState } from "react";
import { Search, Eye, ShoppingCart, Calendar } from "lucide-react";

type TransactionItem = {
    id: string;
    quantity: number;
    sell_price: number;
    product: {
        name: string;
        sku: string;
    } | null;
};

type Transaction = {
    id: string;
    total_amount: number;
    status: string | null;
    created_at: string;
    warehouse: {
        name: string;
    } | null;
    items: TransactionItem[];
};

export default function TransactionsView({ transactions }: { transactions: Transaction[] }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

    const filteredTransactions = transactions.filter(tx =>
        tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.warehouse?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex items-center justify-between bg-white p-4 rounded-xl border shadow-sm">
                <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search ID or Warehouse..."
                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="text-sm text-gray-500">
                    Total: <span className="font-medium text-gray-900">{filteredTransactions.length}</span> records
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50/50 border-b">
                            <tr>
                                <th className="px-6 py-4 font-medium text-gray-500">Date/Time</th>
                                <th className="px-6 py-4 font-medium text-gray-500">Transaction ID</th>
                                <th className="px-6 py-4 font-medium text-gray-500">Warehouse</th>
                                <th className="px-6 py-4 font-medium text-gray-500">Items</th>
                                <th className="px-6 py-4 font-medium text-gray-500 text-right">Total Amount</th>
                                <th className="px-6 py-4 font-medium text-gray-500 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredTransactions.map((tx) => (
                                <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-gray-900 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-gray-400" />
                                            {new Date(tx.created_at).toLocaleString('id-ID')}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs text-gray-500">
                                        {tx.id}
                                    </td>
                                    <td className="px-6 py-4 text-gray-700">
                                        {tx.warehouse?.name || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-gray-700">
                                        {tx.items.length} items
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-indigo-600">
                                        Rp {tx.total_amount.toLocaleString('id-ID')}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={() => setSelectedTx(tx)}
                                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                            title="View Details"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredTransactions.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <ShoppingCart className="w-8 h-8 text-gray-300" />
                                            <p>No transactions found matching &quot;{searchTerm}&quot;</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detail Modal */}
            {selectedTx && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Transaction Details</h3>
                                <p className="text-xs font-mono text-gray-500 mt-1">{selectedTx.id}</p>
                            </div>
                            <button
                                onClick={() => setSelectedTx(null)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-0 max-h-[60vh] overflow-y-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-6 py-3 text-left font-medium text-gray-500">Product</th>
                                        <th className="px-6 py-3 text-right font-medium text-gray-500">Price</th>
                                        <th className="px-6 py-3 text-center font-medium text-gray-500">Qty</th>
                                        <th className="px-6 py-3 text-right font-medium text-gray-500">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {selectedTx.items.map((item, idx) => (
                                        <tr key={idx}>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{item.product?.name || 'Unknown Product'}</div>
                                                <div className="text-xs text-gray-500 font-mono">{item.product?.sku}</div>
                                            </td>
                                            <td className="px-6 py-4 text-right text-gray-600">
                                                Rp {item.sell_price.toLocaleString('id-ID')}
                                            </td>
                                            <td className="px-6 py-4 text-center text-gray-900">
                                                {item.quantity}
                                            </td>
                                            <td className="px-6 py-4 text-right font-medium text-gray-900">
                                                Rp {(item.sell_price * item.quantity).toLocaleString('id-ID')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
                            <div className="text-right">
                                <p className="text-sm text-gray-500">Total Amount</p>
                                <p className="text-2xl font-bold text-indigo-600">Rp {selectedTx.total_amount.toLocaleString('id-ID')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
