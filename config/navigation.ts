import { LayoutDashboard, ShoppingCart, Package, History, ArrowLeftRight, ClipboardCheck, Tags, Truck, Boxes, FileText, Users } from "lucide-react";
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
            { label: "Incoming Stock", href: "/dashboard/inventory?tab=stock_in", tab: "stock_in" },
            { label: "Stock Transfer", href: "/dashboard/inventory?tab=transfer", tab: "transfer" },
        ]
    },
    {
        href: "/dashboard/inventory?tab=opname",
        label: "Stock Opname",
        icon: ClipboardCheck,
        roles: ["superadmin", "gudang"],
    },
    {
        href: "/dashboard/master",
        label: "Master Data",
        icon: Boxes,
        roles: ["superadmin"],
        subItems: [
            { label: "Products", href: "/dashboard/inventory?tab=products", tab: "products" },
            { label: "Categories", href: "/dashboard/inventory?tab=categories", tab: "categories" },
            { label: "Suppliers", href: "/dashboard/inventory?tab=suppliers", tab: "suppliers" },
            { label: "Customers", href: "/dashboard/master/customers", tab: "customers" },
        ]
    },
    {
        href: "/dashboard/reports",
        label: "Reports",
        icon: FileText,
        roles: ["superadmin", "gudang"],
    },
    {
        href: "/dashboard/users",
        label: "Users",
        icon: Users,
        roles: ["superadmin"],
    }
];
