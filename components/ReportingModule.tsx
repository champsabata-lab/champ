
import React, { useState, useMemo } from 'react';
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

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const orderDate = new Date(o.requestedAt).toISOString().split('T')[0];
      const matchStart = !startDate || orderDate >= startDate;
      const matchEnd = !endDate || orderDate <= endDate;
      const matchStatus = statusFilter === 'all' || o.status === statusFilter;
      const matchSource = sourceFilter === 'all' || o.source === sourceFilter;
      const matchProduct = !productSearch || o.productName.toLowerCase().includes(productSearch.toLowerCase());
      const matchStore = storeFilter === 'all' || o.storeName === storeFilter || o.influencerName === storeFilter;
      const matchStaff = staffFilter === 'all' || o.purchasingDept === staffFilter;

      return matchStart && matchEnd && matchStatus && matchSource && matchProduct && matchStore && matchStaff;
    });
  }, [orders, startDate, endDate, statusFilter, sourceFilter, productSearch, storeFilter, staffFilter]);

  const prepareExportData = () => {
    return filteredOrders.map(o => ({
      'ID': o.id,
      'Date': new Date(o.requestedAt).toLocaleString('th-TH'),
      'Source': o.source.toUpperCase(),
      'Store/Influencer': o.storeName || o.influencerName || '-',
      'Branch': o.subBranch || '-',
      'Product': o.productName,
      'Qty Req': o.requestedQuantity,
      'Qty Final': o.quantity,
      'Status': o.status,
      'Recorded By': o.purchasingDept
    }));
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
    link.download = `LAGLACE_Report_${new Date().getTime()}.csv`;
    link.click();
  };

  const exportXLSX = () => {
    const data = prepareExportData();
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "LAGLACE_Report");
    XLSX.writeFile(workbook, `LAGLACE_Stock_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
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
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] }
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
    try {
      await navigator.clipboard.writeText(tsvContent);
      alert("✅ Data copied! Now go to Google Sheets and press Ctrl+V to paste perfectly.");
    } catch (err) {
      alert("❌ Failed to copy data.");
    }
  };

  return (
    <div className={`bg-white rounded-[2.5rem] border shadow-sm overflow-hidden border-t-8 border-t-slate-900`}>
      <div className="p-8 border-b flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800">{title}</h2>
          <p className="text-xs text-slate-400">Precision data extraction and multi-format exports.</p>
        </div>
        <div className="flex items-center gap-2">
           <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-3 py-1 rounded-full uppercase tracking-widest">{filteredOrders.length} records matched</span>
        </div>
      </div>

      <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="space-y-2">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Date Range</label>
          <div className="flex gap-2">
            <input type="date" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none" value={startDate} onChange={e => setStartDate(e.target.value)} />
            <input type="date" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Entity</label>
          <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none" value={storeFilter} onChange={e => setStoreFilter(e.target.value)}>
            <option value="all">All Stores/Infs</option>
            <optgroup label="Modern Trade">
              {stores.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </optgroup>
            <optgroup label="Influencers">
              {influencers.map(inf => <option key={inf.id} value={inf.name}>{inf.name}</option>)}
            </optgroup>
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Staff / Source</label>
          <div className="flex gap-2">
            <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none" value={staffFilter} onChange={e => setStaffFilter(e.target.value)}>
              <option value="all">Any Staff</option>
              {users.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
            </select>
            <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none" value={sourceFilter} onChange={e => setSourceFilter(e.target.value as any)}>
              <option value="all">Any Dept</option>
              <option value="purchasing">Purchasing</option>
              <option value="influencer">Influencer</option>
              <option value="live">Live</option>
              <option value="affiliate">Affiliate</option>
              <option value="buffer">Warehouse Buffer</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Status & Search</label>
          <div className="flex gap-2">
            <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none" value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}>
              <option value="all">Any Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <input type="text" placeholder="Search product..." className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none" value={productSearch} onChange={e => setProductSearch(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="px-8 pb-8 flex flex-wrap gap-4">
        <button onClick={exportPDF} className="flex-1 min-w-[140px] py-4 bg-red-500 text-white rounded-3xl font-black text-xs shadow-lg shadow-red-100 flex items-center justify-center gap-2 hover:translate-y-[-2px] transition-all">
          <span>📕 PDF</span>
        </button>
        <button onClick={exportXLSX} className="flex-1 min-w-[140px] py-4 bg-emerald-600 text-white rounded-3xl font-black text-xs shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 hover:translate-y-[-2px] transition-all">
          <span>📗 XLSX</span>
        </button>
        <button onClick={exportCSV} className="flex-1 min-w-[140px] py-4 bg-slate-700 text-white rounded-3xl font-black text-xs shadow-lg shadow-slate-100 flex items-center justify-center gap-2 hover:translate-y-[-2px] transition-all">
          <span>📄 CSV</span>
        </button>
        <button onClick={copyForGoogleSheets} className="flex-1 min-w-[140px] py-4 bg-blue-600 text-white rounded-3xl font-black text-xs shadow-lg shadow-blue-100 flex items-center justify-center gap-2 hover:translate-y-[-2px] transition-all">
          <span>🌐 Google Sheets Sync</span>
        </button>
      </div>
    </div>
  );
};

export default ReportingModule;