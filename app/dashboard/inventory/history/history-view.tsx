"use client";

import { useState } from "react";
import {
    Search, Filter, ArrowDownLeft, ArrowUpRight,
    ArrowLeftRight, ClipboardCheck, Package,
    History, User, Warehouse
} from "lucide-react";
import { format } from "date-fns";

type Movement = {
    id: string;
    product_id: string;
    warehouse_id: string;
    type: 'in' | 'out' | 'transfer_in' | 'transfer_out' | 'adjustment';
    quantity: number;
    notes: string | null;
    created_at: string;
    product: { name: string; sku: string };
    warehouse: { name: string };
    user: { full_name: string | null } | null;
};

export default function HistoryView({ initialData }: { initialData: any[] }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");

    const filteredData = (initialData as Movement[]).filter(m => {
        const matchesSearch =
            m.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.product.sku.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === "all" || m.type === typeFilter;
        return matchesSearch && matchesType;
    });

    const getTypeDetails = (type: string) => {
        switch (type) {
            case 'in': return { label: 'Stok Masuk', icon: ArrowDownLeft, color: 'text-emerald-600 bg-emerald-50' };
            case 'out': return { label: 'Penjualan', icon: ArrowUpRight, color: 'text-rose-600 bg-rose-50' };
            case 'transfer_in': return { label: 'Transfer Masuk', icon: ArrowLeftRight, color: 'text-blue-600 bg-blue-50' };
            case 'transfer_out': return { label: 'Transfer Keluar', icon: ArrowLeftRight, color: 'text-amber-600 bg-amber-50' };
            case 'adjustment': return { label: 'Penyesuaian', icon: ClipboardCheck, color: 'text-purple-600 bg-purple-50' };
            default: return { label: type, icon: Package, color: 'text-gray-600 bg-gray-50' };
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border shadow-sm">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Cari produk atau SKU..."
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Filter className="text-gray-400 w-4 h-4" />
                    <select
                        className="border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 flex-1 md:flex-none"
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                    >
                        <option value="all">Semua Tipe</option>
                        <option value="in">Stok Masuk</option>
                        <option value="out">Penjualan</option>
                        <option value="transfer_in">Transfer Masuk</option>
                        <option value="transfer_out">Transfer Keluar</option>
                        <option value="adjustment">Penyesuaian (Opname)</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Waktu</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Produk</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Tipe</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Qty</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Gudang</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Petugas</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                        <History className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        <p>Tidak ada riwayat ditemukan</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((m) => {
                                    const details = getTypeDetails(m.type);
                                    const Icon = details.icon;
                                    return (
                                        <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {format(new Date(m.created_at), 'dd MMM yyyy')}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {format(new Date(m.created_at), 'HH:mm')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold text-gray-900">{m.product.name}</span>
                                                    <span className="text-xs text-indigo-600 font-mono">{m.product.sku}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${details.color}`}>
                                                    <Icon className="w-3 h-3" />
                                                    {details.label}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`text-sm font-bold ${['out', 'transfer_out'].includes(m.type) ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                    {['out', 'transfer_out'].includes(m.type) ? '-' : '+'}{m.quantity}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Warehouse className="w-4 h-4 text-gray-400" />
                                                    {m.warehouse.name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <User className="w-4 h-4 text-gray-400" />
                                                    {m.user?.full_name || 'System'}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
