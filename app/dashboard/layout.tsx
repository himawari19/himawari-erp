import { createClient } from "@/utils/supabase/server";
import { Sidebar } from "./sidebar";
import { getProfile } from "@/utils/supabase/server";
import { Toaster } from "sonner"; // Using sonner for toasts

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const profile = await getProfile();

    return (
        <div className="flex min-h-screen w-full bg-slate-50/50">
            <Sidebar role={profile?.role || "kasir"} />
            <main className="flex flex-1 flex-col sm:pl-64 transition-all duration-300">
                <div className="p-4 sm:p-8 max-w-[1600px] mx-auto w-full">
                    {children}
                </div>
            </main>
            <Toaster position="top-right" richColors />
        </div>
    );
}
