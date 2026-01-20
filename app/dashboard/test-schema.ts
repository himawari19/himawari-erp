import { createClient } from "@/utils/supabase/server";

export async function checkSchema() {
    const supabase = await createClient();

    // Check customers table
    const { data: customers, error: cError } = await supabase.from("customers").select("count").limit(1);
    console.log("Customers check:", { count: customers, error: cError });

    // Check transactions columns
    const { data: tx, error: tError } = await supabase.from("transactions").select("customer_id").limit(1);
    console.log("Transactions customer_id check:", { error: tError });
}
