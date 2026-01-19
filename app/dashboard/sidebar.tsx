"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, ShoppingCart, Package, LogOut, ChevronRight } from "lucide-react";
import { signOut } from "@/app/dashboard/actions";
import { cn } from "@/lib/utils";

interface SidebarProps {
    role: string;
}

export function Sidebar({ role }: SidebarProps) {
    const pathname = usePathname();

    const links = [
    const [expandedLinks, setExpandedLinks] = useState<string[]>([]);
    const searchParams = useSearchParams();

    const toggleLink = (label: string) => {
        setExpandedLinks((prev) =>
            prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
        );
    };

    const links = [
        {
            href: "/dashboard",
            label: "Dashboard",
            icon: LayoutDashboard,
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
                { label: "Stock History", href: "/dashboard/inventory?tab=overview", tab: "overview" },
                { label: "Master Products", href: "/dashboard/inventory?tab=products", tab: "products", roles: ["superadmin"] },
                { label: "Incoming Stock", href: "/dashboard/inventory?tab=stock_in", tab: "stock_in" },
            ]
        }
    ];

    return (
        <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-slate-900 text-white sm:flex transition-all duration-300">
            <div className="flex h-16 items-center px-6 border-b border-slate-800">
                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                    Himawari ERP
                </span>
            </div>

            <nav className="flex flex-col gap-2 px-3 py-6 flex-1 overflow-y-auto">
                {links.map((link) => {
                    if (!link.roles.includes(role)) return null;

                    const isActive = pathname === link.href || (link.subItems && pathname.startsWith(link.href));
                    const isExpanded = expandedLinks.includes(link.label);
                    const hasSubItems = link.subItems && link.subItems.length > 0;

                    return (
                        <div key={link.label}>
                            <Link
                                href={hasSubItems ? "#" : link.href}
                                onClick={(e) => {
                                    if (hasSubItems) {
                                        e.preventDefault();
                                        toggleLink(link.label);
                                    }
                                }}
                                className={cn(
                                    "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer",
                                    isActive && !hasSubItems
                                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                                )}
                            >
                                <link.icon className={cn("h-5 w-5 transition-transform group-hover:scale-110", isActive ? "text-white" : "text-slate-500 group-hover:text-indigo-400")} />
                                <span className="flex-1">{link.label}</span>
                                {hasSubItems && (
                                    <ChevronRight
                                        className={cn(
                                            "h-4 w-4 transition-transform duration-200",
                                            isExpanded ? "rotate-90" : ""
                                        )}
                                    />
                                )}
                            </Link>

                            {/* Submenu */}
                            {hasSubItems && isExpanded && (
                                <div className="mt-1 ml-4 flex flex-col gap-1 border-l border-slate-800 pl-3 animate-in slide-in-from-left-2 fade-in duration-200">
                                    {link.subItems.map((subItem) => {
                                        if (subItem.roles && !subItem.roles.includes(role)) return null;

                                        const currentTab = searchParams.get("tab") || "overview";
                                        const isSubActive = pathname === link.href && currentTab === subItem.tab;

                                        return (
                                            <Link
                                                key={subItem.href}
                                                href={subItem.href}
                                                className={cn(
                                                    "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                                    isSubActive
                                                        ? "bg-indigo-500/10 text-indigo-400"
                                                        : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
                                                )}
                                            >
                                                {subItem.label}
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-800">
                <div className="mb-4 px-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">My Account</p>
                    <div className="flex items-center gap-3 rounded-md bg-slate-800/50 p-2">
                        <div className="h-8 w-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/30">
                            {role.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <span className="truncate text-sm font-medium text-slate-200 capitalize">{role}</span>
                            <span className="text-[10px] text-slate-500 truncate">Online</span>
                        </div>
                    </div>
                </div>

                <form action={signOut}>
                    <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-slate-400 hover:bg-red-950/30 hover:text-red-400 transition-colors">
                        <LogOut className="h-4 w-4" />
                        <span className="font-medium text-sm">Sign Out</span>
                    </button>
                </form>
            </div>
        </aside>
    );
}
