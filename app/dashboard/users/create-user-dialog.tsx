"use client";

import { useState, useEffect } from "react";
import { createUser } from "./actions";
import { getWarehouses } from "../inventory/actions";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function CreateUserDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [warehouses, setWarehouses] = useState<{ id: string, name: string }[]>([]);

    // Form State
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [role, setRole] = useState("kasir");
    const [warehouseId, setWarehouseId] = useState("");

    const router = useRouter();

    useEffect(() => {
        if (isOpen) {
            getWarehouses().then(setWarehouses);
        }
    }, [isOpen]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsLoading(true);

        try {
            const result = await createUser({
                email,
                password,
                full_name: fullName,
                role,
                warehouse_id: warehouseId || null
            });

            if (result.success) {
                toast.success("User created successfully");
                setIsOpen(false);
                router.refresh();
                // Reset form
                setEmail("");
                setPassword("");
                setFullName("");
                setRole("kasir");
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
            >
                <Plus className="mr-2 h-4 w-4" />
                Add User
            </button>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-6 animate-in zoom-in-95">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New User</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Full Name</label>
                        <input
                            required
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            placeholder="e.g. Budi Santoso"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            required
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            placeholder="budi@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                            required
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            placeholder="Min. 6 characters"
                            minLength={6}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Role</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                            <option value="kasir">Kasir</option>
                            <option value="gudang">Staf Gudang</option>
                            <option value="superadmin">Superadmin</option>
                        </select>
                    </div>

                    {role !== "superadmin" && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Assign Warehouse</label>
                            <select
                                required
                                value={warehouseId}
                                onChange={(e) => setWarehouseId(e.target.value)}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                                <option value="">Select Warehouse...</option>
                                {warehouses.map(w => (
                                    <option key={w.id} value={w.id}>{w.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md border"
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md flex items-center gap-2"
                        >
                            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                            Create User
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
