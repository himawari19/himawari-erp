import { getStockMovements } from "../actions";
import HistoryView from "./history-view";
import { Package } from "lucide-react";

export default async function StockHistoryPage() {
    const history = await getStockMovements();

    return (
        <div className="flex flex-col gap-8 p-8">
            <div className="flex items-center justify-between group">
                <div className="flex items-center gap-4">
                    <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-200 group-hover:scale-110 transition-transform duration-300">
                        <Package className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Riwayat Stok</h1>
                        <p className="text-slate-500 font-medium">Lacak setiap mutasi barang secara transparan</p>
                    </div>
                </div>
            </div>

            <HistoryView initialData={history || []} />
        </div>
    );
}
