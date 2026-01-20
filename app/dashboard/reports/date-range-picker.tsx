"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

interface DateRangePickerProps {
    startDate: string;
    endDate: string;
    onRangeChange: (start: string, end: string) => void;
}

export function DateRangePicker({ startDate, endDate, onRangeChange }: DateRangePickerProps) {
    return (
        <div className="flex items-center gap-2 bg-white p-2 rounded-lg border shadow-sm">
            <CalendarIcon className="h-4 w-4 text-gray-400" />
            <div className="flex items-center gap-2">
                <input
                    type="date"
                    value={startDate}
                    onChange={(e) => onRangeChange(e.target.value, endDate)}
                    className="text-sm border-none bg-transparent focus:ring-0 p-0 text-gray-600 font-medium"
                />
                <span className="text-gray-300">-</span>
                <input
                    type="date"
                    value={endDate}
                    onChange={(e) => onRangeChange(startDate, e.target.value)}
                    className="text-sm border-none bg-transparent focus:ring-0 p-0 text-gray-600 font-medium"
                />
            </div>
        </div>
    );
}
