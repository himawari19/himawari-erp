import { getUsers } from "./actions";
import { CreateUserDialog } from "./create-user-dialog";
import { DeleteUserButton } from "./delete-user-button";
import { getProfile } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { UserProfile } from "./actions";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
    const profile = await getProfile();
    if (profile?.role !== "superadmin") {
        redirect("/dashboard");
    }

    const users = await getUsers();

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
                    <p className="text-sm text-muted-foreground">
                        Manage employees, roles, and warehouse assignments.
                    </p>
                </div>
                <CreateUserDialog />
            </div>

            <div className="rounded-md border bg-white">
                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm text-left">
                        <thead className="[&_tr]:border-b">
                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Full Name</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Email</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Role</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Warehouse</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Joined</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {users.map((user: UserProfile) => (
                                <tr key={user.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    <td className="p-4 align-middle font-medium">{user.full_name || "-"}</td>
                                    <td className="p-4 align-middle">{user.email}</td>
                                    <td className="p-4 align-middle">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                            ${user.role === 'superadmin' ? 'bg-purple-100 text-purple-800' :
                                                user.role === 'gudang' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-green-100 text-green-800'}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="p-4 align-middle">
                                        {user.role === 'superadmin' ? (
                                            <span className="text-gray-400 italic">All Access</span>
                                        ) : (
                                            user.warehouse_name || <span className="text-red-500 text-xs">Unassigned</span>
                                        )}
                                    </td>
                                    <td className="p-4 align-middle text-gray-500">
                                        {new Date(user.created_at).toLocaleDateString("id-ID", {
                                            day: 'numeric', month: 'short', year: 'numeric'
                                        })}
                                    </td>
                                    <td className="p-4 align-middle text-right">
                                        {user.role !== 'superadmin' && ( // Prevent deleting other superadmins or self easily
                                            <DeleteUserButton userId={user.id} userName={user.full_name} />
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
