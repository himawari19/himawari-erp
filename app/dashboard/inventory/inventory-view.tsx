"use client";

import { useState, useEffect } from "react";
import { Plus, Package, History, Boxes, Search, Filter, Pencil, Trash2, X, Save, ArrowLeftRight, Tags, Truck, Download, AlertTriangle, ClipboardCheck } from "lucide-react";
import { SubmitButton } from "@/app/login/submit-button";
import { addProduct, addStock, deleteProduct, deleteStock, updateProduct, updateStock, transferStock, addCategory, deleteCategory, addSupplier, deleteSupplier, recordStockOpname } from "./actions";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";

// Types
type Category = { id: string; name: string; description: string };
type Supplier = { id: string; name: string; contact_name: string; phone: string; address: string };
type Product = {
    id: string;
    name: string;
    sku: string;
    sell_price: number;
    category_id?: string;
    supplier_id?: string;
    low_stock_threshold: number
};
type Warehouse = { id: string; name: string };
type InventoryItem = {
    id: string;
    quantity_remaining: number;
    buy_price: number;
    received_at: string;
    warehouse: { name: string };
    product: {
        name: string;
        sku: string;
        category_id?: string;
        supplier_id?: string;
        low_stock_threshold: number
    };
};

interface InventoryViewProps {
    products: Product[] | null;
    warehouses: Warehouse[] | null;
    categories: Category[] | null;
    suppliers: Supplier[] | null;
    inventory: InventoryItem[] | null;
    role: string;
    userWarehouseId?: string;
}

const ITEMS_PER_PAGE = 10;

