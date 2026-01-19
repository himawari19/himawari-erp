import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { LogOut, LayoutDashboard, ShoppingCart, Package } from 'lucide-react';
import { signOut } from "@/app/dashboard/actions";

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
        <div className="flex min-h-screen w-full bg-muted/40">
            <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-background sm:flex">
                <nav className="flex flex-col gap-4 px-2 sm:py-5">
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-primary-foreground"
                    >
                        <LayoutDashboard className="h-5 w-5" />
                        <span className="font-medium">Dashboard</span>
                    </Link>

                    {(role === 'superadmin' || role === 'kasir') && (
                        <Link
                            href="/dashboard/pos"
                            className="flex items-center gap-2 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        >
                            <ShoppingCart className="h-5 w-5" />
                            <span className="font-medium">Point of Sale</span>
                        </Link>
                    )}

                    {(role === 'superadmin' || role === 'gudang') && (
                        <Link
                            href="/dashboard/inventory"
                            className="flex items-center gap-2 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        >
                            <Package className="h-5 w-5" />
                            <span className="font-medium">Inventory</span>
                        </Link>
                    )}
                </nav>
                <div className="mt-auto p-4">
                    <form action={signOut}>
                        <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                            <LogOut className="h-5 w-5" />
                            <span className="font-medium">Sign Out</span>
                        </button>
                    </form>
                </div>
            </aside>
            <main className="flex flex-1 flex-col sm:pl-64">
                <div className="p-4 sm:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
