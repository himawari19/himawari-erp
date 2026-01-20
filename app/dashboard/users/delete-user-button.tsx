"use client";

import { useState } from "react";
import { deleteUser } from "./actions";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function DeleteUserButton({ userId, userName }: { userId: string, userName: string }) {
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    async function handleDelete() {
        if (!confirm(`Are you sure you want to delete user ${userName}? This action cannot be undone.`)) return;

        setIsDeleting(true);
        try {
            const result = await deleteUser(userId);
            if (result.success) {
                toast.success("User deleted successfully");
                router.refresh();
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("Failed to delete user");
        } finally {
            setIsDeleting(false);
        }
    }

    return (
        <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-2 text-red-600 hover:bg-red-50 rounded-full disabled:opacity-50"
            title="Delete User"
        >
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </button>
    );
}
