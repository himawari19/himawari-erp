import { Suspense } from "react";
import { ReportsView } from "./reports-view";
import { getSalesReport, getIncomingStockReport, getStockMutationsReport, getDailySalesStats, getTopProducts } from "./actions";
import { redirect } from "next/navigation";
import { format, startOfMonth, endOfMonth } from "date-fns";
import ClientWrapper from "./client-wrapper";

// Default to current month
const DEFAULT_START = format(startOfMonth(new Date()), "yyyy-MM-dd");
const DEFAULT_END = format(endOfMonth(new Date()), "yyyy-MM-dd");

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ start?: string, end?: string }> }) {
    const params = await searchParams;
    const startDate = params.start || DEFAULT_START;
    const endDate = params.end || DEFAULT_END;

    // Parallel data fetching
    const [sales, incoming, mutations, dailyStats, topProducts] = await Promise.all([
        getSalesReport(startDate, endDate),
        getIncomingStockReport(startDate, endDate),
        getStockMutationsReport(startDate, endDate),
        getDailySalesStats(startDate, endDate),
        getTopProducts(startDate, endDate)
    ]);

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <ClientWrapper
                sales={sales}
                incoming={incoming}
                mutations={mutations}
                dailyStats={dailyStats}
                topProducts={topProducts}
                defaultStart={startDate}
                defaultEnd={endDate}
            />
        </div>
    );
}
