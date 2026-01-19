"use client";

import { ComponentProps } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

type SubmitButtonProps = ComponentProps<"button"> & {
    children: React.ReactNode;
};

export function SubmitButton({ children, className, ...props }: SubmitButtonProps) {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            disabled={pending}
            className={`${className} disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center`}
            {...props}
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
