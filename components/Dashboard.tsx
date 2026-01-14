
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Order, Product, View, Store, Influencer, UserAccount } from '../types';
import ReportingModule from './ReportingModule';

interface DashboardProps {
  orders: Order[];
  products: Product[];
  stores: Store[];
  influencers: Influencer[];
  users: UserAccount[];
  setActiveView?: (view: View) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ orders, products, stores, influencers, users, setActiveView }) => {
  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const confirmedCount = orders.filter(o => o.status === 'confirmed').length;
  const cancelledCount = orders.filter(o => o.status === 'cancelled').length;

  // Modern Trade Specific Stats
  const mtConfirmedOrders = orders.filter(o => o.status === 'confirmed' && o.storeName);
  const mtTotalItems = mtConfirmedOrders.reduce((sum, o) => sum + o.items.reduce((acc, item) => acc + item.quantity, 0), 0);
  const mtTotalValue = mtConfirmedOrders.reduce((sum, o) => sum + o.totalValue, 0);

  const pieData = [
    { name: 'รอดำเนินการ', value: pendingCount, color: '#f59e0b' },
    { name: 'ยืนยันแล้ว', value: confirmedCount, color: '#10b981' },
    { name: 'ยกเลิกแล้ว', value: cancelledCount, color: '#ef4444' }
  ];

  const stockData = products.slice(0, 5).map(p => ({
    name: p.name,
    stock: p.stockPurchasing + p.stockContent + p.stockInfluencer
  }));

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 group hover:border-pink-200 transition-colors">
          <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Modern Trade Units</h3>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-black text-pink-500">{mtTotalItems.toLocaleString()}</span>
            <span className="text-slate-300 text-xs font-bold pb-1 uppercase">Sent</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 group hover:border-emerald-200 transition-colors">
          <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Modern Trade Value</h3>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-black text-emerald-600">฿{mtTotalValue.toLocaleString()}</span>
            <span className="text-slate-300 text-xs font-bold pb-1 uppercase">Total</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
          <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Pending Confirmation</h3>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-black text-amber-500">{pendingCount}</span>
            <span className="text-slate-300 text-xs font-bold pb-1 uppercase">Tickets</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
          <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Successful Fulfilled</h3>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-black text-blue-600">{confirmedCount}</span>
            <span className="text-slate-300 text-xs font-bold pb-1 uppercase">Total</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <h3 className="font-black text-slate-800 mb-6 uppercase tracking-tight text-sm">Order Fulfillment Status</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-8 mt-4">
            {pieData.map(d => (
              <div key={d.name} className="flex flex-col items-center">
                <div className="w-2 h-2 rounded-full mb-1" style={{ backgroundColor: d.color }}></div>
                <span className="text-[10px] font-black text-slate-400 uppercase">{d.name}</span>
                <span className="font-black text-slate-800">{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <h3 className="font-black text-slate-800 mb-6 uppercase tracking-tight text-sm">Inventory Levels (Key Products)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 'bold' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="stock" fill="#3b82f6" radius={[12, 12, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="pt-10">
        <ReportingModule 
          orders={orders} 
          products={products} 
          stores={stores} 
          influencers={influencers} 
          users={users} 
          title="Consolidated Reporting Section"
        />
      </div>
    </div>
  );
};

export default Dashboard;
