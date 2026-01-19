import { LayoutDashboard, ShoppingCart, Package, History } from "lucide-react";
import { NavigationItem } from "@/lib/types";

export const NAVIGATION_LINKS: NavigationItem[] = [
    {
        href: "/dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        roles: ["superadmin", "gudang", "kasir"],
    },
    {
        href: "/dashboard/transactions",
        label: "Transactions",
        icon: History,
        roles: ["superadmin", "gudang", "kasir"],
    },
    {
        href: "/dashboard/pos",
        label: "Point of Sale",
        icon: ShoppingCart,
        roles: ["superadmin", "kasir"],
    },
    {
        href: "/dashboard/inventory",
        label: "Inventory",
        icon: Package,
        roles: ["superadmin", "gudang"],
        subItems: [
            { label: "Stock Amount", href: "/dashboard/inventory?tab=total_stock", tab: "total_stock" },
            { label: "Stock History", href: "/dashboard/inventory?tab=overview", tab: "overview" },
            { label: "Master Products", href: "/dashboard/inventory?tab=products", tab: "products", roles: ["superadmin"] },
            { label: "Incoming Stock", href: "/dashboard/inventory?tab=stock_in", tab: "stock_in" },
        ]
    }
];
