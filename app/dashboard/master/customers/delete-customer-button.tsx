"use client";

import { useState } from "react";
import { deleteCustomer } from "./actions";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function DeleteCustomerButton({ id, name }: { id: string, name: string }) {
    const [isDeleting, setIsDeleting] = useState(false);

    async function handleDelete() {
        if (!confirm(`Are you sure you want to delete customer ${name}?`)) return;

        setIsDeleting(true);
        try {
            await deleteCustomer(id);
            toast.success("Customer deleted");
        } catch (error) {
            toast.error("Failed to delete customer");
        } finally {
            setIsDeleting(false);
        }
    }

    return (
        <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-2 text-red-600 hover:bg-red-50 rounded-full disabled:opacity-50"
            title="Delete Customer"
        >
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </button>
    );
}
