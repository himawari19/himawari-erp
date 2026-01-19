import { createClient } from "@/utils/supabase/server";

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: profile } = await supabase
        .from('profiles')
        .select('*, warehouse:warehouses(name)')
        .eq('id', user?.id)
        .single();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                    <div className="flex flex-col space-y-1.5 ">
                        <h3 className="font-semibold leading-none tracking-tight">Role</h3>
                    </div>
                    <div className="p-0 pt-4">
                        <div className="text-2xl font-bold capitalize">{profile?.role}</div>
                        <p className="text-xs text-muted-foreground">Your account permission level</p>
                    </div>
                </div>

                <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                    <div className="flex flex-col space-y-1.5 ">
                        <h3 className="font-semibold leading-none tracking-tight">Warehouse</h3>
                    </div>
                    <div className="p-0 pt-4">
                        <div className="text-2xl font-bold">{profile?.warehouse?.name || 'All Warehouses'}</div>
                        <p className="text-xs text-muted-foreground">Assigned location</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
