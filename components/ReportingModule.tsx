
import React, { useState, useMemo, useRef } from 'react';
import { Order, Product, Store, Influencer, OrderStatus, OrderSource, UserAccount } from '../types';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface ReportingModuleProps {
  orders: Order[];
  products: Product[];
  stores: Store[];
  influencers: Influencer[];
  users: UserAccount[];
  title?: string;
  isCompact?: boolean;
}

const ReportingModule: React.FC<ReportingModuleProps> = ({ 
  orders, 
  products, 
  stores, 
  influencers, 
  users,
  title = "Intelligence Reporting Hub",
  isCompact = false
}) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<OrderSource | 'all'>('all');
  const [productSearch, setProductSearch] = useState('');
  const [storeFilter, setStoreFilter] = useState('all');
  const [staffFilter, setStaffFilter] = useState('all');
  const [showManualCopy, setShowManualCopy] = useState(false);
  const [tsvData, setTsvData] = useState('');
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const orderDate = new Date(o.requestedAt).toISOString().split('T')[0];
      const matchStart = !startDate || orderDate >= startDate;
      const matchEnd = !endDate || orderDate <= endDate;
      const matchStatus = statusFilter === 'all' || o.status === statusFilter;
      const matchSource = sourceFilter === 'all' || o.source === sourceFilter;
      const matchProduct = !productSearch || o.items.some(i => i.productName.toLowerCase().includes(productSearch.toLowerCase()));
      const matchStore = storeFilter === 'all' || o.storeName === storeFilter || o.influencerName === storeFilter;
      const matchStaff = staffFilter === 'all' || o.purchasingDept === staffFilter;

      return matchStart && matchEnd && matchStatus && matchSource && matchProduct && matchStore && matchStaff;
    });
  }, [orders, startDate, endDate, statusFilter, sourceFilter, productSearch, storeFilter, staffFilter]);

  const prepareExportData = () => {
    const detailedData: any[] = [];
    filteredOrders.forEach(o => {
      o.items.forEach(item => {
        detailedData.push({
          'Transaction ID': o.id,
          'PO Number': o.poNumber,
          'Date': new Date(o.requestedAt).toLocaleString('th-TH'),
          'Source': o.source.toUpperCase(),
          'Store/Influencer': o.storeName || o.influencerName || '-',
          'Branch': o.subBranch || '-',
          'Product Name': item.productName,
          'SKU': item.sku,
          'Qty': item.quantity,
          'Unit Price': item.unitPrice,
          'Subtotal': item.quantity * item.unitPrice,
          'Status': o.status,
          'Recorded By': o.purchasingDept
        });
      });
    });
    return detailedData;
  };

  const exportCSV = () => {
    const data = prepareExportData();
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvContent = "\uFEFF" + [
      headers.join(","),
      ...data.map(row => headers.map(h => `"${String(row[h as keyof typeof row]).replace(/"/g, '""')}"`).join(","))
    ].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `LAGLACE_Detailed_Report_${new Date().getTime()}.csv`;
    link.click();
  };

  const exportXLSX = () => {
    const data = prepareExportData();
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Detailed_Report");
    XLSX.writeFile(workbook, `LAGLACE_Detailed_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4') as any;
    const data = prepareExportData();
    if (data.length === 0) return;
    const body = data.map(item => Object.values(item));
    const head = [Object.keys(data[0])];
    doc.text(title, 14, 15);
    doc.autoTable({
      head: head,
      body: body,
      startY: 20,
      theme: 'grid',
      styles: { fontSize: 7 },
      headStyles: { fillColor: [15, 23, 42] }
    });
    doc.save(`LAGLACE_Report_${new Date().getTime()}.pdf`);
  };

  const copyForGoogleSheets = async () => {
    const data = prepareExportData();
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    const tsvContent = [
      headers.join("\t"),
      ...data.map(row => headers.map(h => String(row[h as keyof typeof row])).join("\t"))
    ].join("\n");
    
    setTsvData(tsvContent);
    
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(tsvContent);
        alert("✅ Data copied to clipboard! You can now Ctrl+V in Google Sheets.");
      } else {
        setShowManualCopy(true);
      }
    } catch (err) {
      console.error("Failed to copy:", err);
      setShowManualCopy(true);
    }
  };

  return (
    <div className={`bg-white rounded-[2.5rem] border shadow-sm overflow-hidden border-t-8 border-t-slate-900`}>
      <div className="p-8 border-b flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800">{title}</h2>
          <p className="text-xs text-slate-400">Detailed line-item reporting for granular analysis.</p>
        </div>
        <div className="flex items-center gap-2">
           <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-3 py-1 rounded-full uppercase tracking-widest">{filteredOrders.length} transactions matched</span>
        </div>
      </div>

      <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="space-y-2">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Date Range</label>
          <div className="flex gap-2">
            <input type="date" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <input type="date" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Entity</label>
          <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none" value={storeFilter} onChange={e => setStoreFilter(e.target.value)}>
            <option value="all">All Targets</option>
            {stores.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Staff / Status</label>
          <div className="flex gap-2">
            <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none" value={staffFilter} onChange={e => setStaffFilter(e.target.value)}>
              <option value="all">Any Staff</option>
              {users.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
            </select>
            <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none" value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}>
              <option value="all">Any Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Line Item Search</label>
          <input type="text" placeholder="Search item name..." className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none" value={productSearch} onChange={e => setProductSearch(e.target.value)} />
        </div>
      </div>

      <div className="px-8 pb-8 flex flex-wrap gap-4">
        <button onClick={exportPDF} className="flex-1 min-w-[140px] py-4 bg-red-500 text-white rounded-3xl font-black text-xs shadow-lg shadow-red-100 flex items-center justify-center gap-2 hover:translate-y-[-2px] transition-all">
          <span>📕 Export PDF</span>
        </button>
        <button onClick={exportXLSX} className="flex-1 min-w-[140px] py-4 bg-emerald-600 text-white rounded-3xl font-black text-xs shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 hover:translate-y-[-2px] transition-all">
          <span>📗 Export XLSX</span>
        </button>
        <button onClick={copyForGoogleSheets} className="flex-1 min-w-[140px] py-4 bg-blue-600 text-white rounded-3xl font-black text-xs shadow-lg shadow-blue-100 flex items-center justify-center gap-2 hover:translate-y-[-2px] transition-all">
          <span>🌐 Google Sheets Sync</span>
        </button>
      </div>

      {showManualCopy && (
        <div className="px-8 pb-8 animate-in fade-in duration-300">
           <div className="bg-amber-50 border-2 border-amber-200 rounded-[2rem] p-6 space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Manual Copy Required</p>
                <button onClick={() => setShowManualCopy(false)} className="text-amber-400 hover:text-amber-600 font-bold">Close ✕</button>
              </div>
              <p className="text-[11px] text-amber-600">Your browser blocked automatic copy. Please select all text in the box below and press <strong>Ctrl+C</strong>.</p>
              <textarea 
                ref={textAreaRef}
                readOnly
                value={tsvData}
                className="w-full h-32 bg-white border border-amber-100 rounded-xl p-4 text-[10px] font-mono outline-none focus:ring-2 focus:ring-amber-300"
                onClick={(e) => (e.target as HTMLTextAreaElement).select()}
              />
           </div>
        </div>
      )}
    </div>
  );
};

export default ReportingModule;
