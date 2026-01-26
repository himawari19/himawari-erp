"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { checkout, searchProducts } from "@/app/dashboard/pos/actions";
import { getCustomers } from "../master/customers/actions";
import { Loader2, Search, ShoppingCart, Trash2, Plus, Minus, Package, User } from "lucide-react";
import { toast } from "sonner";
import { SearchableDropdown } from "@/components/ui/searchable-dropdown";
import { useDebounce } from "use-debounce";
import ReceiptModal from "./receipt-modal";

type Product = {
    id: string;
    name: string;
    sku: string;
    sell_price: number;
    image_url?: string | null;
};

type CartItem = Product & {
    quantity: number;
};

type Customer = {
    id: string;
    name: string;
};

export default function POSPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<string>("");
    const [cart, setCart] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearchTerm] = useDebounce(searchTerm, 500);

    // Receipt State
    const [showReceipt, setShowReceipt] = useState(false);
    const [lastTransaction, setLastTransaction] = useState<any>(null);

    const supabase = createClient();

    // Fetch Customers once
    useEffect(() => {
        getCustomers().then(data => {
            if (data) setCustomers(data);
            setLoading(false);
        });
    }, []);

    // Fetch Products when debounced search term changes
    useEffect(() => {
        async function fetchProducts() {
            setSearching(true);
            const data = await searchProducts(debouncedSearchTerm);
            setProducts(data);
            setSearching(false);
        }
        fetchProducts();
    }, [debouncedSearchTerm]);

    const addToCart = (product: Product) => {
        setCart((prev) => {
            const existing = prev.find((item) => item.id === product.id);
            if (existing) {
                return prev.map((item) =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { ...product, quantity: 1 }];
        });
    };

    const removeFromCart = (id: string) => {
        setCart((prev) => prev.filter((item) => item.id !== id));
    };

    const updateQuantity = (id: string, delta: number) => {
        setCart((prev) =>
            prev.map((item) => {
                if (item.id === id) {
                    const newQty = Math.max(1, item.quantity + delta);
                    return { ...item, quantity: newQty };
                }
                return item;
            })
        );
    };

    const total = cart.reduce((sum, item) => sum + item.sell_price * item.quantity, 0);

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        setProcessing(true);

        try {
            const result = await checkout(cart, selectedCustomer || null);
            if (result.success) {
                // Save data for receipt before clearing cart
                const customerName = customers.find(c => c.id === selectedCustomer)?.name || "Guest";
                setLastTransaction({
                    items: [...cart],
                    total: total,
                    customerName,
                    date: new Date()
                });

                setCart([]);
                setSelectedCustomer(""); // Reset customer
                setSearchTerm("");
                setShowReceipt(true);
                toast.success("Transaction completed successfully!");
            } else {
                toast.error(result.error || "Checkout failed");
            }
        } catch (e: any) {
            console.error(e);
            toast.error("An unexpected error occurred");
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return (
        <div className="flex h-full items-center justify-center flex-col gap-4 text-gray-500">
            <Loader2 className="animate-spin w-8 h-8 text-indigo-600" />
            <p>Loading Point of Sale...</p>
        </div>
    );

    return (
        <>
            <div className="h-[calc(100vh-6rem)] w-full max-w-[1600px] mx-auto flex flex-col lg:flex-row gap-6 p-4 lg:p-6 bg-gray-50/50">

                {/* LEFT SIDE: PRODUCT BROWSER */}
                <div className="flex-1 flex flex-col min-w-0 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Header & Search */}
                    <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white sticky top-0 z-10">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Point of Sale</h1>
                            <p className="text-sm text-gray-500">Select items to add to current order</p>
                        </div>

                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name or SKU..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Product Grid */}
                    <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                        {searching ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-4">
                                <Loader2 className="animate-spin w-8 h-8 text-indigo-600" />
                                <p>Searching products...</p>
                            </div>
                        ) : products.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-3 min-h-[300px]">
                                <Package className="w-12 h-12 opacity-20" />
                                <p>No products found matching "{searchTerm}"</p>
                                <button
                                    onClick={() => setSearchTerm("")}
                                    className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                                >
                                    Clear search
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {products.map((product: Product) => (
                                    <button
                                        key={product.id}
                                        onClick={() => addToCart(product)}
                                        className="group relative flex flex-col items-start p-4 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 hover:shadow-md transition-all duration-200 text-left hover:-translate-y-0.5"
                                    >
                                        <div className="flex-1 w-full">
                                            <div className="flex justify-between items-start w-full mb-1">
                                                <div className="font-semibold text-gray-900 line-clamp-2 leading-tight group-hover:text-indigo-700 transition-colors">
                                                    {product.name}
                                                </div>
                                            </div>
                                            <div className="text-xs font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-md inline-block mb-3">
                                                {product.sku}
                                            </div>
                                        </div>

                                        <div className="w-full flex items-center justify-between mt-auto pt-3 border-t border-gray-50 group-hover:border-gray-100">
                                            <span className="font-bold text-indigo-600 text-lg">
                                                Rp {product.sell_price.toLocaleString("id-ID")}
                                            </span>
                                            <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                <Plus className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT SIDE: CART (RECEIPT STYLE) */}
                <div className="w-full lg:w-[420px] bg-white rounded-2xl shadow-xl flex flex-col border border-gray-100 overflow-hidden flex-shrink-0 h-[600px] lg:h-auto z-20">
                    <div className="p-6 bg-indigo-600 text-white shadow-lg relative overflow-hidden">
                        <div className="relative z-10 flex items-center gap-3">
                            <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                                <ShoppingCart className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Current Order</h2>
                                <p className="text-indigo-200 text-sm">
                                    {cart.length === 0 ? "No items" : `${cart.reduce((a, b) => a + b.quantity, 0)} items`}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Customer Selector */}
                    <div className="px-6 pt-4 pb-2 border-b border-gray-100">
                        <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wider">Customer</label>
                        <SearchableDropdown
                            items={customers}
                            value={selectedCustomer}
                            onChange={setSelectedCustomer}
                            placeholder="Guest Customer (Anonymous)"
                        />
                    </div>

                    {/* Cart Items List */}
                    <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-200">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4 opacity-60">
                                <ShoppingCart className="w-16 h-16" />
                                <p className="font-medium">Cart is empty</p>
                                <p className="text-sm text-center px-10 text-gray-400">Select a customer above and scan items to start</p>
                            </div>
                        ) : (
                            <div className="space-y-1 p-2 pb-20">
                                {cart.map((item) => (
                                    <div key={item.id} className="flex gap-4 p-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-colors group">
                                        {/* Qty Controls */}
                                        <div className="flex flex-col items-center justify-center gap-1 bg-gray-100 rounded-lg p-1 h-fit my-auto">
                                            <button
                                                onClick={() => updateQuantity(item.id, 1)}
                                                className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all"
                                            >
                                                <Plus className="w-3 h-3" />
                                            </button>
                                            <span className="text-sm font-bold w-6 text-center tabular-nums">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.id, -1)}
                                                className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-gray-600 hover:bg-red-500 hover:text-white transition-all"
                                            >
                                                <Minus className="w-3 h-3" />
                                            </button>
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                                            <div className="font-semibold text-gray-900 truncate">
                                                {item.name}
                                            </div>
                                            <div className="text-sm text-gray-500 flex justify-between">
                                                <span>@ {item.sell_price.toLocaleString("id-ID")}</span>
                                            </div>
                                        </div>

                                        {/* Total & Delete */}
                                        <div className="flex flex-col items-end justify-between py-1">
                                            <div className="font-bold text-gray-900 tabular-nums">
                                                {(item.sell_price * item.quantity).toLocaleString("id-ID")}
                                            </div>
                                            <button
                                                onClick={() => removeFromCart(item.id)}
                                                className="text-gray-300 hover:text-red-500 transition-colors p-1"
                                                title="Remove item"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer Section */}
                    <div className="bg-white border-t p-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between text-gray-500 text-sm">
                                <span>Subtotal</span>
                                <span>Rp {total.toLocaleString("id-ID")}</span>
                            </div>
                            <div className="flex justify-between items-end pt-3 border-t border-dashed">
                                <span className="text-lg font-bold text-gray-900">Total Payment</span>
                                <span className="text-3xl font-bold text-indigo-600 tracking-tight">
                                    <span className="text-xl align-top mr-1">Rp</span>
                                    {total.toLocaleString("id-ID")}
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={handleCheckout}
                            disabled={processing || cart.length === 0}
                            className="w-full bg-indigo-600 text-white h-14 rounded-xl font-bold text-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-3 transition-all hover:shadow-lg hover:shadow-indigo-200 active:scale-[0.98]"
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="animate-spin w-5 h-5" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <span>Complete Transaction</span>
                                    <div className="bg-white/20 rounded px-2 py-0.5 text-sm">
                                        Enter
                                    </div>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <ReceiptModal
                isOpen={showReceipt}
                onClose={() => setShowReceipt(false)}
                data={lastTransaction}
            />
        </>
    );
}
