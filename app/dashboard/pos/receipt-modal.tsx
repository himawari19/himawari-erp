"use client";

import { X, Printer, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

type ReceiptProps = {
    isOpen: boolean;
    onClose: () => void;
    data: {
        id?: string;
        items: any[];
        total: number;
        customerName?: string;
        date: Date;
    } | null;
};

export default function ReceiptModal({ isOpen, onClose, data }: ReceiptProps) {
    if (!isOpen || !data) return null;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:bg-transparent print:p-0">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden print:shadow-none print:max-w-none print:w-[80mm] print:rounded-none">
                {/* Header (Hidden on Print) */}
                <div className="p-4 border-b flex items-center justify-between print:hidden">
                    <div className="flex items-center gap-2 text-emerald-600 font-semibold">
                        <CheckCircle2 className="w-5 h-5" />
                        <span>Transaksi Berhasil</span>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Receipt Content */}
                <div id="receipt-content" className="p-6 font-mono text-sm print:p-4">
                    <div className="text-center space-y-1 mb-6">
                        <h2 className="text-xl font-bold uppercase tracking-wider text-slate-900">Himawari ERP</h2>
                        <p className="text-xs text-slate-500">Jl. Contoh Alamat Toko No. 123</p>
                        <p className="text-xs text-slate-500">Telp: (021) 12345678</p>
                    </div>

                    <div className="border-t border-dashed py-3 space-y-1 text-xs">
                        <div className="flex justify-between">
                            <span className="text-slate-500">Tgl:</span>
                            <span className="font-medium">{format(data.date, "dd/MM/yyyy HH:mm")}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Kasir:</span>
                            <span className="font-medium">Admin</span>
                        </div>
                        {data.customerName && (
                            <div className="flex justify-between">
                                <span className="text-slate-500">Pelanggan:</span>
                                <span className="font-medium">{data.customerName}</span>
                            </div>
                        )}
                    </div>

                    <div className="border-t border-dashed py-4 space-y-3">
                        {data.items.map((item, index) => (
                            <div key={index} className="space-y-1">
                                <div className="flex justify-between font-bold text-slate-900">
                                    <span>{item.name}</span>
                                </div>
                                <div className="flex justify-between text-xs text-slate-600">
                                    <span>{item.quantity} x {new Intl.NumberFormat('id-ID').format(item.sell_price)}</span>
                                    <span>{new Intl.NumberFormat('id-ID').format(item.quantity * item.sell_price)}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-dashed pt-4 pb-6 space-y-1">
                        <div className="flex justify-between text-lg font-bold text-slate-900">
                            <span>TOTAL</span>
                            <span>Rp {new Intl.NumberFormat('id-ID').format(data.total)}</span>
                        </div>
                    </div>

                    <div className="text-center pt-4 border-t border-dashed italic text-xs text-slate-400">
                        <p>Terima kasih atas kunjungan Anda</p>
                        <p>Barang yang sudah dibeli tidak dapat ditukar</p>
                    </div>
                </div>

                {/* Footer (Hidden on Print) */}
                <div className="p-4 bg-gray-50 flex gap-3 print:hidden">
                    <button
                        onClick={handlePrint}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-200"
                    >
                        <Printer className="w-5 h-5" />
                        Cetak Struk
                    </button>
                    <button
                        onClick={onClose}
                        className="px-6 py-3 border font-semibold text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                        Tutup
                    </button>
                </div>
            </div>

            {/* Print Global Styles */}
            <style jsx global>{`
                @media print {
                    @page {
                        margin: 0;
                        size: 80mm auto;
                    }
                    body * {
                        visibility: hidden;
                    }
                    #receipt-content, #receipt-content * {
                        visibility: visible;
                    }
                    #receipt-content {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                }
            `}</style>
        </div>
    );
}
