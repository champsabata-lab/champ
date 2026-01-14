
import React from 'react';
import { Order, Product, Store, Influencer, UserAccount } from '../types';
import ReportingModule from './ReportingModule';

interface ExportReportsProps {
  orders: Order[];
  products: Product[];
  stores: Store[];
  influencers: Influencer[];
  users: UserAccount[];
}

const ExportReports: React.FC<ExportReportsProps> = (props) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-black text-slate-800">Advanced Analytics Center</h1>
        <p className="text-slate-400 text-sm">Comprehensive tools for full-screen data analysis and large-scale exports.</p>
      </div>
      
      <ReportingModule 
        {...props} 
        title="Full Precision Data Export"
      />

      <div className="bg-blue-50 p-10 rounded-[3rem] border border-blue-100 flex flex-col items-center text-center gap-4">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-blue-600 text-3xl shadow-sm">💡</div>
        <h3 className="text-xl font-black text-blue-900">Tips for Google Sheets</h3>
        <p className="text-blue-700/60 max-w-lg text-sm">
          The "Google Sheets Sync" button copies data in TSV format. 
          Simply click the button, open your Google Sheet, and press <strong>Ctrl+V</strong>. 
          All columns and formatting will be perfectly aligned without the need for manual file imports.
        </p>
      </div>
    </div>
  );
};

export default ExportReports;
