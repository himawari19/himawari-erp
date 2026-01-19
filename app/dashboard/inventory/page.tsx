import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export default async function InventoryPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    // Get User Role & Warehouse
    const { data: profile } = await supabase
        .from("profiles")
        .select("role, warehouse_id")
        .eq("id", user.id)
        .single();

    const isAdmin = profile?.role === "superadmin";

    // Fetch Inventory
    // If superadmin, fetch all. If warehouse, policy restricts to own.
    const { data: inventory } = await supabase
        .from("inventory_batches")
        .select(`
      id,
      quantity_remaining,
      buy_price,
      created_at,
      warehouse:warehouses(name),
      product:products(name, sku)
    `)
        .order("created_at", { ascending: false });

    // Fetch Products for creating new stock
    const { data: products } = await supabase.from("products").select("*");
    // Fetch Warehouses for dropdown
    const { data: warehouses } = await supabase.from("warehouses").select("*");

    async function addStock(formData: FormData) {
        "use server";
        const supabase = await createClient();
        const product_id = formData.get("product_id");
        const warehouse_id = formData.get("warehouse_id");
        const quantity = parseInt(formData.get("quantity") as string);
        const buy_price = parseFloat(formData.get("buy_price") as string);

        await supabase.from("inventory_batches").insert({
            product_id,
            warehouse_id,
            quantity_remaining: quantity,
            original_quantity: quantity,
            buy_price,
        });
        revalidatePath("/dashboard/inventory");
    }

    async function addProduct(formData: FormData) {
        "use server";
        const supabase = await createClient();
        const name = formData.get("name");
        const sku = formData.get("sku");
        const sell_price = parseFloat(formData.get("sell_price") as string);

        await supabase.from("products").insert({
            name,
            sku,
            sell_price,
        });
        revalidatePath("/dashboard/inventory");
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">Inventory Management</h2>
            </div>

            {/* Add Product Form (Admin Only) */}
            {isAdmin && (
                <div className="p-6 bg-white rounded-xl shadow border">
                    <h3 className="text-lg font-medium mb-4">Add New Product</h3>
                    <form action={addProduct} className="flex gap-4 items-end">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Name</label>
                            <input name="name" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">SKU</label>
                            <input name="sku" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Sell Price (IDR)</label>
                            <input name="sell_price" type="number" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
                        </div>
                        <button className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800">Create Product</button>
                    </form>
                </div>
            )}

            {/* Add Stock Form */}
            <div className="p-6 bg-white rounded-xl shadow border">
                <h3 className="text-lg font-medium mb-4">Incoming Stock</h3>
                <form action={addStock} className="flex flex-wrap gap-4 items-end">
                    <div className="w-full sm:w-auto">
                        <label className="block text-sm font-medium text-gray-700">Product</label>
                        <select name="product_id" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2 bg-white">
                            {products?.map((p) => (
                                <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                            ))}
                        </select>
                    </div>

                    <div className="w-full sm:w-auto">
                        <label className="block text-sm font-medium text-gray-700">Warehouse</label>
                        {/* If admin, select warehouse. If not, hidden input with own warehouse */}
                        {isAdmin ? (
                            <select name="warehouse_id" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2 bg-white">
                                {warehouses?.map((w) => (
                                    <option key={w.id} value={w.id}>{w.name}</option>
                                ))}
                            </select>
                        ) : (
                            <>
                                <input type="hidden" name="warehouse_id" value={profile?.warehouse_id || ''} />
                                <div className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm border p-2 bg-gray-100">
                                    Your Warehouse
                                </div>
                            </>
                        )}
                    </div>

                    <div className="w-full sm:w-auto">
                        <label className="block text-sm font-medium text-gray-700">Quantity</label>
                        <input name="quantity" type="number" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
                    </div>
                    <div className="w-full sm:w-auto">
                        <label className="block text-sm font-medium text-gray-700">Buy Price (IDR)</label>
                        <input name="buy_price" type="number" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" placeholder="e.g. 31000" />
                    </div>
                    <button className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">Add Stock</button>
                </form>
            </div>

            {/* Inventory List */}
            <div className="rounded-md border bg-white">
                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm text-left">
                        <thead className="[&_tr]:border-b">
                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Date</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Product</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Warehouse</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Buy Price</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Qty Remaining</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {inventory?.map((item) => (
                                <tr key={item.id} className="border-b transition-colors hover:bg-muted/50">
                                    <td className="p-4 align-middle">{new Date(item.created_at).toLocaleDateString()}</td>
                                    <td className="p-4 align-middle font-medium">{(item.product as any)?.name} ({(item.product as any)?.sku})</td>
                                    <td className="p-4 align-middle">{(item.warehouse as any)?.name}</td>
                                    <td className="p-4 align-middle">Rp {item.buy_price.toLocaleString()}</td>
                                    <td className="p-4 align-middle">{item.quantity_remaining}</td>
                                </tr>
                            ))}
                            {!inventory?.length && (
                                <tr>
                                    <td colSpan={5} className="p-4 text-center text-muted-foreground">No inventory records found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
