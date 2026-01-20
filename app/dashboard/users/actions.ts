"use server";

import { createClient, createAdminClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export type UserProfile = {
    id: string;
    email: string;
    full_name: string;
    role: "superadmin" | "gudang" | "kasir";
    warehouse_id: string | null;
    warehouse_name?: string;
    created_at: string;
};

export async function getUsers() {
    const supabase = await createClient(); // Use regular client for reading

    // Fetch profiles with warehouse info
    const { data: profiles, error } = await supabase
        .from("profiles")
        .select(`
            *,
            warehouses (name)
        `)
        .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    return profiles.map((p: any) => ({
        id: p.id,
        email: p.email,
        full_name: p.full_name,
        role: p.role,
        warehouse_id: p.warehouse_id,
        warehouse_name: p.warehouses?.name,
        created_at: p.created_at,
    }));
}

export async function createUser(data: any) {
    const supabaseAdmin = await createAdminClient();

    // 1. Create Auth User
    const { data: userData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true, // Auto confirm
        user_metadata: {
            full_name: data.full_name
        }
    });

    if (authError) return { success: false, error: authError.message };
    if (!userData.user) return { success: false, error: "Failed to create user" };

    // 2. Update Profile (Role & Warehouse)
    // The trigger might have created a default profile, so we update it based on ID
    // Or if the trigger isn't robust enough for metadata, we upsert here.
    const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({
            role: data.role,
            warehouse_id: data.warehouse_id === "none" ? null : data.warehouse_id,
            full_name: data.full_name
        })
        .eq("id", userData.user.id);

    if (profileError) {
        // Rollback? Deleting user is tricky, but let's try
        await supabaseAdmin.auth.admin.deleteUser(userData.user.id);
        return { success: false, error: `Profile update failed: ${profileError.message}` };
    }

    revalidatePath("/dashboard/users");
    return { success: true };
}

export async function deleteUser(userId: string) {
    const supabaseAdmin = await createAdminClient();

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) return { success: false, error: error.message };

    revalidatePath("/dashboard/users");
    return { success: true };
}
