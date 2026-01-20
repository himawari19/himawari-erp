"use client";

import { useState, useRef, useEffect } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/utils/cn"; // Assuming you have a cn utility, if not I'll implement basic class merging

interface SearchableDropdownProps {
    items: { id: string; name: string }[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export function SearchableDropdown({ items, value, onChange, placeholder = "Select..." }: SearchableDropdownProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);

    const filteredItems = items.filter((item) =>
        item.name.toLowerCase().includes(search.toLowerCase())
    );

    const selectedItem = items.find((item) => item.id === value);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={containerRef}>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
                <span className={!selectedItem ? "text-gray-500" : "text-gray-900"}>
                    {selectedItem ? selectedItem.name : placeholder}
                </span>
                <ChevronsUpDown className="h-4 w-4 text-gray-400 opacity-50" />
            </button>

            {open && (
                <div className="absolute z-50 mt-1 w-full rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-2 border-b">
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-gray-400" />
                            <input
                                autoFocus
                                type="text"
                                placeholder="Search..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full rounded-md border border-gray-200 pl-8 pr-2 py-1.5 text-sm focus:outline-none focus:border-indigo-500"
                            />
                        </div>
                    </div>
                    <ul className="max-h-60 overflow-auto py-1 text-base sm:text-sm">
                        {filteredItems.length === 0 ? (
                            <li className="relative cursor-default select-none px-4 py-2 text-gray-500 text-center text-xs">
                                No results found.
                            </li>
                        ) : (
                            filteredItems.map((item) => (
                                <li
                                    key={item.id}
                                    onClick={() => {
                                        onChange(item.id);
                                        setOpen(false);
                                        setSearch("");
                                    }}
                                    className={cn(
                                        "relative cursor-pointer select-none py-2 pl-3 pr-9 hover:bg-indigo-50 hover:text-indigo-900 transition-colors",
                                        value === item.id ? "bg-indigo-50 text-indigo-900 font-medium" : "text-gray-900"
                                    )}
                                >
                                    <span className="block truncate">{item.name}</span>
                                    {value === item.id && (
                                        <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-indigo-600">
                                            <Check className="h-4 w-4" />
                                        </span>
                                    )}
                                </li>
                            ))
                        )}
                        {/* Option to clear selection */}
                        {value && (
                            <li
                                onClick={() => {
                                    onChange("");
                                    setOpen(false);
                                }}
                                className="relative cursor-pointer select-none py-2 pl-3 pr-9 text-red-600 hover:bg-red-50 border-t mt-1"
                            >
                                <span className="block truncate text-xs font-semibold">Clear Selection</span>
                            </li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}

// Minimal cn utility if not exists
// import { clsx, type ClassValue } from "clsx";
// import { twMerge } from "tailwind-merge";
// export function cn(...inputs: ClassValue[]) {
//   return twMerge(clsx(inputs));
// } 