export function InventoryView({ products, warehouses, categories, suppliers, inventory, role, userWarehouseId }: InventoryViewProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    // RBAC Permissions
    const canDelete = role === "superadmin";
    const canEdit = role === "superadmin" || role === "gudang";
    const isAdmin = role === "superadmin"; // Keep for existing logic if any

    const activeTab = searchParams.get("tab") || "overview";

    // Edit State
    const [editingStock, setEditingStock] = useState<InventoryItem | null>(null);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    const setActiveTab = (tab: string) => {
        const params = new URLSearchParams(searchParams);
        params.set("tab", tab);
        router.replace(`${pathname}?${params.toString()}`);
        setSearchTerm(""); // Reset search when switching tabs
        setCurrentPage(1); // Reset page
    };

    // Reset page when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const exportInventoryToCSV = () => {
        if (!inventory) return;

        // Aggregate for export
        const stockMap = new Map<string, any>();
        inventory.forEach(item => {
            const key = item.product.sku;
            const existing = stockMap.get(key) || {
                Name: item.product.name,
                SKU: item.product.sku,
                'Total Stock': 0,
                'Est. Valuation': 0,
                Threshold: item.product.low_stock_threshold
            };
            existing['Total Stock'] += item.quantity_remaining;
            existing['Est. Valuation'] += (item.quantity_remaining * item.buy_price);
            stockMap.set(key, existing);
        });

        const data = Array.from(stockMap.values());
        const headers = ["Name", "SKU", "Total Stock", "Threshold", "Est. Valuation"];
        const csvContent = [
            headers.join(","),
            ...data.map(row => headers.map(h => `"${row[h]}"`).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `inventory_report_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Pagination Helper
    const paginateData = <T,>(data: T[]) => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return {
            currentData: data.slice(startIndex, startIndex + ITEMS_PER_PAGE),
            totalPages: Math.ceil(data.length / ITEMS_PER_PAGE),
            totalItems: data.length
        };
    };

    const PaginationControls = ({ totalPages, totalItems }: { totalPages: number, totalItems: number }) => {
        if (totalPages <= 1) return null;
        return (
            <div className="flex items-center justify-between border-t px-4 py-3 sm:px-6">
                <div className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, totalItems)}</span> of <span className="font-medium">{totalItems}</span> results
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 border rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                        Next
                    </button>
                </div>
            </div>
        );
    };

    // Empty State Helper
    const EmptyState = ({ message }: { message: string }) => (
        <tr>
            <td colSpan={6} className="p-8 text-center text-gray-500">
                <div className="flex flex-col items-center gap-2">
                    <Boxes className="h-8 w-8 text-gray-300" />
                    <p>{message}</p>
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm("")}
                            className="text-indigo-600 font-medium hover:text-indigo-800 text-sm mt-1"
                        >
                            Clear search filter
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Inventory Management</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage products, stock levels, and warehouse operations.</p>
                </div>
                {/* Tab Pill Navigation - only core views now, others in sidebar */}
                <div className="hidden sm:flex p-1 bg-gray-100 rounded-lg self-start">
                    <button
                        onClick={() => setActiveTab("total_stock")}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === "total_stock"
                            ? "bg-white text-indigo-600 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <Boxes className="h-4 w-4" />
                            Stock Amount
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab("overview")}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === "overview"
                            ? "bg-white text-indigo-600 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <History className="h-4 w-4" />
                            Stock History
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab("stock_in")}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === "stock_in"
                            ? "bg-white text-indigo-600 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Incoming Stock
                        </div>
                    </button>
                </div>
            </div>

            {/* TAB CONTENT: TOTAL STOCK (ALL WAREHOUSES) */}
            {activeTab === "total_stock" && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Stock Amount Overview</h2>
                        <div className="flex gap-2">
                            <button
                                onClick={() => exportInventoryToCSV()}
                                className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-md text-sm font-medium border border-green-200 hover:bg-green-100 transition-colors"
                            >
                                <Download className="h-4 w-4" />
                                Export Excel
                            </button>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search product..."
                                    className="pl-9 h-9 w-64 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50/50 border-b">
                                    <tr>
                                        <th className="h-10 px-6 align-middle font-medium text-gray-500">Product Name</th>
                                        <th className="h-10 px-6 align-middle font-medium text-gray-500">SKU</th>
                                        <th className="h-10 px-6 align-middle font-medium text-gray-500 text-center">Total Quantity</th>
                                        <th className="h-10 px-6 align-middle font-medium text-gray-500">Warehouse Distribution</th>
                                        <th className="h-10 px-6 align-middle font-medium text-gray-500 text-right">Est. Valuation</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {(() => {
                                        // Aggregate stock by product_id
                                        const stockMap = new Map<string, {
                                            name: string;
                                            sku: string;
                                            totalQty: number;
                                            totalValuation: number;
                                            warehouses: Map<string, number>;
                                        }>();

                                        inventory?.forEach(item => {
                                            const pName = (item.product as any)?.name || "Unknown Product";
                                            const pSku = (item.product as any)?.sku || "-";
                                            const pThreshold = (item.product as any)?.low_stock_threshold || 10;
                                            const wName = (item.warehouse as any)?.name || "Unknown Warehouse";
                                            const key = pName + pSku;

                                            const existing = stockMap.get(key) || {
                                                name: pName,
                                                sku: pSku,
                                                threshold: pThreshold,
                                                totalQty: 0,
                                                totalValuation: 0,
                                                warehouses: new Map()
                                            } as {
                                                name: string,
                                                sku: string,
                                                threshold: number,
                                                totalQty: number,
                                                totalValuation: number,
                                                warehouses: Map<string, number>
                                            };

                                            existing.totalQty += item.quantity_remaining;
                                            existing.totalValuation += (item.quantity_remaining * item.buy_price);
                                            const currentWQty = existing.warehouses.get(wName) || 0;
                                            existing.warehouses.set(wName, currentWQty + item.quantity_remaining);
                                            stockMap.set(key, existing);
                                        });

                                        const allData = Array.from(stockMap.values())
                                            .filter(item => {
                                                if (!searchTerm) return true;
                                                const lowerTerm = searchTerm.toLowerCase();
                                                if (item.name.toLowerCase().includes(lowerTerm) || item.sku.toLowerCase().includes(lowerTerm)) {
                                                    return true;
                                                }
                                                const hasWarehouseMatch = Array.from(item.warehouses.keys()).some(wName => wName.toLowerCase().includes(lowerTerm));
                                                return hasWarehouseMatch;
                                            });

                                        const { currentData, totalPages, totalItems } = paginateData(allData);

                                        if (allData.length === 0) return <EmptyState message={`No stock data matching "${searchTerm}"`} />;

                                        return (
                                            <>
                                                {currentData.map((item, idx) => (
                                                    <tr key={idx} className="group hover:bg-gray-50/50 transition-colors">
                                                        <td className="p-6 align-middle font-medium text-gray-900">{item.name}</td>
                                                        <td className="p-6 align-middle text-gray-500 font-mono text-xs">{item.sku}</td>
                                                        <td className="p-6 align-middle text-center">
                                                            <div className="flex flex-col items-center gap-1">
                                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${(item as any).totalQty > (item as any).threshold
                                                                    ? 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20'
                                                                    : (item as any).totalQty > ((item as any).threshold / 2)
                                                                        ? 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20'
                                                                        : 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20 animate-pulse'
                                                                    }`}>
                                                                    {(item as any).totalQty} units
                                                                </span>
                                                                {(item as any).totalQty <= (item as any).threshold && (
                                                                    <span className="flex items-center gap-1 text-[10px] text-amber-600 font-bold uppercase">
                                                                        <AlertTriangle className="h-3 w-3" />
                                                                        Restock Soon
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="p-6 align-middle">
                                                            <div className="flex flex-wrap gap-2">
                                                                {Array.from(item.warehouses.entries()).map(([wName, qty]) => (
                                                                    <span key={wName} className="inline-flex items-center gap-1.5 rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 border border-gray-200">
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                                                        {wName}: <span className="text-gray-900">{qty}</span>
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </td>
                                                        <td className="p-6 align-middle text-right font-mono text-gray-600">
                                                            Rp {item.totalValuation.toLocaleString("id-ID")}
                                                        </td>
                                                    </tr>
                                                ))}
                                                <tr>
                                                    <td colSpan={5} className="p-0">
                                                        <PaginationControls totalPages={totalPages} totalItems={totalItems} />
                                                    </td>
                                                </tr>
                                            </>
                                        );
                                    })()}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: STOCK HISTORY (OVERVIEW) */}
            {activeTab === "overview" && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Inventory Batches</h2>
                        <div className="flex gap-2">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search stock..."
                                    className="pl-9 h-9 w-64 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50/50 border-b">
                                <tr>
                                    <th className="h-10 px-6 align-middle font-medium text-gray-500">Date</th>
                                    <th className="h-10 px-6 align-middle font-medium text-gray-500">Product</th>
                                    <th className="h-10 px-6 align-middle font-medium text-gray-500">Warehouse</th>
                                    <th className="h-10 px-6 align-middle font-medium text-gray-500 text-right">Buy Price</th>
                                    <th className="h-10 px-6 align-middle font-medium text-gray-500 text-center">Remaining</th>
                                    {canEdit && <th className="h-10 px-6 align-middle font-medium text-gray-500 text-right">Actions</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {(() => {
                                    const filteredData = inventory?.filter(item => {
                                        if (!searchTerm) return true;
                                        const lowerTerm = searchTerm.toLowerCase();
                                        const pName = (item.product as any)?.name || "";
                                        const pSku = (item.product as any)?.sku || "";
                                        const wName = (item.warehouse as any)?.name || "";
                                        return pName.toLowerCase().includes(lowerTerm) ||
                                            pSku.toLowerCase().includes(lowerTerm) ||
                                            wName.toLowerCase().includes(lowerTerm);
                                    }) || [];

                                    const { currentData, totalPages, totalItems } = paginateData(filteredData);

                                    if (filteredData.length === 0) return <EmptyState message={inventory?.length ? "No filtering match." : "No inventory batches found."} />;

                                    return (
                                        <>
                                            {currentData.map((item) => (
                                                <tr key={item.id} className="group hover:bg-gray-50/50 transition-colors">
                                                    <td className="p-6 align-middle text-gray-600">{new Date(item.received_at).toLocaleDateString("id-ID")}</td>
                                                    <td className="p-6 align-middle font-medium text-gray-900">
                                                        {(item.product as any)?.name}
                                                        <span className="ml-2 text-xs text-gray-400 font-normal">{(item.product as any)?.sku}</span>
                                                    </td>
                                                    <td className="p-6 align-middle text-gray-600">{(item.warehouse as any)?.name}</td>
                                                    <td className="p-6 align-middle text-right font-mono">Rp {item.buy_price.toLocaleString("id-ID")}</td>
                                                    <td className="p-6 align-middle text-center">
                                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${item.quantity_remaining > 5 ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20' : 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20'}`}>
                                                            {item.quantity_remaining} units
                                                        </span>
                                                    </td>
                                                    {canEdit && (
                                                        <td className="p-6 align-middle text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button
                                                                    onClick={() => setEditingStock(item)}
                                                                    className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                                                                    title="Edit Stock"
                                                                >
                                                                    <Pencil className="h-4 w-4" />
                                                                </button>
                                                                {canDelete && (
                                                                    <button
                                                                        onClick={async () => {
                                                                            if (confirm("Are you sure you want to delete this stock record? This cannot be undone.")) {
                                                                                toast.promise(deleteStock(item.id), {
                                                                                    loading: 'Deleting...',
                                                                                    success: 'Stock record deleted',
                                                                                    error: (err) => err.message || 'Failed to delete'
                                                                                });
                                                                            }
                                                                        }}
                                                                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                                                        title="Delete Stock"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    )}
                                                </tr>
                                            ))}
                                            <tr>
                                                <td colSpan={canEdit ? 6 : 5} className="p-0">
                                                    <PaginationControls totalPages={totalPages} totalItems={totalItems} />
                                                </td>
                                            </tr>
                                        </>
                                    );
                                })()}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: MASTER PRODUCTS (ADMIN ONLY) */}
            {activeTab === "products" && isAdmin && (
                <div className="grid gap-6 md:grid-cols-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {/* List */}
                    <div className="md:col-span-2 space-y-4">
                        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
                            <div className="p-4 border-b bg-gray-50/50 font-medium text-gray-700 flex justify-between items-center">
                                <span>Master Product List</span>
                                <span className="text-xs font-normal text-gray-400">{products?.length || 0} items</span>
                            </div>
                            <div className="relative w-full overflow-auto max-h-[500px]">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-white border-b sticky top-0 z-10 shadow-sm">
                                        <tr>
                                            <th className="h-10 px-4 align-middle font-medium text-gray-500 w-[80px]">Status</th>
                                            <th className="h-10 px-4 align-middle font-medium text-gray-500">Name</th>
                                            <th className="h-10 px-4 align-middle font-medium text-gray-500">SKU</th>
                                            <th className="h-10 px-4 align-middle font-medium text-gray-500">Sell Price</th>
                                            {canEdit && <th className="h-10 px-4 align-middle font-medium text-gray-500 text-right">Actions</th>}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {(() => {
                                            const { currentData, totalPages, totalItems } = paginateData(products || []);

                                            // TODO: Add filtering to Products tab explicitly if needed, currently no search bar in design for this specific tab? 
                                            // Ah actually I see there is no search bar in the Products tab design block above. 
                                            // For now default pagination on full list.

                                            return (
                                                <>
                                                    {currentData.map((p) => (
                                                        <tr key={p.id} className="hover:bg-gray-50/50">
                                                            <td className="p-4 align-middle">
                                                                <span className="inline-flex h-2 w-2 rounded-full bg-green-500 ring-4 ring-green-500/20"></span>
                                                            </td>
                                                            <td className="p-4 align-middle font-medium text-gray-900">{p.name}</td>
                                                            <td className="p-4 align-middle text-gray-500 font-mono text-xs">{p.sku}</td>
                                                            <td className="p-4 align-middle text-gray-700">Rp {p.sell_price.toLocaleString("id-ID")}</td>
                                                            {canEdit && (
                                                                <td className="p-4 align-middle text-right">
                                                                    <div className="flex items-center justify-end gap-2">
                                                                        <button
                                                                            onClick={() => setEditingProduct(p)}
                                                                            className="p-1 px-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                                                                            title="Edit Product"
                                                                        >
                                                                            <Pencil className="h-3 w-3" />
                                                                        </button>
                                                                        {canDelete && (
                                                                            <button
                                                                                onClick={async () => {
                                                                                    if (confirm(`Delete product ${p.name}? This might affect stock records.`)) {
                                                                                        toast.promise(deleteProduct(p.id), {
                                                                                            loading: 'Deleting...',
                                                                                            success: 'Product deleted',
                                                                                            error: (err) => err.message || 'Failed to delete'
                                                                                        });
                                                                                    }
                                                                                }}
                                                                                className="p-1 px-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                                                                title="Delete Product"
                                                                            >
                                                                                <Trash2 className="h-3 w-3" />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            )}
                                                        </tr>
                                                    ))}
                                                    <tr>
                                                        <td colSpan={canEdit ? 5 : 4} className="p-0">
                                                            <PaginationControls totalPages={totalPages} totalItems={totalItems} />
                                                        </td>
                                                    </tr>
                                                </>
                                            );
                                        })()}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <div className="md:col-span-1">
                        <div className="rounded-xl border bg-white shadow-sm p-6 sticky top-6">
                            <h3 className="text-lg font-bold mb-4">Create New Product</h3>
                            <CreateProductForm categories={categories} suppliers={suppliers} />
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: STOCK IN */}
            {activeTab === "stock_in" && (
                <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="rounded-xl border bg-white shadow-sm p-8">
                        <div className="mb-6 border-b pb-4">
                            <h2 className="text-xl font-bold">Add Incoming Stock</h2>
                            <p className="text-sm text-gray-500">Record new stock arrival at warehouse.</p>
                        </div>

                        <StockInForm products={products} warehouses={warehouses} isAdmin={isAdmin} userWarehouseId={userWarehouseId} />
                    </div>
                </div>
            )}


            {activeTab === "transfer" && (
                <StockTransferForm
                    products={products}
                    warehouses={warehouses}
                    isAdmin={isAdmin}
                    userWarehouseId={userWarehouseId}
                    inventory={inventory}
                />
            )}

            {isAdmin && activeTab === "categories" && (
                <CategoryManagement categories={categories} />
            )}

            {isAdmin && activeTab === "suppliers" && (
                <SupplierManagement suppliers={suppliers} />
            )}

            {activeTab === "opname" && (
                <StockOpnameForm products={products} warehouses={warehouses} isAdmin={isAdmin} userWarehouseId={userWarehouseId} inventory={inventory} />
            )}
            {/* Modals */}
            {editingStock && (
                <EditStockModal
                    stock={editingStock}
                    onClose={() => setEditingStock(null)}
                />
            )}
            {editingProduct && (
                <EditProductModal
                    product={editingProduct}
                    onClose={() => setEditingProduct(null)}
                />
            )}
        </div>
    );
}


function StockInForm({ products, warehouses, isAdmin, userWarehouseId }: { products: InventoryViewProps['products'], warehouses: InventoryViewProps['warehouses'], isAdmin: boolean, userWarehouseId?: string }) {
    const [quantity, setQuantity] = useState<string>("");
    const [totalPrice, setTotalPrice] = useState<string>("");
    const [unitPrice, setUnitPrice] = useState<number>(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Auto-calculate Unit Price
    useEffect(() => {
        const qty = parseInt(quantity.replace(/\./g, "") || "0");
        const total = parseInt(totalPrice.replace(/\./g, "") || "0");

        if (qty > 0 && total > 0) {
            setUnitPrice(Math.round(total / qty));
        } else {
            setUnitPrice(0);
        }
    }, [quantity, totalPrice]);

    // Format Number with Dots (1.000)
    const formatNumber = (value: string) => {
        // Prevent negative numbers
        if (value.includes("-")) return value.replace(/-/g, "");
        return value.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQuantity(formatNumber(e.target.value));
    };

    const handleTotalPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTotalPrice(formatNumber(e.target.value));
    };

    // Clean data before submit
    const handleSubmit = async (formData: FormData) => {
        if (isSubmitting) return;

        const qty = parseInt(quantity.replace(/\./g, ""));
        const total = parseInt(totalPrice.replace(/\./g, ""));

        if (!qty || qty <= 0) {
            toast.error("Jumlah barang harus lebih dari 0");
            return;
        }

        if (total < 0) {
            toast.error("Total harga tidak boleh negatif");
            return;
        }

        setIsSubmitting(true);
        const promise = new Promise(async (resolve, reject) => {
            try {
                formData.set("quantity", quantity.replace(/\./g, ""));
                formData.set("buy_price", unitPrice.toString());
                await addStock(formData);
                setQuantity("");
                setTotalPrice("");
                setUnitPrice(0);
                resolve("Stock added successfully");
            } catch (error) {
                reject(error);
            } finally {
                setIsSubmitting(false);
            }
        });

        toast.promise(promise, {
            loading: 'Adding stock...',
            success: 'Stock has been added successfully! 📦',
            error: 'Failed to add stock. Please try again.',
        });
    };

    return (
        <form action={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Product</label>
                    <select name="product_id" className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5 bg-gray-50">
                        {products?.map((p) => (
                            <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                        ))}
                    </select>
                </div>

                <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Destination Warehouse</label>
                    {isAdmin ? (
                        <select name="warehouse_id" className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5 bg-gray-50">
                            {warehouses?.map((w) => (
                                <option key={w.id} value={w.id}>{w.name}</option>
                            ))}
                        </select>
                    ) : (
                        <>
                            <input type="hidden" name="warehouse_id" value={userWarehouseId || ''} />
                            <div className="block w-full rounded-lg border-gray-300 bg-gray-100 p-2.5 text-gray-500 text-sm border">
                                Your Assigned Warehouse
                            </div>
                        </>
                    )}
                </div>

                <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity Received</label>
                    <div className="relative">
                        <input
                            name="quantity_display"
                            type="text"
                            value={quantity}
                            onChange={handleQuantityChange}
                            required
                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5 pl-4 bg-gray-50"
                            placeholder="0"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">pcs</span>
                        </div>
                    </div>
                </div>

                <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Purchase Price (IDR)</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">Rp</span>
                        </div>
                        <input
                            name="total_price_display"
                            type="text"
                            value={totalPrice}
                            onChange={handleTotalPriceChange}
                            required
                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5 pl-10 bg-gray-50"
                            placeholder="0"
                        />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Total modal yang dikeluarkan untuk stok ini.</p>
                </div>

                <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Calculated Unit Price</label>
                    <div className="block w-full rounded-lg border-gray-300 bg-gray-100 p-2.5 pl-4 text-gray-700 sm:text-sm border font-mono">
                        Rp {unitPrice.toLocaleString("id-ID")} / pc
                    </div>
                </div>
            </div>

            <div className="pt-4 border-t">
                <SubmitButton
                    disabled={isSubmitting}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg text-sm font-semibold shadow-md shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? "Saving..." : "Confirm Stock Arrival"}
                </SubmitButton>
            </div>
        </form>
    );
}

function CreateProductForm({ categories, suppliers }: { categories: Category[] | null, suppliers: Supplier[] | null }) {
    const [sellPrice, setSellPrice] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Format Number with Dots (1.000)
    const formatNumber = (value: string) => {
        return value.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    const handleSellPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSellPrice(formatNumber(e.target.value));
    };

    const handleSubmit = async (formData: FormData) => {
        if (isSubmitting) return;

        const price = parseFloat(sellPrice.replace(/\./g, ""));
        if (!price || price <= 0) {
            toast.error("Harga jual harus lebih dari 0");
            return;
        }

        setIsSubmitting(true);
        try {
            formData.set("sell_price", price.toString());
            await addProduct(formData);
            toast.success("Produk berhasil ditambahkan!");
            setSellPrice("");
            const form = document.querySelector('form') as HTMLFormElement;
            form?.reset();
        } catch (error) {
            toast.error("Gagal menambahkan produk");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form action={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                <input name="name" required className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                <input name="sku" required className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select name="category_id" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2">
                        <option value="">No Category</option>
                        {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                    <select name="supplier_id" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2">
                        <option value="">No Supplier</option>
                        {suppliers?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sell Price</label>
                    <input
                        type="text"
                        required
                        value={sellPrice}
                        onChange={handleSellPriceChange}
                        placeholder="0"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min. Stock Alert</label>
                    <input
                        type="number"
                        name="low_stock_threshold"
                        defaultValue="10"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                    />
                </div>
            </div>
            <SubmitButton disabled={isSubmitting} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all">
                {isSubmitting ? "Processing..." : "Create Product"}
            </SubmitButton>
        </form>
    );
}

function CategoryManagement({ categories }: { categories: Category[] | null }) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (formData: FormData) => {
        setIsSubmitting(true);
        try {
            await addCategory(formData);
            toast.success("Category added!");
            const form = document.querySelector('form') as HTMLFormElement;
            form?.reset();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-500">
            <div className="md:col-span-1 rounded-xl border bg-white p-6 shadow-sm h-fit">
                <h3 className="text-lg font-bold mb-4">Add Category</h3>
                <form action={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <input name="name" required className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea name="description" rows={3} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
                    </div>
                    <SubmitButton disabled={isSubmitting} className="w-full bg-indigo-600 text-white py-2 rounded-md font-bold hover:bg-indigo-700 transition-all">
                        {isSubmitting ? "Saving..." : "Save Category"}
                    </SubmitButton>
                </form>
            </div>
            <div className="md:col-span-2 rounded-xl border bg-white shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-3 font-medium text-gray-500">Name</th>
                            <th className="px-6 py-3 font-medium text-gray-500">Description</th>
                            <th className="px-6 py-3 font-medium text-gray-500 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {categories?.map(c => (
                            <tr key={c.id}>
                                <td className="px-6 py-4 font-medium">{c.name}</td>
                                <td className="px-6 py-4 text-gray-500">{c.description}</td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => deleteCategory(c.id)} className="text-red-600 hover:text-red-800 p-2"><Trash2 className="h-4 w-4" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function SupplierManagement({ suppliers }: { suppliers: Supplier[] | null }) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (formData: FormData) => {
        setIsSubmitting(true);
        try {
            await addSupplier(formData);
            toast.success("Supplier added!");
            const form = document.querySelector('form') as HTMLFormElement;
            form?.reset();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-500">
            <div className="md:col-span-1 rounded-xl border bg-white p-6 shadow-sm h-fit">
                <h3 className="text-lg font-bold mb-4">Add Supplier</h3>
                <form action={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <input name="name" required className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                        <input name="contact_name" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <input name="phone" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                        <textarea name="address" rows={2} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
                    </div>
                    <SubmitButton disabled={isSubmitting} className="w-full bg-indigo-600 text-white py-2 rounded-md font-bold hover:bg-indigo-700 transition-all">
                        {isSubmitting ? "Saving..." : "Save Supplier"}
                    </SubmitButton>
                </form>
            </div>
            <div className="md:col-span-2 rounded-xl border bg-white shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-3 font-medium text-gray-500">Name</th>
                            <th className="px-6 py-3 font-medium text-gray-500">Contact</th>
                            <th className="px-6 py-3 font-medium text-gray-500">Phone</th>
                            <th className="px-6 py-3 font-medium text-gray-500 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {suppliers?.map(s => (
                            <tr key={s.id}>
                                <td className="px-6 py-4 font-medium">{s.name}</td>
                                <td className="px-6 py-4 text-gray-500">{s.contact_name}</td>
                                <td className="px-6 py-4 text-gray-500">{s.phone}</td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => deleteSupplier(s.id)} className="text-red-600 hover:text-red-800 p-2"><Trash2 className="h-4 w-4" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function StockOpnameForm({
    products,
    warehouses,
    isAdmin,
    userWarehouseId,
    inventory
}: {
    products: Product[] | null,
    warehouses: Warehouse[] | null,
    isAdmin: boolean,
    userWarehouseId?: string,
    inventory: InventoryItem[] | null
}) {
    const [selectedProductId, setSelectedProductId] = useState("");
    const [selectedWarehouseId, setSelectedWarehouseId] = useState(isAdmin ? "" : (userWarehouseId || ""));
    const [isSubmitting, setIsSubmitting] = useState(false);

    const systemStock = inventory?.filter(
        item => item.product.sku === products?.find(p => p.id === selectedProductId)?.sku &&
            (warehouses?.find(w => w.name === item.warehouse.name)?.id === selectedWarehouseId)
    ).reduce((sum, item) => sum + item.quantity_remaining, 0) || 0;

    const handleSubmit = async (formData: FormData) => {
        setIsSubmitting(true);
        try {
            await recordStockOpname(formData);
            toast.success("Stock opname recorded!");
            setSelectedProductId("");
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto bg-white rounded-2xl border shadow-sm p-8 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-xl font-bold mb-6 pb-4 border-b">Stock Opname Audit</h2>
            <form action={handleSubmit} className="space-y-6">
                <input type="hidden" name="warehouse_id" value={selectedWarehouseId} />
                <input type="hidden" name="system_stock" value={systemStock} />

                {isAdmin && (
                    <div className="space-y-2">
                        <label className="text-sm font-semibold">Warehouse</label>
                        <select
                            value={selectedWarehouseId}
                            onChange={e => setSelectedWarehouseId(e.target.value)}
                            className="w-full p-2 border rounded-md"
                        >
                            <option value="">Select Warehouse</option>
                            {warehouses?.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                        </select>
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-sm font-semibold">Product</label>
                    <SearchableProductSelector
                        products={products || []}
                        value={selectedProductId}
                        onSelect={setSelectedProductId}
                    />
                </div>

                <div className="grid grid-cols-2 gap-6 bg-gray-50 p-4 rounded-xl">
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold">System Stock</p>
                        <p className="text-2xl font-bold">{systemStock} Units</p>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 uppercase font-bold">Actual Stock (Physical)</label>
                        <input name="actual_stock" type="number" required placeholder="0" className="w-full text-2xl font-bold bg-white p-2 border rounded-md mt-1" />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold">Notes</label>
                    <textarea name="notes" placeholder="Reason for difference, etc." className="w-full p-2 border rounded-md" />
                </div>

                <SubmitButton disabled={isSubmitting} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-all">
                    {isSubmitting ? "Recording..." : "Record Opname"}
                </SubmitButton>
            </form>
        </div>
    );
}


function EditStockModal({ stock, onClose }: { stock: InventoryItem, onClose: () => void }) {
    const [quantity, setQuantity] = useState<string>(stock.quantity_remaining.toString());
    const [buyPrice, setBuyPrice] = useState<string>(stock.buy_price.toString());
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const qty = parseInt(quantity);
        const price = parseFloat(buyPrice);

        if (qty < 0 || price < 0) {
            toast.error("Values cannot be negative");
            return;
        }

        setIsSubmitting(true);
        try {
            await updateStock(stock.id, qty, price);
            toast.success("Stock updated!");
            onClose();
        } catch (error) {
            toast.error("Failed to update stock");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold">Edit Stock</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                        <input disabled value={(stock.product as any)?.name} className="block w-full rounded-md border-gray-200 bg-gray-100 text-gray-500 sm:text-sm border p-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Remaining Quantity</label>
                        <input
                            type="number"
                            min="0"
                            value={quantity}
                            onChange={e => setQuantity(e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Buy Price</label>
                        <input
                            type="number"
                            min="0"
                            value={buyPrice}
                            onChange={e => setBuyPrice(e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                        />
                    </div>
                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 font-medium">Cancel</button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function StockTransferForm({
    products,
    warehouses,
    isAdmin,
    userWarehouseId,
    inventory
}: {
    products: InventoryViewProps['products'],
    warehouses: InventoryViewProps['warehouses'],
    isAdmin: boolean,
    userWarehouseId?: string,
    inventory: InventoryItem[] | null
}) {
    const [selectedProductId, setSelectedProductId] = useState("");
    const [fromWarehouseId, setFromWarehouseId] = useState(isAdmin ? "" : (userWarehouseId || ""));
    const [toWarehouseId, setToWarehouseId] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Calculate available stock for the selected product in the selected warehouse
    const availableStock = inventory?.filter(
        item => item.product.sku === products?.find(p => p.id === selectedProductId)?.sku &&
            (warehouses?.find(w => w.name === item.warehouse.name)?.id === fromWarehouseId)
    ).reduce((sum, item) => sum + item.quantity_remaining, 0) || 0;

    const handleSubmit = async (formData: FormData) => {
        setIsSubmitting(true);
        try {
            const res = await transferStock(formData);
            if (res.success) {
                toast.success("Stock transferred successfully");
                setSelectedProductId("");
                setToWarehouseId("");
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to transfer stock");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto bg-white rounded-2xl border shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-6 border-b bg-gray-50/50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                        <ArrowLeftRight className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Transfer Stock</h2>
                        <p className="text-sm text-gray-500">Move products between warehouses safely.</p>
                    </div>
                </div>
            </div>

            <form action={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 gap-6">
                    {/* Product Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Product</label>
                        <SearchableProductSelector
                            products={products || []}
                            value={selectedProductId}
                            onSelect={setSelectedProductId}
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {/* From Warehouse */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">From Warehouse</label>
                            <select
                                name="from_warehouse_id"
                                required
                                value={fromWarehouseId}
                                onChange={(e) => setFromWarehouseId(e.target.value)}
                                disabled={!isAdmin}
                                className="w-full h-11 rounded-xl border-gray-200 bg-gray-50 px-4 text-sm focus:border-indigo-500 focus:ring-indigo-500 transition-all disabled:opacity-60"
                            >
                                <option value="">Select Source</option>
                                {warehouses?.map((w) => (
                                    <option key={w.id} value={w.id}>{w.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* To Warehouse */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">To Warehouse</label>
                            <select
                                name="to_warehouse_id"
                                required
                                value={toWarehouseId}
                                onChange={(e) => setToWarehouseId(e.target.value)}
                                className="w-full h-11 rounded-xl border-gray-200 bg-gray-50 px-4 text-sm focus:border-indigo-500 focus:ring-indigo-500 transition-all"
                            >
                                <option value="">Select Destination</option>
                                {warehouses?.filter(w => w.id !== fromWarehouseId).map((w) => (
                                    <option key={w.id} value={w.id}>{w.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Available Stock Info */}
                    {selectedProductId && fromWarehouseId && (
                        <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 flex items-center gap-3">
                            <Boxes className="h-5 w-5 text-amber-600" />
                            <div>
                                <p className="text-xs text-amber-700 font-medium">Available Stock in Source</p>
                                <p className="text-lg font-bold text-amber-900">{availableStock} Units</p>
                            </div>
                        </div>
                    )}

                    {/* Quantity */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Transfer Quantity</label>
                        <input
                            type="number"
                            name="quantity"
                            required
                            min="1"
                            max={availableStock}
                            placeholder="0"
                            className="w-full h-11 rounded-xl border-gray-200 bg-gray-50 px-4 text-sm focus:border-indigo-500 focus:ring-indigo-500 transition-all"
                        />
                    </div>
                </div>

                <div className="flex gap-3 pt-4">
                    <SubmitButton
                        disabled={isSubmitting}
                        className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? "Processing..." : "Confirm Transfer"}
                    </SubmitButton>
                </div>
            </form>
        </div>
    );
}

function SearchableProductSelector({
    products,
    onSelect,
    value
}: {
    products: Product[];
    onSelect: (productId: string) => void;
    value: string;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");

    const selectedProduct = products.find(p => p.id === value);
    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="relative">
            <input type="hidden" name="product_id" value={value} />
            <div
                className="w-full h-11 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm flex items-center justify-between cursor-pointer focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex-1 truncate">
                    {selectedProduct ? `${selectedProduct.name} (${selectedProduct.sku})` : "Select Product"}
                </div>
                <Search className="h-4 w-4 text-gray-400" />
            </div>

            {isOpen && (
                <div className="absolute z-50 mt-2 w-full bg-white rounded-xl border shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="p-2 border-b bg-gray-50">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                            <input
                                autoFocus
                                type="text"
                                placeholder="Cari nama atau SKU..."
                                className="w-full pl-9 h-9 rounded-lg border-gray-200 bg-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                        {filteredProducts.length > 0 ? (
                            filteredProducts.map((p) => (
                                <div
                                    key={p.id}
                                    className="px-4 py-3 hover:bg-indigo-50 cursor-pointer flex flex-col gap-0.5 border-b border-gray-50 last:border-0"
                                    onClick={() => {
                                        onSelect(p.id);
                                        setIsOpen(false);
                                        setSearch("");
                                    }}
                                >
                                    <span className="text-sm font-semibold text-gray-900">{p.name}</span>
                                    <span className="text-xs text-gray-500">{p.sku}</span>
                                </div>
                            ))
                        ) : (
                            <div className="px-4 py-6 text-center text-sm text-gray-500">
                                Produk tidak ditemukan
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Click away listener */}
            {isOpen && (
                <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            )}
        </div>
    );
}

function EditProductModal({ product, onClose }: { product: Product, onClose: () => void }) {

    const [name, setName] = useState(product.name);
    const [sku, setSku] = useState(product.sku);
    const [sellPrice, setSellPrice] = useState(product.sell_price.toString());
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const price = parseFloat(sellPrice);
        if (price < 0) {
            toast.error("Price cannot be negative");
            return;
        }

        setIsSubmitting(true);
        try {
            await updateProduct(product.id, name, sku, price);
            toast.success("Product updated!");
            onClose();
        } catch (error) {
            toast.error("Failed to update product");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold">Edit Product</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                        <input value={name} onChange={e => setName(e.target.value)} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                        <input value={sku} onChange={e => setSku(e.target.value)} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sell Price</label>
                        <input
                            type="number"
                            min="0"
                            value={sellPrice}
                            onChange={e => setSellPrice(e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                        />
                    </div>
                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 font-medium">Cancel</button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
