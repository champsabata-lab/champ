
import React, { useState } from 'react';
import { Announcement, UserAccount } from '../types';

interface NewsAnnouncementProps {
  announcements: Announcement[];
  setAnnouncements: React.Dispatch<React.SetStateAction<Announcement[]>>;
  currentUser: UserAccount;
}

const NewsAnnouncement: React.FC<NewsAnnouncementProps> = ({ announcements, setAnnouncements, currentUser }) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Announcement>>({});

  const canEdit = currentUser.canManageAccounts || currentUser.role === 'Warehouse'; // Logic for who can edit

  const startEditing = (ann: Announcement) => {
    setEditingId(ann.id);
    setEditForm(ann);
  };

  const handleSave = () => {
    if (editingId === null) return;
    setAnnouncements(prev => prev.map(a => a.id === editingId ? { ...a, ...editForm, updatedAt: new Date().toISOString() } : a));
    setEditingId(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setEditForm(prev => ({ ...prev, image: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const addNewAnnouncement = () => {
    const newId = announcements.length > 0 ? Math.max(...announcements.map(a => a.id)) + 1 : 1;
    const newAnn: Announcement = {
      id: newId,
      title: 'หัวข้อประกาศใหม่',
      detail: 'รายละเอียดประกาศ...',
      icon: '📢',
      color: 'blue',
      updatedAt: new Date().toISOString()
    };
    setAnnouncements([newAnn, ...announcements]);
    startEditing(newAnn);
  };

  const removeAnnouncement = (id: number) => {
    if (confirm('คุณต้องการลบประกาศนี้ใช่หรือไม่?')) {
      setAnnouncements(announcements.filter(a => a.id !== id));
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 italic tracking-tighter">News & Announcement</h1>
          <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-1">ศูนย์รวมประกาศและระเบียบปฏิบัติการสำคัญสำหรับทีม LAGLACE</p>
        </div>
        {canEdit && (
          <button 
            onClick={addNewAnnouncement}
            className="px-6 py-3 bg-pink-500 text-white rounded-2xl font-black shadow-xl shadow-pink-100 hover:scale-105 transition-all flex items-center gap-2"
          >
            <span>+</span> เพิ่มประกาศใหม่
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-8">
        {announcements.map((item) => {
          const isEditing = editingId === item.id;
          
          return (
            <div 
              key={item.id} 
              id={`news-topic-${item.id}`}
              className={`bg-white rounded-[3rem] border-2 transition-all p-8 shadow-sm group relative ${isEditing ? 'border-blue-500 ring-4 ring-blue-50' : 'border-transparent hover:border-slate-100'}`}
            >
              {canEdit && !isEditing && (
                <div className="absolute top-8 right-8 flex gap-2">
                  <button 
                    onClick={() => startEditing(item)}
                    className="w-10 h-10 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                    title="Edit Announcement"
                  >
                    ✏️
                  </button>
                  <button 
                    onClick={() => removeAnnouncement(item.id)}
                    className="w-10 h-10 bg-slate-100 text-slate-300 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              )}

              <div className="flex flex-col md:flex-row items-start gap-8">
                {/* Icon & Color Selector in Edit Mode */}
                <div className="flex flex-col items-center gap-4">
                  {isEditing ? (
                    <div className="space-y-4">
                       <div className="w-20 h-20 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 flex items-center justify-center text-4xl">
                         <input 
                           type="text" 
                           className="w-full bg-transparent text-center outline-none" 
                           value={editForm.icon} 
                           onChange={e => setEditForm({...editForm, icon: e.target.value})} 
                         />
                       </div>
                       <div className="flex gap-1 justify-center">
                          {['red', 'blue', 'emerald', 'pink', 'indigo', 'amber'].map(c => (
                            <button 
                              key={c}
                              onClick={() => setEditForm({...editForm, color: c})}
                              className={`w-4 h-4 rounded-full border-2 ${editForm.color === c ? 'border-slate-900 scale-125' : 'border-transparent'}`}
                              style={{ backgroundColor: c === 'emerald' ? '#10b981' : c }}
                            />
                          ))}
                       </div>
                    </div>
                  ) : (
                    <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center text-4xl shadow-inner border transition-all bg-${item.color}-50 border-${item.color}-100 text-${item.color}-600`}>
                      {item.icon}
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-6">
                  {isEditing ? (
                    <div className="space-y-4 w-full">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Subheading / Title</label>
                        <input 
                          className="w-full p-4 bg-slate-50 border-none rounded-2xl font-black text-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                          value={editForm.title}
                          onChange={e => setEditForm({...editForm, title: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Detail Text</label>
                        <textarea 
                          rows={5}
                          className="w-full p-6 bg-slate-50 border-none rounded-[2rem] font-medium text-slate-600 outline-none focus:ring-2 focus:ring-blue-500 transition-all leading-relaxed"
                          value={editForm.detail}
                          onChange={e => setEditForm({...editForm, detail: e.target.value})}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <h3 className={`text-2xl font-black text-slate-800 group-hover:text-${item.color}-600 transition-colors italic tracking-tight`}>
                        {item.title}
                      </h3>
                      <div className="bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100 shadow-inner">
                         <p className="text-slate-600 font-medium leading-relaxed whitespace-pre-wrap">
                           {item.detail}
                         </p>
                      </div>
                    </div>
                  )}

                  {/* Image Display & Upload */}
                  <div className="space-y-4">
                    {isEditing ? (
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Announcement Image</label>
                        <div className="flex flex-col gap-4">
                          {editForm.image && (
                            <div className="relative group w-full max-w-md aspect-video rounded-3xl overflow-hidden border-8 border-slate-50 shadow-inner">
                              <img src={editForm.image} className="w-full h-full object-cover" alt="" />
                              <button 
                                onClick={() => setEditForm({...editForm, image: undefined})}
                                className="absolute top-4 right-4 bg-red-500 text-white w-8 h-8 rounded-xl font-black shadow-lg"
                              >✕</button>
                            </div>
                          )}
                          <label className="w-full max-w-md h-32 rounded-3xl border-4 border-dashed border-slate-100 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-all group">
                             <span className="text-2xl text-slate-300 group-hover:text-blue-500">+ Upload Photo</span>
                             <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                          </label>
                        </div>
                      </div>
                    ) : (
                      item.image && (
                        <div className="w-full max-w-2xl rounded-[2.5rem] overflow-hidden border-8 border-slate-50 shadow-inner mt-4">
                           <img src={item.image} className="w-full h-auto object-cover" alt={item.title} />
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="mt-10 flex justify-end gap-3 pt-6 border-t border-slate-100">
                  <button 
                    onClick={() => setEditingId(null)}
                    className="px-8 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSave}
                    className="px-12 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-100 hover:scale-105 transition-all"
                  >
                    Save Changes
                  </button>
                </div>
              )}

              <div className="mt-8 flex justify-between items-center border-t border-slate-50 pt-6">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">
                  Last updated: {new Date(item.updatedAt).toLocaleString('th-TH')}
                </span>
                {!isEditing && (
                  <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-${item.color}-50 text-${item.color}-600 border border-${item.color}-100`}>
                    Official Update
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {announcements.length === 0 && (
          <div className="p-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
             <p className="text-6xl mb-6 grayscale opacity-20">📢</p>
             <h3 className="text-2xl font-black text-slate-300 italic uppercase tracking-tighter">ไม่มีประกาศในขณะนี้</h3>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsAnnouncement;
