import { getCustomers } from "./actions";
import { CustomerDialog } from "./customer-dialog";
import { DeleteCustomerButton } from "./delete-customer-button";
import { getProfile } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
    const profile = await getProfile();
    if (profile?.role !== "superadmin") {
        redirect("/dashboard");
    }
    const customers = await getCustomers();

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Customers</h2>
                    <p className="text-sm text-muted-foreground">
                        Manage your customer database for CRM and loyalty.
                    </p>
                </div>
                <CustomerDialog />
            </div>

            <div className="rounded-md border bg-white">
                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm text-left">
                        <thead className="[&_tr]:border-b">
                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Name</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Phone</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Email</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Address</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {customers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-4 text-center text-gray-500">
                                        No customers found. Add your first customer!
                                    </td>
                                </tr>
                            ) : (
                                customers.map((customer) => (
                                    <tr key={customer.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                        <td className="p-4 align-middle font-medium">{customer.name}</td>
                                        <td className="p-4 align-middle">{customer.phone || "-"}</td>
                                        <td className="p-4 align-middle">{customer.email || "-"}</td>
                                        <td className="p-4 align-middle truncate max-w-[200px]">{customer.address || "-"}</td>
                                        <td className="p-4 align-middle text-right flex justify-end gap-2">
                                            <CustomerDialog mode="edit" customer={customer} />
                                            <DeleteCustomerButton id={customer.id} name={customer.name} />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
