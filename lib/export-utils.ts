import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

type PDFExportOptions = {
    title: string;
    subtitle?: string;
    filename: string;
    columns: string[];
    rows: any[][];
    startDate?: string;
    endDate?: string;
};

export const exportToExcel = (data: any[], fileName: string) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, `${fileName}.xlsx`);
};

export const exportToPDF = ({ title, subtitle, filename, columns, rows, startDate, endDate }: PDFExportOptions) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // 1. Header: Store Name
    doc.setFontSize(20);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text("HIMAWARI ERP", pageWidth / 2, 15, { align: "center" });

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text("Jl. Contoh Alamat Toko No. 123 | Telp: (021) 12345678", pageWidth / 2, 22, { align: "center" });

    // 2. Report Details
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.line(14, 28, pageWidth - 14, 28);

    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59);
    doc.text(title.toUpperCase(), 14, 40);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    if (startDate && endDate) {
        doc.text(`Periode: ${format(new Date(startDate), 'dd MMM yyyy')} - ${format(new Date(endDate), 'dd MMM yyyy')}`, 14, 47);
    }
    doc.text(`Dicetak pada: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, 14, 54);

    if (subtitle) {
        doc.setFontSize(11);
        doc.setTextColor(71, 85, 105);
        doc.text(subtitle, 14, 62);
    }

    // 3. Table
    autoTable(doc, {
        startY: subtitle ? 68 : 60,
        head: [columns],
        body: rows,
        theme: 'striped',
        headStyles: {
            fillColor: [79, 70, 229], // indigo-600
            textColor: 255,
            fontSize: 10,
            fontStyle: 'bold'
        },
        bodyStyles: {
            fontSize: 9,
            cellPadding: 3
        },
        alternateRowStyles: {
            fillColor: [248, 250, 252] // slate-50
        },
        margin: { top: 10 },
    });

    // 4. Footer: Page Numbers
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setTextColor(148, 163, 184); // slate-400
        doc.text(
            `Halaman ${i} dari ${pageCount}`,
            pageWidth / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: "center" }
        );
    }

    doc.save(`${filename}.pdf`);
};
