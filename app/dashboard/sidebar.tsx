"use client";

import Link from "next/link";
import { usePathname, useSearchParams, ReadonlyURLSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, ChevronRight, AlertCircle, Loader2 } from "lucide-react";
import { signOut } from "@/app/dashboard/actions";
import { cn } from "@/lib/utils";
import { NAVIGATION_LINKS } from "@/config/navigation";
import { UserRole, NavigationItem, SubItem } from "@/lib/types";

interface SidebarProps {
    role: UserRole;
}

export function Sidebar({ role }: SidebarProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [expandedLinks, setExpandedLinks] = useState<string[]>([]);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    // Improvement 2: Auto-expand active group
    useEffect(() => {
        if (!searchParams) return;

        const activeGroups = NAVIGATION_LINKS.filter(link =>
            link.subItems?.some(sub => {
                const url = new URL(sub.href, "http://localhost");
                const subPathname = url.pathname;
                const subTab = url.searchParams.get("tab");

                return pathname === subPathname && (!subTab || searchParams.get("tab") === subTab);
            })
        ).map(link => link.label);

        if (activeGroups.length > 0) {
            setExpandedLinks(prev => Array.from(new Set(prev.concat(activeGroups))));
        }
    }, [pathname, searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

    const toggleLink = (label: string) => {
        setExpandedLinks((prev) =>
            prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
        );
    };

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await signOut();
        } catch (error) {
            console.error("Logout failed", error);
            setIsLoggingOut(false);
            setShowLogoutModal(false);
        }
    };

    return (
        <>
            <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r bg-slate-900 text-white sm:flex transition-all duration-300">
                {/* Branding */}
                <div className="flex h-16 items-center px-6 border-b border-slate-800">
                    <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                        Management Stock & POS
                    </span>
                </div>

                {/* Navigation Links */}
                <nav className="flex flex-col gap-1.5 px-3 py-6 flex-1 overflow-y-auto">
                    {NAVIGATION_LINKS.map((link) => (
                        <SidebarLinkGroup
                            key={link.label}
                            link={link}
                            role={role}
                            pathname={pathname}
                            searchParams={searchParams}
                            isExpanded={expandedLinks.includes(link.label)}
                            onToggle={() => toggleLink(link.label)}
                        />
                    ))}
                </nav>

                {/* Account Section */}
                <div className="p-4 border-t border-slate-800">
                    <div className="mb-4 px-2">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3">My Account</p>
                        <div className="flex items-center gap-3 rounded-xl bg-slate-800/40 p-2.5 border border-slate-800/50">
                            <div className="h-9 w-9 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/20">
                                {role.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col overflow-hidden">
                                <span className="truncate text-sm font-semibold text-slate-200 capitalize">{role}</span>
                                <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                    Online
                                </span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowLogoutModal(true)}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 group"
                    >
                        <LogOut className="h-4.5 w-4.5 transition-transform group-hover:-translate-x-0.5" />
                        <span className="font-semibold text-sm">Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Improvement 7: Logout Modal */}
            {showLogoutModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 text-center">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 mb-4">
                                <AlertCircle className="h-7 w-7 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Confirm Sign Out</h3>
                            <p className="mt-2 text-sm text-gray-500 font-medium">
                                Are you sure you want to log out from the management system?
                            </p>
                        </div>
                        <div className="flex border-t bg-gray-50 p-4 gap-3">
                            <button
                                onClick={() => setShowLogoutModal(false)}
                                className="flex-1 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-100 transition-colors"
                                disabled={isLoggingOut}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleLogout}
                                className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-2"
                                disabled={isLoggingOut}
                            >
                                {isLoggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                {isLoggingOut ? "Signing out..." : "Sign Out"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

// Improvement 4: Component Decomposition
function SidebarLinkGroup({
    link,
    role,
    pathname,
    searchParams,
    isExpanded,
    onToggle
}: {
    link: NavigationItem;
    role: UserRole;
    pathname: string;
    searchParams: ReadonlyURLSearchParams | null;
    isExpanded: boolean;
    onToggle: () => void;
}) {
    if (!link.roles.includes(role)) return null;

    const hasSubItems = link.subItems && link.subItems.length > 0;
    const isActive = pathname === link.href || (link.subItems && pathname.startsWith(link.href));

    return (
        <div className="space-y-1">
            <Link
                href={hasSubItems ? "#" : link.href}
                onClick={(e) => {
                    if (hasSubItems) {
                        e.preventDefault();
                        onToggle();
                    }
                }}
                // Improvement 5: Accessibility
                aria-expanded={hasSubItems ? isExpanded : undefined}
                aria-controls={hasSubItems ? `submenu-${link.label}` : undefined}
                className={cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 cursor-pointer",
                    isActive && !hasSubItems
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                )}
            >
                <link.icon className={cn(
                    "h-5 w-5 transition-transform group-hover:scale-110",
                    isActive ? "text-white" : "text-slate-500 group-hover:text-indigo-400"
                )} />
                <span className="flex-1">{link.label}</span>
                {hasSubItems && (
                    <ChevronRight
                        className={cn(
                            "h-4 w-4 transition-transform duration-200 text-slate-600",
                            isExpanded ? "rotate-90 text-slate-400" : ""
                        )}
                    />
                )}
            </Link>

            {hasSubItems && isExpanded && (
                <div
                    id={`submenu-${link.label}`}
                    className="mt-1 ml-4 flex flex-col gap-1 border-l border-slate-800/80 pl-3 animate-in slide-in-from-left-2 fade-in duration-200"
                >
                    {link.subItems?.map((subItem) => (
                        <SidebarSubLink
                            key={subItem.href}
                            subItem={subItem}
                            role={role}
                            pathname={pathname}
                            searchParams={searchParams}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function SidebarSubLink({
    subItem,
    role,
    pathname,
    searchParams
}: {
    subItem: SubItem;
    role: UserRole;
    pathname: string;
    searchParams: ReadonlyURLSearchParams | null
}) {
    // Improvement 3: Type safety role filtering
    if (subItem.roles && !subItem.roles.includes(role)) return null;

    const url = new URL(subItem.href, "http://localhost");
    const subPathname = url.pathname;
    const subTab = url.searchParams.get("tab");

    // Improvement 6: Dynamic active logic
    const isSubActive = pathname === subPathname && (!subTab || searchParams?.get("tab") === subTab);

    return (
        <Link
            href={subItem.href}
            className={cn(
                "rounded-lg px-3 py-2 text-xs transition-all duration-200 font-semibold",
                isSubActive
                    ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/20"
                    : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/40"
            )}
        >
            {subItem.label}
        </Link>
    );
}
