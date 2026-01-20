"use client";

import { useRouter, usePathname } from "next/navigation";
import { ReportsView } from "./reports-view";
import { SalesReportItem, IncomingStockItem, MutationItem, DailySalesStat, TopProductStat } from "./actions";

interface ClientWrapperProps {
    sales: SalesReportItem[];
    incoming: IncomingStockItem[];
    mutations: MutationItem[];
    dailyStats: DailySalesStat[];
    topProducts: TopProductStat[];
    defaultStart: string;
    defaultEnd: string;
}

export default function ClientWrapper({ sales, incoming, mutations, dailyStats, topProducts, defaultStart, defaultEnd }: ClientWrapperProps) {
    const router = useRouter();
    const pathname = usePathname();

    const handleDateChange = (start: string, end: string) => {
        const params = new URLSearchParams();
        params.set("start", start);
        params.set("end", end);
        router.replace(`${pathname}?${params.toString()}`);
    };

    return (
        <ReportsView
            sales={sales}
            incoming={incoming}
            mutations={mutations}
            dailyStats={dailyStats}
            topProducts={topProducts}
            startDate={defaultStart}
            endDate={defaultEnd}
            onDateChange={handleDateChange}
        />
    );
}
