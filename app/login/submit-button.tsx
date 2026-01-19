"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

export function SubmitButton({
    children,
    className
}: {
    children: React.ReactNode,
    className?: string
}) {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            disabled={pending}
            className={`${className} disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center`}
        >
            {pending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Please wait
                </>
            ) : (
                children
            )}
        </button>
    );
}
