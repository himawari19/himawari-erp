"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function getCustomers() {
    const supabase = await createClient();
    const { data, error } = await supabase.from("customers").select("*").order("name");

    if (error) throw new Error(error.message);
    return data;
}

export async function addCustomer(formData: FormData) {
    const supabase = await createClient();
    const name = formData.get("name") as string;
    const phone = formData.get("phone") as string;
    const email = formData.get("email") as string;
    const address = formData.get("address") as string;

    const { error } = await supabase.from("customers").insert({
        name,
        phone,
        email,
        address
    });

    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/master/customers");
    revalidatePath("/dashboard/pos"); // Refresh POS for customer dropdown
}

export async function updateCustomer(id: string, name: string, phone: string, email: string, address: string) {
    const supabase = await createClient();
    const { error } = await supabase.from("customers").update({
        name,
        phone,
        email,
        address
    }).eq("id", id);

    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/master/customers");
    revalidatePath("/dashboard/pos");
}

export async function deleteCustomer(id: string) {
    const supabase = await createClient();
    const { error } = await supabase.from("customers").delete().eq("id", id);

    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/master/customers");
    revalidatePath("/dashboard/pos");
}
