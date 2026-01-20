"use client";

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Cell } from "recharts";
import { DailySalesStat, TopProductStat } from "./actions";

interface ChartsViewProps {
    dailyStats: DailySalesStat[];
    topProducts: TopProductStat[];
}

export function ChartsView({ dailyStats, topProducts }: ChartsViewProps) {
    if (dailyStats.length === 0 && topProducts.length === 0) {
        return null;
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Sales Trend Chart */}
            <div className="p-6 bg-white rounded-xl border shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Trend</h3>
                <div className="h-[300px] w-full">
                    {dailyStats.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={dailyStats}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 12, fill: "#6b7280" }}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(val) => {
                                        const d = new Date(val);
                                        return `${d.getDate()}/${d.getMonth() + 1}`;
                                    }}
                                />
                                <YAxis
                                    tick={{ fontSize: 12, fill: "#6b7280" }}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `Rp ${(value / 1000).toFixed(0)}k`}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                                    formatter={(value: any) => [`Rp ${Number(value).toLocaleString("id-ID")}`, "Revenue"]}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="total_sales"
                                    stroke="#6366f1"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorSales)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-400 text-sm">No trend data available</div>
                    )}
                </div>
            </div>

            {/* Top Products Chart */}
            <div className="p-6 bg-white rounded-xl border shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 5 Products</h3>
                <div className="h-[300px] w-full">
                    {topProducts.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topProducts} layout="vertical" margin={{ left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    width={100}
                                    tick={{ fontSize: 11, fill: "#374151" }}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip
                                    cursor={{ fill: "transparent" }}
                                    contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                                    formatter={(value: any, name: any) => [
                                        name === "revenue" ? `Rp ${Number(value).toLocaleString("id-ID")}` : value,
                                        name === "revenue" ? "Revenue" : "Qty Sold"
                                    ]}
                                />
                                <Bar dataKey="quantity" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20}>
                                    {topProducts.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === 0 ? "#059669" : "#10b981"} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-400 text-sm">No product data available</div>
                    )}
                </div>
            </div>
        </div>
    );
}
