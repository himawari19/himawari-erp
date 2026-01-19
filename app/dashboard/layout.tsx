import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Sidebar } from "./sidebar";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Fetch user role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    const role = profile?.role || 'kasir';

    return (
        <div className="flex min-h-screen w-full bg-slate-50/50">
            <Sidebar role={role} />
            <main className="flex flex-1 flex-col sm:pl-64 transition-all duration-300">
                <div className="p-4 sm:p-8 max-w-[1600px] mx-auto w-full">
                    {children}
                </div>
            </main>
        </div>
    );
}
