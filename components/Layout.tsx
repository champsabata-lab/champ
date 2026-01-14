
import React, { useState } from 'react';
import { View, UserAccount, Order } from '../types';
import { USER_ROLES } from '../constants';

interface LayoutProps {
  children: React.ReactNode;
  activeView: View;
  setActiveView: (view: View, topicId?: number) => void;
  currentUser: UserAccount;
  onLogout: () => void;
  orders: Order[];
}

const Layout: React.FC<LayoutProps> = ({ children, activeView, setActiveView, currentUser, onLogout, orders }) => {
  const [isNewsExpanded, setIsNewsExpanded] = useState(false);
  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;

  const isViewAllowed = (view: View) => currentUser?.allowedViews?.includes(view) || false;

  const getSourceIcon = (view: View) => {
    switch (view) {
      case View.PURCHASING: return '🛍️';
      case View.INFLUENCER_DEP: return '🤳';
      case View.LIVE_DEP: return '🔴';
      case View.AFFILIATE_DEP: return '🔗';
      case View.BUFFER_DEP: return '🛡️';
      default: return '📁';
    }
  };

  const getDisplayName = (view: View) => {
    switch (view) {
      case View.BUFFER_DEP: return 'Buffer Stock Warehouse';
      case View.PURCHASING: return 'Purchasing';
      case View.INFLUENCER_DEP: return 'Influencer';
      case View.LIVE_DEP: return 'Live';
      case View.AFFILIATE_DEP: return 'Affiliate';
      case View.DASHBOARD: return 'Dashboard';
      case View.INVENTORY: return 'Inventory';
      case View.AI_CHAT: return 'Talks with AI';
      case View.EXPORT: return 'Reports';
      case View.SETTINGS: return 'Settings';
      case View.WAREHOUSE: return 'Warehouse Dept';
      case View.SHIPMENTS: return 'Shipment Tracking';
      case View.NEWS_ANNOUNCEMENT: return 'News & Announcement';
      default: return view;
    }
  };

  const newsSubTopics = [
    { id: 1, name: 'ข้อควรระวัง MFG/EXP' },
    { id: 2, name: 'กฎการส่งหน้าร้านต่างๆ' },
    { id: 3, name: 'สาขาเปิดเพิ่มในอนาคต' },
    { id: 4, name: 'เส้นทางต่างๆของการส่ง' }
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 text-slate-900">
      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 z-40">
        <div className="p-6">
          <h1 className="text-xl font-black text-pink-500 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
              <path d="m3.3 7 8.7 5 8.7-5"/>
              <path d="M12 22V12"/>
            </svg>
            LAGLACE
          </h1>
          <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-bold">Stock Manager</p>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto pb-6">
          {isViewAllowed(View.DASHBOARD) && (
            <button 
              onClick={() => setActiveView(View.DASHBOARD)}
              className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all ${activeView === View.DASHBOARD ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              📊 Dashboard
            </button>
          )}

          {/* News & Announcement with Sub-items */}
          {isViewAllowed(View.NEWS_ANNOUNCEMENT) && (
            <div className="space-y-1">
              <button 
                onClick={() => setIsNewsExpanded(!isNewsExpanded)}
                className={`w-full text-left px-4 py-3 rounded-xl flex items-center justify-between transition-all ${activeView === View.NEWS_ANNOUNCEMENT ? 'bg-pink-50 text-pink-600 font-black' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <div className="flex items-center gap-3">
                  <span>📢 News & Announcement</span>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform duration-300 ${isNewsExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {isNewsExpanded && (
                <div className="pl-6 space-y-1 animate-in slide-in-from-top-2 duration-300">
                  {newsSubTopics.map((topic) => (
                    <button
                      key={topic.id}
                      onClick={() => setActiveView(View.NEWS_ANNOUNCEMENT, topic.id)}
                      className={`w-full text-left px-4 py-2 rounded-lg text-[11px] font-bold transition-all border-l-2 hover:bg-pink-50/50 ${activeView === View.NEWS_ANNOUNCEMENT ? 'border-pink-300 text-pink-500' : 'border-slate-100 text-slate-400 hover:border-pink-200'}`}
                    >
                      {topic.id}. {topic.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {isViewAllowed(View.INVENTORY) && (
            <button 
              onClick={() => setActiveView(View.INVENTORY)}
              className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all ${activeView === View.INVENTORY ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              📦 Inventory
            </button>
          )}

          {isViewAllowed(View.SHIPMENTS) && (
            <button 
              onClick={() => setActiveView(View.SHIPMENTS)}
              className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all ${activeView === View.SHIPMENTS ? 'bg-pink-600 text-white shadow-lg shadow-pink-100 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              🚚 Shipment Tracker
            </button>
          )}
          
          <div className="pt-4 pb-2 text-[10px] font-bold text-slate-400 px-4 uppercase tracking-widest">
            Services
          </div>
          {isViewAllowed(View.AI_CHAT) && (
            <button 
              onClick={() => setActiveView(View.AI_CHAT)}
              className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all ${activeView === View.AI_CHAT ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              💬 Talks with AI
            </button>
          )}

          {isViewAllowed(View.EXPORT) && (
            <button 
              onClick={() => setActiveView(View.EXPORT)}
              className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all ${activeView === View.EXPORT ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              📈 Reports & Export
            </button>
          )}
          
          <div className="pt-4 pb-2 text-[10px] font-bold text-slate-400 px-4 uppercase tracking-widest">
            Operations
          </div>
          
          {[View.PURCHASING, View.INFLUENCER_DEP, View.LIVE_DEP, View.AFFILIATE_DEP, View.BUFFER_DEP].map(v => (
            isViewAllowed(v) && (
              <button 
                key={v}
                onClick={() => setActiveView(v)}
                className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all ${activeView === v ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <span>{getSourceIcon(v)} {getDisplayName(v)}</span>
              </button>
            )
          ))}

          {isViewAllowed(View.WAREHOUSE) && (
            <button 
              onClick={() => setActiveView(View.WAREHOUSE)}
              className={`w-full text-left px-4 py-3 rounded-xl flex flex-col transition-all ${activeView === View.WAREHOUSE ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <div className="flex items-center gap-3">
                <span>🏭 Warehouse Dept</span>
              </div>
              {pendingOrdersCount > 0 && activeView !== View.WAREHOUSE && (
                <div className="mt-2">
                  <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200 font-bold">
                     {pendingOrdersCount} รอยืนยัน
                  </span>
                </div>
              )}
            </button>
          )}

          <div className="pt-4 pb-2 text-[10px] font-bold text-slate-400 px-4 uppercase tracking-widest">
            System
          </div>
          {isViewAllowed(View.SETTINGS) && (
            <button 
              onClick={() => setActiveView(View.SETTINGS)}
              className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all ${activeView === View.SETTINGS ? 'bg-slate-800 text-white shadow-lg shadow-slate-100 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              ⚙️ Settings
            </button>
          )}
        </nav>

        <div className="p-4 border-t border-slate-100 bg-slate-50 mt-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-black border border-blue-200">
               {currentUser?.name ? currentUser.name[0] : '?'}
            </div>
            <div className="flex-1 overflow-hidden">
               <p className="text-xs font-black text-slate-800 truncate">{currentUser?.name || 'Unknown User'}</p>
               <p className="text-[10px] text-slate-400 truncate uppercase font-bold">{currentUser?.role || 'Guest'}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full py-2.5 px-4 bg-white border border-red-100 text-red-500 rounded-xl text-xs font-black hover:bg-red-50 transition-all flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-screen relative">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-xs font-medium">LAGLACE Stock Manager /</span>
            <span className="text-sm font-bold text-slate-800 capitalize tracking-tight">{getDisplayName(activeView)}</span>
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden md:flex flex-col items-end">
                <span className="text-sm font-bold text-slate-900">{currentUser?.name || ''}</span>
                <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Online</span>
             </div>
             <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 font-bold border-2 border-blue-200 shadow-sm overflow-hidden">
                {currentUser?.name ? (currentUser.name.charAt(currentUser.name.indexOf('คุณ') + 3) || currentUser.name[0]) : '?'}
             </div>
          </div>
        </header>
        <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
