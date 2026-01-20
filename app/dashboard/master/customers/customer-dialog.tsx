"use client";

import { useState } from "react";
import { addCustomer, updateCustomer } from "./actions";
import { Plus, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";

interface CustomerDialogProps {
    customer?: {
        id: string;
        name: string;
        phone: string;
        email: string;
        address: string;
    };
    mode?: "add" | "edit";
}

export function CustomerDialog({ customer, mode = "add" }: CustomerDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Form inputs
    const [name, setName] = useState(customer?.name || "");
    const [phone, setPhone] = useState(customer?.phone || "");
    const [email, setEmail] = useState(customer?.email || "");
    const [address, setAddress] = useState(customer?.address || "");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData();
        formData.append("name", name);
        formData.append("phone", phone);
        formData.append("email", email);
        formData.append("address", address);

        try {
            if (mode === "edit" && customer) {
                await updateCustomer(customer.id, name, phone, email, address);
                toast.success("Customer updated");
            } else {
                await addCustomer(formData);
                toast.success("Customer added");
                // Reset form
                setName("");
                setPhone("");
                setEmail("");
                setAddress("");
            }
            setIsOpen(false);
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setIsLoading(false);
        }
    }

    if (!isOpen) {
        if (mode === "edit") {
            return (
                <button
                    onClick={() => setIsOpen(true)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                    title="Edit Customer"
                >
                    <Pencil className="h-4 w-4" />
                </button>
            );
        }
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
            >
                <Plus className="mr-2 h-4 w-4" />
                Add Customer
            </button>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-6 animate-in zoom-in-95">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    {mode === "add" ? "Add New Customer" : "Edit Customer"}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <input
                            required
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            placeholder="Customer Name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Phone</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            placeholder="0812..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email (Optional)</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            placeholder="customer@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Address (Optional)</label>
                        <textarea
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            rows={3}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            placeholder="Customer Address"
                        />
                    </div>

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
                            {mode === "add" ? "Save Customer" : "Update Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
