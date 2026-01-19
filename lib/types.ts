import { LucideIcon } from "lucide-react";

export type UserRole = "superadmin" | "gudang" | "kasir";

export interface SubItem {
    label: string;
    href: string;
    tab?: string;
    roles?: UserRole[];
}

export interface NavigationItem {
    href: string;
    label: string;
    icon: LucideIcon;
    roles: UserRole[];
    subItems?: SubItem[];
}
