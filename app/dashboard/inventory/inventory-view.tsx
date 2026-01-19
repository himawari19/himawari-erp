"use client";

import { useState, useEffect } from "react";
import { Plus, Package, History, Boxes, Search, Filter } from "lucide-react";
import { SubmitButton } from "@/app/login/submit-button";
import { addProduct, addStock } from "./actions";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

// Types
type Product = { id: string; name: string; sku: string; sell_price: number };
type Warehouse = { id: string; name: string };
type InventoryItem = {
    id: string;
    quantity_remaining: number;
    buy_price: number;
    created_at: string;
    warehouse: { name: string };
    product: { name: string; sku: string };
};

interface InventoryViewProps {
    products: Product[] | null;
    warehouses: Warehouse[] | null;
    inventory: InventoryItem[] | null;
    isAdmin: boolean;
    userWarehouseId?: string;
}

export function InventoryView({ products, warehouses, inventory, isAdmin, userWarehouseId }: InventoryViewProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const activeTab = searchParams.get("tab") || "overview";

    const setActiveTab = (tab: string) => {
        const params = new URLSearchParams(searchParams);
        params.set("tab", tab);
        router.replace(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Inventory Management</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage products, stock levels, and warehouse operations.</p>
                </div>
                {/* Tab Pill Navigation - kept for mobile or if sidebar is collapsed, but primary nav is now intended to be sidebar */}
                <div className="hidden sm:flex p-1 bg-gray-100 rounded-lg self-start">
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
                    {isAdmin && (
                        <button
                            onClick={() => setActiveTab("products")}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === "products"
                                ? "bg-white text-indigo-600 shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <Package className="h-4 w-4" />
                                Master Products
                            </div>
                        </button>
                    )}
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

            {/* TAB CONTENT: STOCK HISTORY (OVERVIEW) */}
            {activeTab === "overview" && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Inventory Batches</h2>
                        <div className="flex gap-2">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                                <input type="text" placeholder="Search stock..." className="pl-9 h-9 w-64 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
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
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {inventory?.map((item) => (
                                    <tr key={item.id} className="group hover:bg-gray-50/50 transition-colors">
                                        <td className="p-6 align-middle text-gray-600">{new Date(item.created_at).toLocaleDateString()}</td>
                                        <td className="p-6 align-middle font-medium text-gray-900">
                                            {(item.product as any)?.name}
                                            <span className="ml-2 text-xs text-gray-400 font-normal">{(item.product as any)?.sku}</span>
                                        </td>
                                        <td className="p-6 align-middle text-gray-600">{(item.warehouse as any)?.name}</td>
                                        <td className="p-6 align-middle text-right font-mono">Rp {item.buy_price.toLocaleString()}</td>
                                        <td className="p-6 align-middle text-center">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${item.quantity_remaining > 5 ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20' : 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20'}`}>
                                                {item.quantity_remaining} units
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {!inventory?.length && (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-gray-500">
                                            <div className="flex flex-col items-center gap-2">
                                                <Boxes className="h-8 w-8 text-gray-300" />
                                                <p>No inventory records found.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
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
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {products?.map((p) => (
                                            <tr key={p.id} className="hover:bg-gray-50/50">
                                                <td className="p-4 align-middle">
                                                    <span className="inline-flex h-2 w-2 rounded-full bg-green-500 ring-4 ring-green-500/20"></span>
                                                </td>
                                                <td className="p-4 align-middle font-medium text-gray-900">{p.name}</td>
                                                <td className="p-4 align-middle text-gray-500 font-mono text-xs">{p.sku}</td>
                                                <td className="p-4 align-middle text-gray-700">Rp {p.sell_price.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <div className="md:col-span-1">
                        <div className="rounded-xl border bg-white shadow-sm p-6 sticky top-6">
                            <h3 className="text-lg font-bold mb-4">Create New Product</h3>
                            <form action={addProduct} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                                    <input name="name" required placeholder="e.g. Indomie Goreng" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2 bg-gray-50" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">SKU Code</label>
                                    <input name="sku" required placeholder="IDM-001" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2 bg-gray-50" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price (IDR)</label>
                                    <input name="sell_price" type="number" required placeholder="3500" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2 bg-gray-50" />
                                </div>
                                <div className="pt-2">
                                    <SubmitButton className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2 rounded-lg text-sm font-medium">
                                        Create Product
                                    </SubmitButton>
                                </div>
                            </form>
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
        </div>
    );
}

function StockInForm({ products, warehouses, isAdmin, userWarehouseId }: { products: InventoryViewProps['products'], warehouses: InventoryViewProps['warehouses'], isAdmin: boolean, userWarehouseId?: string }) {
    const [quantity, setQuantity] = useState<string>("");
    const [totalPrice, setTotalPrice] = useState<string>("");
    const [unitPrice, setUnitPrice] = useState<number>(0);

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
        return value.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQuantity(formatNumber(e.target.value));
    };

    const handleTotalPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTotalPrice(formatNumber(e.target.value));
    };

    // Clean data before submit
    const handleSubmit = (formData: FormData) => {
        formData.set("quantity", quantity.replace(/\./g, ""));
        // We still need to send 'buy_price' (unit price) to the server action
        formData.set("buy_price", unitPrice.toString());
        return addStock(formData);
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
                <SubmitButton className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg text-sm font-semibold shadow-md shadow-indigo-200">
                    Confirm Stock Arrival
                </SubmitButton>
            </div>
        </form>
                    </div >
                </div >
            )
}
        </div >
    );
}
