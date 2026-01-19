"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { checkout } from "@/app/dashboard/pos/actions";
import { Loader2 } from "lucide-react";

type Product = {
    id: string;
    name: string;
    sku: string;
    sell_price: number;
};

type CartItem = Product & {
    quantity: number;
};

export default function POSPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        async function fetchProducts() {
            const { data } = await supabase.from("products").select("*");
            if (data) setProducts(data);
            setLoading(false);
        }
        fetchProducts();
    }, []);

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

        // We pass the cart as JSON string to the server action
        try {
            await checkout(cart);
            setCart([]); // Clear cart on success
            alert("Transaction completed!");
        } catch (e) {
            alert("Checkout failed. Check stock levels.");
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="flex h-[calc(100vh-8rem)] gap-4">
            {/* Product Grid */}
            <div className="flex-1 overflow-auto p-4 bg-white rounded-xl shadow border">
                <h2 className="text-2xl font-bold mb-4">Products</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {products.map((product) => (
                        <button
                            key={product.id}
                            onClick={() => addToCart(product)}
                            className="flex flex-col items-start p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left"
                        >
                            <div className="font-bold">{product.name}</div>
                            <div className="text-sm text-gray-500">{product.sku}</div>
                            <div className="mt-2 font-medium text-indigo-600">Rp {product.sell_price.toLocaleString()}</div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Cart Sidebar */}
            <div className="w-96 flex flex-col bg-white rounded-xl shadow border overflow-hidden">
                <div className="p-4 border-b bg-gray-50">
                    <h2 className="text-xl font-bold">Current Order</h2>
                </div>

                <div className="flex-1 overflow-auto p-4 space-y-4">
                    {cart.length === 0 ? (
                        <div className="text-center text-gray-500 mt-10">Cart is empty</div>
                    ) : (
                        cart.map((item) => (
                            <div key={item.id} className="flex justify-between items-center border-b pb-2">
                                <div>
                                    <div className="font-medium">{item.name}</div>
                                    <div className="text-sm text-gray-500">Rp {item.sell_price.toLocaleString()} x {item.quantity}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-gray-200 rounded">-</button>
                                    <span className="w-8 text-center">{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-gray-200 rounded">+</button>
                                    <button onClick={() => removeFromCart(item.id)} className="text-red-500 ml-2">x</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-4 border-t bg-gray-50 space-y-4">
                    <div className="flex justify-between text-xl font-bold">
                        <span>Total</span>
                        <span>Rp {total.toLocaleString()}</span>
                    </div>
                    <button
                        onClick={handleCheckout}
                        disabled={processing || cart.length === 0}
                        className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                    >
                        {processing && <Loader2 className="animate-spin w-4 h-4" />}
                        {processing ? "Processing..." : "Complete Sale"}
                    </button>
                </div>
            </div>
        </div>
    );
}
