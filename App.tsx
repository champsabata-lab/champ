
import React, { useState, useEffect, useMemo } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import AiChat from './components/AiChat';
import ExportReports from './components/ExportReports';
import NewsAnnouncement from './components/NewsAnnouncement';
import { View, Order, Product, Store, UserAccount, Influencer, OrderItem, OrderSource, OrderStatus, Announcement } from './types';
import { INITIAL_PRODUCTS, INITIAL_ORDERS, INITIAL_STORES, INITIAL_USERS, INITIAL_INFLUENCERS, INITIAL_ANNOUNCEMENTS, ALL_VIEWS, PURCHASING_VIEWS, PRODUCT_CATEGORIES } from './constants';

// --- แก้ไขจุดที่ 1: เปลี่ยน API_BASE ให้เป็น Relative Path สำหรับ Hostinger ---
const API_BASE = '/api'; 

type SubView = 'history' | 'create' | 'details' | 'manage_inventory' | 'add_product';
type WarehouseSubView = 'pending' | 'fulfillment_history';

const App: React.FC = () => {
  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [loginEmail, setLoginEmail] = useState('admin@laglace.com');
  const [loginPassword, setLoginPassword] = useState('password123');
  const [loginError, setLoginError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Core Data State
  const [activeView, setActiveView] = useState<View>(View.DASHBOARD);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [announcements, setAnnouncements] = useState<Announcement[]>(INITIAL_ANNOUNCEMENTS);
  const [stores, setStores] = useState<Store[]>(INITIAL_STORES);
  const [influencers, setInfluencers] = useState<Influencer[]>(INITIAL_INFLUENCERS);
  const [users, setUsers] = useState<UserAccount[]>(INITIAL_USERS);
   
  // Customization & Policy State
  const [loginWallpaper, setLoginWallpaper] = useState<string>('');
  const [allowRegistration, setAllowRegistration] = useState<boolean>(false);
  const [requireApproval, setRequireApproval] = useState<boolean>(true);

  // Sub-navigation State
  const [subView, setSubView] = useState<SubView>('history');
  const [warehouseSubView, setWarehouseSubView] = useState<WarehouseSubView>('pending');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
   
  // Shipment Tracker Specific State
  const [selectedTrackingOrderId, setSelectedTrackingOrderId] = useState<string | null>(null);
  const [tempTrackingNumber, setTempTrackingNumber] = useState('');

  // Warehouse Specific State
  const [confirmingOrder, setConfirmingOrder] = useState<Order | null>(null);
  const [warehouseAuth, setWarehouseAuth] = useState({ userId: '', password: '' });

  // Product Form State
  const [isEditingProduct, setIsEditingProduct] = useState<string | null>(null);
  const [productForm, setProductForm] = useState<Partial<Product>>({
    name: '', sku: '', unit: 'ชิ้น', category: PRODUCT_CATEGORIES[0], unitPrice: 0,
    stockPurchasing: 0, stockContent: 0, stockInfluencer: 0, stockLive: 0, stockAffiliate: 0, stockBuffer: 0,
    lotNumber: '', mfd: '', exp: '',
    images: []
  });

  // Order Form State
  const [productSearch, setProductSearch] = useState('');
  const [operationCategoryFilter, setOperationCategoryFilter] = useState('all');
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [createOrderForm, setCreateOrderForm] = useState({
    poNumber: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    storeId: '',
    subBranch: '',
    recipientName: '',
    recipientAddress: ''
  });

  const [notification, setNotification] = useState<string | null>(null);

  // Settings UI State
  const [newStoreName, setNewStoreName] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // --- DATA FETCHING LOGIC START (แก้ไขจุดที่ 2: เพิ่มการดึงข้อมูลจาก Server) ---
  
  // ฟังก์ชันดึงข้อมูล Influencers
  const fetchInfluencers = async () => {
    try {
      const response = await fetch(`${API_BASE}/influencers`);
      if (response.ok) {
        const data = await response.json();
        setInfluencers(data);
      }
    } catch (err) {
      console.error("Error connecting to Influencer API:", err);
    }
  };

  // ฟังก์ชันดึงข้อมูล Orders (บิลขาย)
  const fetchOrders = async () => {
    try {
      const response = await fetch(`${API_BASE}/orders`); // เรียกไปที่ Backend
      if (response.ok) {
        const data = await response.json();
        setOrders(data); // เอาข้อมูลจาก DB มาใส่ใน State
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
  };

  // เรียกใช้เมื่อเปิดหน้าเว็บ (useEffect)
  useEffect(() => {
    fetchInfluencers();
    fetchOrders(); // สั่งให้ดึงข้อมูลบิลขายด้วย

    // โหลด Settings อื่นๆ จาก LocalStorage (เฉพาะที่ไม่สำคัญ)
    const saved = localStorage.getItem('laglace_v16_master');
    if (saved) {
      const parsed = JSON.parse(saved) as any;
      if (parsed.products) setProducts(parsed.products);
      if (parsed.stores) setStores(parsed.stores);
      if (parsed.users) setUsers(parsed.users);
      if (parsed.loginWallpaper) setLoginWallpaper(parsed.loginWallpaper);
    }
  }, []);
  // --- DATA FETCHING LOGIC END ---

  // Persistence (เฉพาะข้อมูลที่ไม่ใช่ Transaction)
  useEffect(() => {
    localStorage.setItem('laglace_v16_master', JSON.stringify({ 
      products, 
      announcements,
      stores, 
      users,
      loginWallpaper,
      allowRegistration,
      requireApproval
    }));
  }, [products, announcements, stores, users, loginWallpaper, allowRegistration, requireApproval]);

  // Reset SubView when main view changes
  useEffect(() => {
    if (activeView === View.INVENTORY) {
      setSubView('manage_inventory');
    } else if ([View.PURCHASING, View.INFLUENCER_DEP, View.LIVE_DEP, View.AFFILIATE_DEP, View.BUFFER_DEP].includes(activeView)) {
      setSubView('history');
    }
    setProductSearch('');
    setOperationCategoryFilter('all');
    setSelectedItems({});
    setSelectedTrackingOrderId(null);
    setTempTrackingNumber('');
    setConfirmingOrder(null);
    setWarehouseAuth({ userId: '', password: '' });
    setSelectedOrderId(null);
    setHistorySearchQuery('');
    setCreateOrderForm({
      poNumber: '',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      storeId: '',
      subBranch: '',
      recipientName: '',
      recipientAddress: ''
    });
    if (activeView === View.WAREHOUSE) {
      setWarehouseSubView('pending');
    }
  }, [activeView]);

  const showNotify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.email === loginEmail && u.password === loginPassword);
    if (user) {
      setCurrentUser(user);
      setIsLoggedIn(true);
      setActiveView(user.allowedViews[0]);
    } else {
      setLoginError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file: any) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setProductForm(prev => ({
          ...prev,
          images: [...(prev.images || []), base64]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const saveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const newProduct = {
      ...productForm,
      id: isEditingProduct || `P-${Date.now()}`,
      images: productForm.images && productForm.images.length > 0 ? productForm.images : ['https://images.unsplash.com/photo-1596462502278-27bfdc4033c8?auto=format&fit=crop&q=80&w=300']
    } as Product;

    if (isEditingProduct) {
      setProducts(prev => prev.map(p => p.id === isEditingProduct ? newProduct : p));
      showNotify("แก้ไขข้อมูลสินค้าสำเร็จ");
    } else {
      setProducts(prev => [...prev, newProduct]);
      showNotify("เพิ่มสินค้าใหม่สำเร็จ");
    }
    setSubView('manage_inventory');
    setIsEditingProduct(null);
  };

  const duplicateProduct = (p: Product) => {
    setProductForm({ ...p, id: undefined, name: `${p.name} (Copy)`, sku: `${p.sku}-COPY` });
    setSubView('add_product');
    setIsEditingProduct(null);
    showNotify("สร้างจากต้นแบบเรียบร้อย กรุณาระบุ SKU ใหม่");
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus, confirmedBy?: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        if (status === 'confirmed' && o.status !== 'confirmed') {
          const source = o.source;
          const stockKey = `stock${source.charAt(0).toUpperCase() + source.slice(1)}` as keyof Product;
           
          setProducts(prevProds => prevProds.map(p => {
            const item = o.items.find(i => i.productId === p.id);
            if (item) {
              return { ...p, [stockKey]: Math.max(0, (p[stockKey] as number) - item.quantity) };
            }
            return p;
          }));
        }
        return { ...o, status, processedAt: new Date().toISOString(), purchasingDept: confirmedBy || o.purchasingDept };
      }
      return o;
    }));
    showNotify(`อัปเดตบิล #${orderId} เป็น ${status.toUpperCase()}`);
  };

  const adjustWarehouseOrderQty = (orderId: string, productId: string, newQty: number) => {
    if (newQty < 0) return;
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const newItems = o.items.map(item => 
          item.productId === productId ? { ...item, quantity: newQty } : item
        );
        const newTotal = newItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
        return { ...o, items: newItems, totalValue: newTotal };
      }
      return o;
    }));
  };

  const saveTrackingNumber = (orderId: string) => {
    if (!tempTrackingNumber.trim()) {
      showNotify("กรุณาระบุเลขพัสดุ");
      return;
    }
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, trackingNumber: tempTrackingNumber } : o));
    setSelectedTrackingOrderId(null);
    setTempTrackingNumber('');
    showNotify("บันทึกเลขพัสดุเรียบร้อยแล้ว");
  };

  const handleResetSettings = () => {
    if (confirm("คุณต้องการล้างการตั้งค่าทั้งหมดและกลับไปใช้ค่าเริ่มต้นใช่หรือไม่?")) {
      setProducts(INITIAL_PRODUCTS);
      setOrders(INITIAL_ORDERS);
      setAnnouncements(INITIAL_ANNOUNCEMENTS);
      setStores(INITIAL_STORES);
      setUsers(INITIAL_USERS);
      setLoginWallpaper('');
      setAllowRegistration(false);
      setRequireApproval(true);
      showNotify("รีเซ็ตระบบเป็นค่าเริ่มต้นเรียบร้อย");
      localStorage.removeItem('laglace_v16_master');
      window.location.reload();
    }
  };

  const handleAddStore = () => {
    if (!newStoreName.trim()) return;
    const newStore: Store = {
      id: `S-${Date.now()}`,
      name: newStoreName,
      subBranches: []
    };
    setStores([...stores, newStore]);
    setNewStoreName('');
    showNotify("เพิ่มหน้าร้านใหม่สำเร็จ");
  };

  const handleAddBranch = (storeId: string, branchName: string) => {
    if (!branchName.trim()) return;
    setStores(prev => prev.map(s => s.id === storeId ? { ...s, subBranches: [...(s.subBranches || []), branchName] } : s));
    showNotify("เพิ่มสาขาย่อยสำเร็จ");
  };

  const handleAddUser = () => {
    if (!newUserName || !newUserEmail || !newUserPassword) return;
    const newUser: UserAccount = {
      id: `U-${Date.now()}`,
      name: newUserName,
      email: newUserEmail,
      password: newUserPassword,
      role: 'Staff',
      canManageAccounts: false,
      canCreateProducts: false,
      canAdjustStock: false,
      allowedViews: PURCHASING_VIEWS
    };
    setUsers([...users, newUser]);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserPassword('');
    showNotify("สร้างบัญชีผู้ใช้ใหม่สำเร็จ");
  };

  const toggleUserPermission = (userId: string, permission: keyof UserAccount) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, [permission]: !u[permission] } : u));
  };

  const toggleUserView = (userId: string, view: View) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const allowed = [...u.allowedViews];
        if (allowed.includes(view)) {
          return { ...u, allowedViews: allowed.filter(v => v !== view) };
        } else {
          return { ...u, allowedViews: [...allowed, view] };
        }
      }
      // Fix: Corrected the return variable from 'o' to 'u' to correctly reference the map item.
      return u;
    }));
  };

  const getSourceFromView = (view: View): OrderSource => {
    switch(view) {
      case View.INFLUENCER_DEP: return 'influencer';
      case View.LIVE_DEP: return 'live';
      case View.AFFILIATE_DEP: return 'affiliate';
      case View.BUFFER_DEP: return 'buffer';
      default: return 'purchasing';
    }
  };

  const filteredOrdersBySearch = (ordersToFilter: Order[]) => {
    if (!historySearchQuery.trim()) return ordersToFilter;
    const q = historySearchQuery.toLowerCase();
    return ordersToFilter.filter(o => 
      o.poNumber.toLowerCase().includes(q) ||
      o.id.toLowerCase().includes(q) ||
      o.targetName?.toLowerCase().includes(q) ||
      o.storeName?.toLowerCase().includes(q) ||
      o.influencerName?.toLowerCase().includes(q) ||
      o.subBranch?.toLowerCase().includes(q) ||
      o.recipientName?.toLowerCase().includes(q) ||
      o.purchasingDept.toLowerCase().includes(q) ||
      o.items.some(item => 
        item.productName.toLowerCase().includes(q) || 
        item.sku.toLowerCase().includes(q)
      )
    );
  };

  const renderOperationModule = () => {
    const source = getSourceFromView(activeView);
    const viewTitle = activeView.replace('_DEP', '').replace('_', ' ');
    const selectedStore = stores.find(s => s.id === createOrderForm.storeId);

    if (subView === 'create') {
      const filteredGridProducts = products.filter(p => {
        const matchSearch = p.name.includes(productSearch) || p.sku.includes(productSearch);
        const matchCategory = operationCategoryFilter === 'all' || p.category === operationCategoryFilter;
        return matchSearch && matchCategory;
      });

      return (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter italic">บันทึกรายการ {viewTitle}</h2>
            <button onClick={() => setSubView('history')} className="px-6 py-2 bg-slate-100 text-slate-500 rounded-xl font-bold hover:bg-slate-200 transition-all">ย้อนกลับ</button>
          </div>
          <div className="bg-white p-8 rounded-[3rem] border shadow-sm space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">เลขที่อ้างอิง (PO Number)</label>
                <input type="text" placeholder="ระบุเลขที่บิล..." className="w-full p-4 bg-slate-50 border-none rounded-2xl font-black outline-none focus:ring-2 focus:ring-blue-500" value={createOrderForm.poNumber} onChange={e => setCreateOrderForm({...createOrderForm, poNumber: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">วันที่</label>
                <input type="date" className="w-full p-4 bg-slate-50 border-none rounded-2xl font-black outline-none" value={createOrderForm.date} onChange={e => setCreateOrderForm({...createOrderForm, date: e.target.value})} />
              </div>
               
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">หน้าร้านหลัก / แบรนด์</label>
                <select className="w-full p-4 bg-slate-50 border-none rounded-2xl font-black outline-none appearance-none" value={createOrderForm.storeId} onChange={e => setCreateOrderForm({...createOrderForm, storeId: e.target.value, subBranch: ''})}>
                  <option value="">เลือกหน้าร้าน...</option>
                  {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">สาขาย่อย</label>
                <select className="w-full p-4 bg-slate-50 border-none rounded-2xl font-black outline-none appearance-none disabled:opacity-50" disabled={!selectedStore} value={createOrderForm.subBranch} onChange={e => setCreateOrderForm({...createOrderForm, subBranch: e.target.value})}>
                  <option value="">เลือกสาขา...</option>
                  {selectedStore?.subBranches?.map((b, idx) => <option key={idx} value={b}>{b}</option>)}
                </select>
              </div>

              <div className="space-y-1 lg:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ชื่อ-นามสกุล ผู้รับ (Recipient Name)</label>
                <input type="text" placeholder="ระบุชื่อผู้รับสินค้า..." className="w-full p-4 bg-slate-50 border-none rounded-2xl font-black outline-none" value={createOrderForm.recipientName} onChange={e => setCreateOrderForm({...createOrderForm, recipientName: e.target.value})} />
              </div>

              <div className="space-y-1 lg:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ที่อยู่สำหรับการจัดส่ง (Recipient Address)</label>
                <input type="text" placeholder="ระบุที่อยู่โดยละเอียด..." className="w-full p-4 bg-slate-50 border-none rounded-2xl font-black outline-none" value={createOrderForm.recipientAddress} onChange={e => setCreateOrderForm({...createOrderForm, recipientAddress: e.target.value})} />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="flex-1 space-y-4">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-tighter italic">รายการสินค้า (Select Products)</h3>
                  <div className="flex flex-col md:flex-row gap-4">
                    <input type="text" placeholder="ค้นหาสินค้าเพื่อเพิ่มลงบิล..." className="px-4 py-3 bg-slate-100 rounded-xl text-xs font-bold outline-none w-full md:w-64 border-2 border-transparent focus:border-blue-500" value={productSearch} onChange={e => setProductSearch(e.target.value)} />
                     
                    <div className="space-y-1">
                      <select 
                        className="p-3 bg-slate-100 rounded-xl text-xs font-bold outline-none border-2 border-transparent focus:border-blue-500 appearance-none min-w-[200px]"
                        value={operationCategoryFilter}
                        onChange={e => setOperationCategoryFilter(e.target.value)}
                      >
                        <option value="all">ทุกหมวดหมู่ (All Categories)</option>
                        {PRODUCT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 max-h-[250px] overflow-y-auto p-2 bg-slate-50 rounded-[2rem]">
                {filteredGridProducts.map(p => (
                  <div key={p.id} onClick={() => setSelectedItems(prev => ({...prev, [p.id]: (prev[p.id] || 0) + 1}))} className="bg-white p-3 rounded-2xl border hover:border-blue-500 cursor-pointer transition-all shadow-sm hover:scale-105 group">
                    <img src={p.images[0] || 'https://images.unsplash.com/photo-1596462502278-27bfdc4033c8?auto=format&fit=crop&q=80&w=300'} className="w-full aspect-square object-cover rounded-xl mb-2" alt="" />
                    <p className="text-[9px] font-black text-slate-800 truncate">{p.name}</p>
                    <p className="text-[8px] text-slate-400 font-bold">{p.sku}</p>
                    <p className="text-[7px] bg-slate-100 px-1 py-0.5 rounded inline-block mt-1 text-slate-500">{p.category.split(' ')[0]}</p>
                  </div>
                ))}
                {filteredGridProducts.length === 0 && (
                   <div className="col-span-full py-10 text-center text-slate-300 font-bold italic">ไม่พบสินค้าในหมวดหมู่นี้</div>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-900 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                  <tr><th className="p-4 rounded-tl-2xl">รายการ</th><th className="p-4 text-center">จำนวน</th><th className="p-4 text-right rounded-tr-2xl">ราคา</th></tr>
                </thead>
                <tbody className="divide-y text-sm font-bold">
                  {(Object.entries(selectedItems) as [string, any][]).map(([pid, qty]) => {
                    const p = products.find(x => x.id === pid)!;
                    return (
                      <tr key={pid}>
                        <td className="p-4">{p.name}</td>
                        <td className="p-4 flex items-center justify-center gap-4">
                          <button onClick={() => setSelectedItems(prev => { const n = {...prev} as any; if(n[pid]>1) n[pid]--; else delete n[pid]; return n; })} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors">-</button>
                          <span>{qty}</span>
                          <button onClick={() => setSelectedItems(prev => ({...prev, [pid]: (prev[pid] || 0) + 1}))} className="w-8 h-8 rounded-lg bg-slate-900 text-white hover:bg-slate-700 transition-colors">+</button>
                        </td>
                        <td className="p-4 text-right">฿{(p.unitPrice * qty).toLocaleString()}</td>
                      </tr>
                    );
                  })}
                  {Object.keys(selectedItems).length === 0 && (
                    <tr><td colSpan={3} className="p-10 text-center text-slate-300 italic">กรุณาเลือกสินค้าอย่างน้อย 1 รายการ</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end">
              <button 
                disabled={Object.keys(selectedItems).length === 0}
                // --- แก้ไขจุดที่ 3: เปลี่ยน onClick เป็น async และส่งข้อมูลไปที่ Backend ---
                onClick={async () => {
                const items: OrderItem[] = (Object.entries(selectedItems) as [string, any][]).map(([pid, qty]) => {
                  const p = products.find(x => x.id === pid)!;
                  return { productId: pid, productName: p.name, sku: p.sku, quantity: qty, originalQuantity: qty, unitPrice: p.unitPrice };
                });

                const newOrder: Order = {
                  id: `TXN-${Date.now().toString().slice(-6)}`,
                  poNumber: createOrderForm.poNumber || `BILL-${Date.now().toString().slice(-5)}`,
                  source: source,
                  targetName: selectedStore?.name || 'Unknown',
                  storeName: selectedStore?.name,
                  subBranch: createOrderForm.subBranch,
                  recipientName: createOrderForm.recipientName,
                  recipientAddress: createOrderForm.recipientAddress,
                  items: items,
                  totalValue: items.reduce((s, i) => s + (i.quantity * i.unitPrice), 0),
                  status: 'pending',
                  requestedAt: `${createOrderForm.date}T${createOrderForm.time}:00`,
                  purchasingDept: currentUser?.name || 'Unknown'
                };

                // ส่งข้อมูลไปที่ Hostinger MySQL
                try {
                  const response = await fetch(`${API_BASE}/orders`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newOrder)
                  });

                  if (response.ok) {
                    // ถ้าบันทึกสำเร็จ ให้ดึงข้อมูลใหม่มาโชว์
                    fetchOrders();
                    setSubView('history');
                    showNotify(`บันทึกรายการ Walkout ลงฐานข้อมูลสำเร็จ!`);
                  } else {
                    showNotify(`เกิดข้อผิดพลาด: ${response.statusText}`);
                  }
                } catch (error) {
                  console.error(error);
                  showNotify(`เชื่อมต่อ Server ไม่ได้`);
                }

              }} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl hover:scale-105 transition-all disabled:opacity-20">ยืนยันรายการ Walkout</button></div>
          </div>
        </div>
      );
    }

    if (subView === 'details' && selectedOrderId) {
      const order = orders.find(o => o.id === selectedOrderId);
      if (!order) return null;
      return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter italic">รายละเอียดรายการ {order.poNumber}</h2>
              <button onClick={() => { setSubView('history'); setSelectedOrderId(null); }} className="px-6 py-2 bg-slate-100 text-slate-500 rounded-xl font-bold hover:bg-slate-200 transition-all">ย้อนกลับ</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                 <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">รายการสินค้าในบิล</h3>
                    <div className="overflow-x-auto">
                       <table className="w-full text-left font-bold text-sm">
                          <thead className="text-[10px] text-slate-400 uppercase tracking-widest border-b">
                             <tr>
                                <th className="pb-4">สินค้า</th>
                                <th className="pb-4 text-center">จำนวนเดิม</th>
                                <th className="pb-4 text-center">จำนวนที่เบิก</th>
                                <th className="pb-4 text-right">ราคารวม</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y">
                             {order.items.map((item, idx) => (
                               <tr key={idx} className="hover:bg-slate-50/50">
                                  <td className="py-4">
                                     <p className="text-slate-900 font-black">{item.productName}</p>
                                     <p className="text-[10px] text-slate-400">{item.sku}</p>
                                  </td>
                                  <td className="py-4 text-center text-slate-400">{item.originalQuantity}</td>
                                  <td className="py-4 text-center">
                                     <span className={`px-3 py-1 rounded-lg font-black ${item.quantity !== item.originalQuantity ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'}`}>
                                        {item.quantity}
                                     </span>
                                  </td>
                                  <td className="py-4 text-right text-slate-900 font-black">฿{(item.quantity * item.unitPrice).toLocaleString()}</td>
                               </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                    <div className="mt-8 pt-8 border-t flex justify-between items-end">
                       <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">สถานะบิล</p>
                          <span className={`inline-block mt-1 px-4 py-1.5 rounded-full text-[9px] font-black uppercase border ${order.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                             {order.status}
                          </span>
                       </div>
                       <div className="text-right">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ยอดรวมสุทธิ</p>
                          <p className="text-3xl font-black text-slate-900 italic tracking-tighter">฿{order.totalValue.toLocaleString()}</p>
                       </div>
                    </div>
                 </div>
              </div>
              
              <div className="space-y-6">
                 <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white space-y-6 shadow-xl">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">ข้อมูลอ้างอิง</h3>
                    <div className="space-y-4">
                       <div>
                          <p className="text-[9px] font-black text-slate-500 uppercase">หน้าร้าน/แบรนด์</p>
                          <p className="text-sm font-black">{order.storeName || '-'}</p>
                       </div>
                       <div>
                          <p className="text-[9px] font-black text-slate-500 uppercase">สาขาย่อย</p>
                          <p className="text-sm font-black">{order.subBranch || '-'}</p>
                       </div>
                       <div>
                          <p className="text-[9px] font-black text-slate-500 uppercase">ผู้รับ</p>
                          <p className="text-sm font-black">{order.recipientName || '-'}</p>
                          <p className="text-xs text-slate-400 mt-1">{order.recipientAddress || '-'}</p>
                       </div>
                       <div>
                          <p className="text-[9px] font-black text-slate-500 uppercase">ผู้บันทึกรายการ</p>
                          <p className="text-sm font-black">{order.purchasingDept}</p>
                       </div>
                       <div>
                          <p className="text-[9px] font-black text-slate-500 uppercase">วันที่บันทึก</p>
                          <p className="text-sm font-black">{new Date(order.requestedAt).toLocaleString('th-TH')}</p>
                       </div>
                       {order.processedAt && (
                         <div>
                            <p className="text-[9px] font-black text-slate-500 uppercase">วันที่ยืนยันเบิก</p>
                            <p className="text-sm font-black text-emerald-400">{new Date(order.processedAt).toLocaleString('th-TH')}</p>
                         </div>
                       )}
                    </div>
                 </div>
              </div>
            </div>
        </div>
      );
    }

    const baseFiltered = orders.filter(o => o.source === source);
    const finalFiltered = filteredOrdersBySearch(baseFiltered);

    return (
      <div className="space-y-10 animate-in fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <button onClick={() => setSubView('create')} className="px-10 py-5 bg-slate-900 text-white rounded-3xl font-black shadow-xl hover:scale-105 transition-all">บันทึก {viewTitle} ใหม่</button>
           
          <div className="relative w-full md:w-96 group">
             <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
             </div>
             <input 
               type="text" 
               placeholder="ค้นหาเลขบิล, ชื่อสินค้า, สาขา..." 
               className="w-full pl-14 pr-5 py-4 bg-white border-2 border-slate-100 rounded-3xl text-sm font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 shadow-sm transition-all"
               value={historySearchQuery}
               onChange={(e) => setHistorySearchQuery(e.target.value)}
             />
             {historySearchQuery && (
               <button 
                 onClick={() => setHistorySearchQuery('')}
                 className="absolute inset-y-0 right-5 flex items-center text-slate-300 hover:text-slate-500"
               >
                 ✕
               </button>
             )}
          </div>
        </div>

        <div className="bg-white p-10 rounded-[3rem] border shadow-sm overflow-hidden">
          <table className="w-full text-left font-bold text-slate-700">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[9px] tracking-widest">
              <tr>
                <th className="p-5 rounded-tl-3xl text-center w-16">#</th>
                <th className="p-5">บิล</th>
                <th className="p-5">วันที่</th>
                <th className="p-5">เป้าหมาย</th>
                <th className="p-5 text-center">สถานะ</th>
                <th className="p-5 rounded-tr-3xl text-right">ยอดรวม</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {finalFiltered.map((o, idx) => (
                <tr key={o.id} onClick={() => { setSelectedOrderId(o.id); setSubView('details'); }} className="hover:bg-slate-50 cursor-pointer group transition-all">
                  <td className="p-5 text-center text-slate-300 font-black">{idx + 1}</td>
                  <td className="p-5">
                    <p className="text-slate-900 font-black group-hover:text-blue-600 transition-colors uppercase">{o.poNumber}</p>
                    <p className="text-[9px] text-slate-300 font-medium">ID: {o.id}</p>
                  </td>
                  <td className="p-5 text-xs text-slate-400">{new Date(o.requestedAt).toLocaleDateString('th-TH')}</td>
                  <td className="p-5">
                    <p className="text-sm font-black text-slate-800">{o.storeName || o.influencerName || o.recipientName}</p>
                    <p className="text-[10px] text-slate-400">{o.subBranch || '-'}</p>
                  </td>
                  <td className="p-5 text-center"><span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border ${o.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>{o.status}</span></td>
                  <td className="p-5 text-right font-black text-slate-900">฿{o.totalValue.toLocaleString()}</td>
                </tr>
              ))}
              {finalFiltered.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                       <p className="text-5xl grayscale opacity-30">🔍</p>
                       <p className="text-slate-300 font-black uppercase italic tracking-widest">ไม่พบรายการที่ค้นหา</p>
                       {historySearchQuery && <button onClick={() => setHistorySearchQuery('')} className="text-blue-500 text-xs font-bold hover:underline">ล้างการค้นหา</button>}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderInventory = () => {
    if (subView === 'add_product') {
      return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in zoom-in-95 duration-300 pb-20">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-black text-slate-900 italic tracking-tighter">
              {isEditingProduct ? 'แก้ไขข้อมูลสินค้า' : 'เพิ่มสินค้าใหม่ลงระบบ'}
            </h2>
            <button onClick={() => setSubView('manage_inventory')} className="text-slate-400 font-bold hover:underline">ยกเลิก</button>
          </div>
          <form onSubmit={saveProduct} className="bg-white p-10 rounded-[3rem] border shadow-sm space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ชื่อสินค้า</label>
                    <input required type="text" className="w-full p-4 bg-slate-50 border-none rounded-2xl font-black outline-none" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">SKU / รหัสสินค้า</label>
                    <input required type="text" className="w-full p-4 bg-slate-50 border-none rounded-2xl font-black outline-none" value={productForm.sku} onChange={e => setProductForm({...productForm, sku: e.target.value})} />
                  </div>
                   
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">หมวดหมู่สินค้า (Category)</label>
                      <select required className="w-full p-4 bg-slate-50 border-none rounded-2xl font-black outline-none appearance-none" value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})}>
                        {PRODUCT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">หน่วยนับ</label>
                      <input required type="text" className="w-full p-4 bg-slate-50 border-none rounded-2xl font-black outline-none" value={productForm.unit} onChange={e => setProductForm({...productForm, unit: e.target.value})} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ราคาต่อหน่วย (฿)</label>
                      <input required type="number" className="w-full p-4 bg-slate-50 border-none rounded-2xl font-black outline-none" value={productForm.unitPrice} onChange={e => setProductForm({...productForm, unitPrice: Number(e.target.value)})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">หมายเลขล็อต (Lot Number)</label>
                      <input type="text" className="w-full p-4 bg-slate-50 border-none rounded-2xl font-black outline-none" value={productForm.lotNumber} onChange={e => setProductForm({...productForm, lotNumber: e.target.value})} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">วันที่ผลิต (MFD)</label>
                      <input type="date" className="w-full p-4 bg-slate-50 border-none rounded-2xl font-black outline-none" value={productForm.mfd} onChange={e => setProductForm({...productForm, mfd: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">วันหมดอายุ (EXP)</label>
                      <input type="date" className="w-full p-4 bg-slate-50 border-none rounded-2xl font-black outline-none" value={productForm.exp} onChange={e => setProductForm({...productForm, exp: e.target.value})} />
                    </div>
                  </div>
               </div>
               
               <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white space-y-6">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Initial Stock Allotment</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {['stockPurchasing', 'stockContent', 'stockInfluencer', 'stockLive', 'stockAffiliate', 'stockBuffer'].map((key) => (
                      <div key={key} className="space-y-1">
                        <label className="text-[8px] font-black text-slate-500 uppercase">{key.replace('stock', '')}</label>
                        <input type="number" className="w-full p-2 bg-white/10 border-none rounded-xl text-white font-black outline-none" value={productForm[key as keyof Product] as number} onChange={e => setProductForm({...productForm, [key]: Number(e.target.value)})} />
                      </div>
                    ))}
                  </div>
               </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Product Media (Image Upload)</label>
               <div className="flex flex-wrap gap-4">
                  {productForm.images?.map((img, idx) => (
                     <div key={idx} className="relative w-28 h-28 rounded-2xl overflow-hidden border-4 border-slate-50 group shadow-sm transition-all hover:scale-105">
                        <img src={img} className="w-full h-full object-cover" alt="" />
                        <button 
                          type="button"
                          onClick={() => {
                            const newImgs = productForm.images?.filter((_, i) => i !== idx);
                            setProductForm({...productForm, images: newImgs});
                          }}
                          className="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-full text-[10px] font-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        >✕</button>
                     </div>
                  ))}
                  <label className="w-28 h-28 rounded-2xl border-4 border-dashed border-slate-100 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-blue-200 transition-all text-slate-300 group">
                     <span className="text-3xl group-hover:text-blue-500 transition-colors">+</span>
                     <span className="text-[8px] font-black uppercase tracking-tighter group-hover:text-blue-500">Add Photo</span>
                     <input 
                       type="file" 
                       className="hidden" 
                       accept="image/*"
                       multiple
                       onChange={handleImageUpload} 
                     />
                  </label>
               </div>
               <p className="text-[9px] text-slate-400 font-bold italic">* Support multi-file upload. First image will be used as primary.</p>
            </div>

            <div className="flex justify-end pt-8">
               <button type="submit" className="px-12 py-5 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-100 hover:scale-105 transition-all">
                 {isEditingProduct ? 'บันทึกการแก้ไขสินค้า' : 'ยืนยันเพิ่มสินค้าลงคลัง'}
               </button>
            </div>
          </form>
        </div>
      );
    }

    return (
      <div className="space-y-8 animate-in fade-in">
         <div className="flex justify-between items-end">
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter italic">ศูนย์รวมคลังสินค้า (Master Inventory)</h2>
              <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-1">Product Catalog & Stock Breakdown</p>
            </div>
            <button onClick={() => { setProductForm({ name: '', sku: '', unit: 'ชิ้น', category: PRODUCT_CATEGORIES[0], unitPrice: 0, stockPurchasing: 0, stockContent: 0, stockInfluencer: 0, stockLive: 0, stockAffiliate: 0, stockBuffer: 0, lotNumber: '', mfd: '', exp: '', images: [] }); setSubView('add_product'); setIsEditingProduct(null); }} className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-100 hover:scale-105 transition-all flex items-center gap-3">
              <span className="text-xl">+</span> เพิ่มสินค้าใหม่
            </button>
         </div>

         <div className="bg-white rounded-[3rem] border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-bold text-slate-700">
                 <thead className="bg-slate-900 text-slate-400 text-[9px] font-black uppercase tracking-widest text-center">
                    <tr>
                      <th className="p-6 text-left rounded-tl-3xl">PRODUCT / SKU</th>
                      <th className="p-6">CATEGORY</th>
                      <th className="p-6 bg-slate-800 text-blue-300">PURCHASING</th>
                      <th className="p-6">CONTENT</th>
                      <th className="p-6 bg-slate-800 text-pink-300">INFLUENCER</th>
                      <th className="p-6">LIVE</th>
                      <th className="p-6 bg-slate-800 text-indigo-300">AFFILIATE</th>
                      <th className="p-6 text-emerald-300">BUFFER</th>
                      <th className="p-6 rounded-tr-3xl">ACTIONS</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y text-xs">
                    {products.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-6 flex items-center gap-4">
                          <img src={p.images[0] || 'https://images.unsplash.com/photo-1596462502278-27bfdc4033c8?auto=format&fit=crop&q=80&w=300'} className="w-12 h-12 object-cover rounded-xl border" alt="" />
                          <div>
                            <p className="text-slate-900 font-black">{p.name}</p>
                            <p className="text-[10px] text-slate-300 font-bold">{p.sku}</p>
                            <p className="text-[8px] text-slate-400 mt-0.5">LOT: {p.lotNumber || 'N/A'}</p>
                          </div>
                        </td>
                        <td className="p-6 text-center">
                          <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded-lg font-black text-[9px] uppercase tracking-tighter">{p.category.split(' ')[0]}</span>
                        </td>
                        <td className="p-6 text-center bg-slate-50/50 text-lg font-black">{p.stockPurchasing}</td>
                        <td className="p-6 text-center text-lg font-black">{p.stockContent}</td>
                        <td className="p-6 text-center bg-slate-50/50 text-lg font-black">{p.stockInfluencer}</td>
                        <td className="p-6 text-center text-lg font-black">{p.stockLive}</td>
                        <td className="p-6 text-center bg-slate-50/50 text-lg font-black">{p.stockAffiliate}</td>
                        <td className="p-6 text-center text-lg font-black text-emerald-600">{p.stockBuffer}</td>
                        <td className="p-6 text-center">
                           <div className="flex items-center justify-center gap-2">
                              <button onClick={() => { setIsEditingProduct(p.id); setProductForm(p); setSubView('add_product'); }} className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center hover:bg-slate-200" title="Edit">✏️</button>
                              <button onClick={() => duplicateProduct(p)} className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center hover:bg-slate-200" title="Clone as Template">📋</button>
                           </div>
                        </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
            </div>
         </div>
      </div>
    );
  };

  const renderWarehouse = () => {
    if (warehouseSubView === 'fulfillment_history') {
      const historyOrders = filteredOrdersBySearch(orders.filter(o => o.status === 'confirmed'));
      return (
        <div className="space-y-8 animate-in fade-in">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div>
                 <h2 className="text-3xl font-black text-slate-900 tracking-tighter italic">ประวัติการเบิกและปรับจํานวนสินค้า</h2>
                 <button onClick={() => setWarehouseSubView('pending')} className="mt-2 text-blue-600 text-sm font-bold hover:underline">← กลับไปที่รายการรอเบิก</button>
              </div>
              
              <div className="relative w-full md:w-80 group">
                 <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                 </div>
                 <input 
                   type="text" 
                   placeholder="ค้นหาประวัติเบิก..." 
                   className="w-full pl-14 pr-5 py-4 bg-white border-2 border-slate-100 rounded-3xl text-sm font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 shadow-sm transition-all"
                   value={historySearchQuery}
                   onChange={(e) => setHistorySearchQuery(e.target.value)}
                 />
              </div>
          </div>

          <div className="bg-white rounded-[3rem] border shadow-sm overflow-hidden">
             <div className="overflow-x-auto">
                <table className="w-full text-left font-bold text-slate-700">
                   <thead className="bg-slate-900 text-slate-400 text-[9px] font-black uppercase tracking-widest">
                      <tr>
                        <th className="p-6 text-center w-16">#</th>
                        <th className="p-6">วันที่ยืนยัน</th>
                        <th className="p-6">เลขที่บิล</th>
                        <th className="p-6">ฝ่าย/สาขา</th>
                        <th className="p-6">รายการสินค้า</th>
                        <th className="p-6 text-center">จำนวนเดิม</th>
                        <th className="p-6 text-center text-emerald-400">เพิ่ม</th>
                        <th className="p-6 text-center text-red-400">ลด</th>
                        <th className="p-6 text-center bg-slate-800 text-white">ยอดสุทธิ</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y text-[11px]">
                      {historyOrders.map((o, oIdx) => (
                        <React.Fragment key={o.id}>
                          {o.items.map((item, idx) => {
                            const diff = item.quantity - item.originalQuantity;
                            return (
                              <tr key={`${o.id}-${idx}`} className="hover:bg-slate-50 transition-colors">
                                {idx === 0 && (
                                  <>
                                    <td className="p-6 text-center align-top text-slate-300 font-black" rowSpan={o.items.length}>{oIdx + 1}</td>
                                    <td className="p-6 align-top font-bold text-slate-400" rowSpan={o.items.length}>{new Date(o.processedAt || '').toLocaleDateString('th-TH')}</td>
                                    <td className="p-6 align-top font-black text-slate-900 uppercase" rowSpan={o.items.length}>{o.poNumber}</td>
                                    <td className="p-6 align-top" rowSpan={o.items.length}>{o.targetName || o.storeName || o.influencerName}</td>
                                  </>
                                )}
                                <td className="p-6 border-l">{item.productName}</td>
                                <td className="p-6 text-center bg-slate-50 font-black">{item.originalQuantity}</td>
                                <td className="p-6 text-center text-emerald-600 font-black">{diff > 0 ? `+${diff}` : '-'}</td>
                                <td className="p-6 text-center text-red-600 font-black">{diff < 0 ? diff : '-'}</td>
                                <td className="p-6 text-center bg-slate-900 text-white font-black text-sm">{item.quantity}</td>
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      ))}
                      {historyOrders.length === 0 && (
                        <tr>
                          <td colSpan={9} className="p-20 text-center">
                            <div className="flex flex-col items-center gap-4 opacity-30">
                               <p className="text-6xl">📜</p>
                               <p className="text-slate-400 font-black uppercase italic tracking-widest">ไม่พบประวัติการทำรายการ</p>
                            </div>
                          </td>
                        </tr>
                      )}
                   </tbody>
                </table>
             </div>
          </div>
        </div>
      );
    }

    const basePending = orders.filter(o => o.status === 'pending');
    const pending = filteredOrdersBySearch(basePending);

    return (
      <div className="space-y-8 animate-in fade-in pb-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
           <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter italic">ศูนย์จัดการคลังสินค้า (Warehouse Ops)</h2>
              <button 
                onClick={() => setWarehouseSubView('fulfillment_history')}
                className="mt-4 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl hover:scale-105 transition-all flex items-center gap-3"
              >
                  📜 ดูประวัติการเบิก
              </button>
           </div>
           
           <div className="relative w-full md:w-96 group">
              <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                 </svg>
              </div>
              <input 
                type="text" 
                placeholder="ค้นหารายการรอยืนยัน..." 
                className="w-full pl-14 pr-5 py-5 bg-white border-2 border-slate-100 rounded-[2rem] text-sm font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 shadow-sm transition-all"
                value={historySearchQuery}
                onChange={(e) => setHistorySearchQuery(e.target.value)}
              />
           </div>
        </div>
        
        <div className="grid grid-cols-1 gap-8">
          {pending.map((o, idx) => (
            <div key={o.id} className="bg-white rounded-[2.5rem] border-2 border-slate-100 shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 transition-all hover:border-blue-100 relative">
               <div className="absolute top-6 left-[-1.5rem] rotate-[-45deg] bg-blue-600 text-white px-8 py-1 font-black text-[10px] shadow-lg z-10">#{idx + 1}</div>
               <div className="p-6 pl-12 bg-slate-900 text-white flex justify-between items-center">
                  <div>
                    <h3 className="font-black text-lg italic tracking-tight uppercase">{o.poNumber}</h3>
                    <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">ID: {o.id} | SOURCE: {o.source}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Target Location</p>
                    <p className="font-black text-sm">{o.targetName || o.storeName || o.influencerName} {o.subBranch && `- ${o.subBranch}`}</p>
                  </div>
               </div>
               
               <div className="p-8">
                  <div className="space-y-4">
                      {o.items.map(item => (
                        <div key={item.productId} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-white rounded-xl border flex items-center justify-center text-xs font-black shadow-inner">
                                 {products.find(p => p.id === item.productId)?.sku.slice(-4) || 'SKU'}
                              </div>
                              <div>
                                 <p className="text-slate-900 font-black text-sm">{item.productName}</p>
                                 <p className="text-[10px] text-slate-400 font-bold">{item.sku}</p>
                                 {item.quantity !== item.originalQuantity && (
                                    <p className="text-[9px] font-black uppercase text-amber-500">Original: {item.originalQuantity}</p>
                                 )}
                              </div>
                           </div>
                           
                           <div className="flex items-center gap-4 bg-white p-2 rounded-xl border shadow-sm">
                              <button 
                                 onClick={() => adjustWarehouseOrderQty(o.id, item.productId, item.quantity - 1)}
                                 className="w-10 h-10 bg-slate-50 text-slate-900 rounded-lg flex items-center justify-center font-black hover:bg-red-50 hover:text-red-500 transition-colors"
                              >
                                 -
                              </button>
                              <input 
                                 type="number" 
                                 className="w-16 text-center font-black text-lg bg-transparent outline-none"
                                 value={item.quantity}
                                 onChange={(e) => adjustWarehouseOrderQty(o.id, item.productId, parseInt(e.target.value) || 0)}
                              />
                              <button 
                                 onClick={() => adjustWarehouseOrderQty(o.id, item.productId, item.quantity + 1)}
                                 className="w-10 h-10 bg-slate-50 text-slate-900 rounded-lg flex items-center justify-center font-black hover:bg-emerald-50 hover:text-emerald-500 transition-colors"
                              >
                                 +
                              </button>
                           </div>
                           
                           <div className="text-right min-w-[100px]">
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Subtotal</p>
                              <p className="font-black text-slate-900 italic">฿{(item.quantity * item.unitPrice).toLocaleString()}</p>
                           </div>
                        </div>
                      ))}
                  </div>
                  
                  <div className="mt-8 flex flex-col md:flex-row justify-between items-center border-t pt-8 gap-6">
                      <div className="flex items-center gap-4">
                         <div className="text-left">
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Total Order Value</p>
                            <p className="text-2xl font-black text-slate-900 italic">฿{o.totalValue.toLocaleString()}</p>
                         </div>
                      </div>
                      <div className="flex gap-3">
                         <button 
                           onClick={() => setConfirmingOrder(o)}
                           className="px-10 py-4 bg-emerald-600 text-white rounded-2xl font-black shadow-xl shadow-emerald-100 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                         >
                            ✅ ตรวจสอบและยืนยันการเบิก
                         </button>
                         <button 
                           onClick={() => updateOrderStatus(o.id, 'cancelled')}
                           className="px-6 py-4 bg-red-100 text-red-600 rounded-2xl font-black hover:bg-red-200 transition-all"
                         >
                            ยกเลิก
                         </button>
                      </div>
                  </div>
               </div>
            </div>
          ))}
          
          {pending.length === 0 && (
            <div className="p-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
               <p className="text-6xl mb-6 grayscale opacity-20">📦</p>
               <h3 className="text-2xl font-black text-slate-300 italic uppercase tracking-tighter">ไม่มีรายการรอยืนยันจากแผนกต่างๆ</h3>
               {historySearchQuery && <button onClick={() => setHistorySearchQuery('')} className="mt-4 text-blue-500 font-bold hover:underline">ล้างการค้นหา</button>}
            </div>
          )}
        </div>

        {/* Dispatch Confirmation Modal */}
        {confirmingOrder && (
          <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
             <div className="w-full max-w-lg bg-white rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-8 bg-slate-900 text-white text-center">
                   <h2 className="text-2xl font-black italic tracking-tighter uppercase mb-2">ยืนยันการปล่อยสินค้า</h2>
                   <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Warehouse Authorization Required</p>
                </div>
                
                <div className="p-10 space-y-6">
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ผู้ทำรายการ (Confirmed By)</label>
                      <select 
                        className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black outline-none focus:border-blue-500 appearance-none"
                        value={warehouseAuth.userId}
                        onChange={(e) => setWarehouseAuth({ ...warehouseAuth, userId: e.target.value })}
                      >
                         <option value="">เลือกพนักงาน...</option>
                         {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                      </select>
                   </div>
                   
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">รหัสผ่านยืนยัน (Staff Password)</label>
                      <input 
                        type="password" 
                        placeholder="••••••••"
                        className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black outline-none focus:border-blue-500"
                        value={warehouseAuth.password}
                        onChange={(e) => setWarehouseAuth({ ...warehouseAuth, password: e.target.value })}
                      />
                   </div>
                   
                   <div className="pt-4 grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => {
                           const user = users.find(u => u.id === warehouseAuth.userId);
                           if (!user || user.password !== warehouseAuth.password) {
                              alert("ข้อมูลยืนยันไม่ถูกต้อง กรุณาตรวจสอบพนักงานและรหัสผ่าน");
                              return;
                           }
                           updateOrderStatus(confirmingOrder.id, 'confirmed', user.name);
                           setConfirmingOrder(null);
                           setWarehouseAuth({ userId: '', password: '' });
                        }}
                        className="py-5 bg-emerald-600 text-white rounded-2xl font-black shadow-xl shadow-emerald-100 hover:scale-105 active:scale-95 transition-all"
                      >
                        ยืนยันการเบิก
                      </button>
                      <button 
                        onClick={() => {
                           setConfirmingOrder(null);
                           setWarehouseAuth({ userId: '', password: '' });
                        }}
                        className="py-5 bg-slate-100 text-slate-400 rounded-2xl font-black hover:bg-slate-200 transition-all"
                      >
                        ยกเลิก
                      </button>
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>
    );
  };

  const renderShipmentTracker = () => (
    <div className="space-y-8 animate-in fade-in">
       <div className="flex justify-between items-center">
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter italic">Shipment Tracker</h2>
          <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Real-time status of outgoing orders</p>
       </div>
       
       <div className="grid grid-cols-1 gap-6">
          {orders.filter(o => o.status === 'confirmed').map(o => {
            const isSelected = selectedTrackingOrderId === o.id;
            return (
              <div 
                key={o.id} 
                onClick={() => {
                   if (!isSelected) {
                     setSelectedTrackingOrderId(o.id);
                     setTempTrackingNumber(o.trackingNumber || '');
                   }
                }}
                className={`bg-white p-6 rounded-[2.5rem] border-2 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center group transition-all cursor-pointer ${isSelected ? 'border-pink-500 ring-4 ring-pink-50 shadow-xl' : 'border-transparent hover:border-blue-200'}`}
              >
                 <div className="flex items-center gap-6 w-full md:w-auto">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner border transition-all ${o.trackingNumber ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                       {o.trackingNumber ? '📦' : '🚚'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{o.poNumber}</p>
                        <span className="text-[9px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-bold uppercase">{o.source}</span>
                      </div>
                      <h4 className="text-lg font-black text-slate-800">{o.storeName || o.influencerName || o.recipientName} - {o.subBranch || 'สำนักงานใหญ่'}</h4>
                      <div className="flex items-center gap-4 mt-1">
                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Confirmed: {new Date(o.processedAt || '').toLocaleString('th-TH')}</p>
                         {o.trackingNumber && <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">Tracking: {o.trackingNumber}</p>}
                      </div>
                    </div>
                 </div>

                 <div className="mt-4 md:mt-0 w-full md:w-auto text-right">
                    {isSelected ? (
                       <div className="flex items-center gap-2 animate-in slide-in-from-right-4 duration-300" onClick={e => e.stopPropagation()}>
                          <input 
                            autoFocus
                            type="text" 
                            placeholder="ใส่เลขพัสดุ (Tracking No.)" 
                            className="p-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-black outline-none focus:border-pink-500 w-48 md:w-64"
                            value={tempTrackingNumber}
                            onChange={e => setTempTrackingNumber(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && saveTrackingNumber(o.id)}
                          />
                          <button 
                            onClick={() => saveTrackingNumber(o.id)}
                            className="px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-black hover:scale-105 transition-all shadow-lg"
                          >
                             บันทึก
                          </button>
                          <button 
                            onClick={() => setSelectedTrackingOrderId(null)}
                            className="px-4 py-3 bg-slate-100 text-slate-400 rounded-xl text-xs font-black hover:bg-slate-200 transition-all"
                          >
                             ✕
                          </button>
                       </div>
                    ) : (
                       <div className="flex flex-col items-end gap-2">
                          <span className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg ${o.trackingNumber ? 'bg-emerald-600 text-white shadow-emerald-100' : 'bg-blue-600 text-white shadow-blue-100'}`}>
                             {o.trackingNumber ? 'In Transit' : 'Out for delivery'}
                          </span>
                          <p className="text-[10px] text-slate-400 font-bold italic">คลิกที่รายการเพื่อใส่เลขพัสดุ</p>
                       </div>
                    )}
                 </div>
              </div>
            );
          })}
          {orders.filter(o => o.status === 'confirmed').length === 0 && (
             <div className="p-20 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
                <p className="text-5xl mb-4 opacity-50">🚚</p>
                <p className="text-slate-300 font-black uppercase tracking-widest italic">ยังไม่มีรายการที่กำลังจัดส่ง</p>
             </div>
          )}
       </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 pb-20 max-w-6xl mx-auto">
      <div className="flex justify-between items-end border-b pb-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter italic">System Settings & Configuration</h2>
          <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-1">Manage users, stores, and global appearance</p>
        </div>
        <button onClick={handleResetSettings} className="px-6 py-3 bg-red-50 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-red-100 hover:bg-red-100 transition-all">
          ⚠️ Factory Reset System
        </button>
      </div>

      {/* Access Policies */}
      <section className="bg-white p-10 rounded-[3rem] border shadow-sm space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center text-2xl">🛡️</div>
          <div>
            <h3 className="text-xl font-black text-slate-800">Global Access Policies</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-tight">Email Sign-up & Permissions</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
             <div>
               <p className="font-black text-slate-800 text-sm">Allow Public Email Sign-up</p>
               <p className="text-[10px] text-slate-400 font-bold uppercase">Users can register accounts via email</p>
             </div>
             <button onClick={() => setAllowRegistration(!allowRegistration)} className={`w-14 h-8 rounded-full transition-all relative ${allowRegistration ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${allowRegistration ? 'left-7' : 'left-1'}`}></div>
             </button>
           </div>
           <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
             <div>
               <p className="font-black text-slate-800 text-sm">Admin Approval Required</p>
               <p className="text-[10px] text-slate-400 font-bold uppercase">New accounts must be enabled by an admin</p>
             </div>
             <button onClick={() => setRequireApproval(!requireApproval)} className={`w-14 h-8 rounded-full transition-all relative ${requireApproval ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${requireApproval ? 'left-7' : 'left-1'}`}></div>
             </button>
           </div>
        </div>
      </section>

      {/* User Management Section */}
      <section className="bg-white p-10 rounded-[3rem] border shadow-sm space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl">👤</div>
          <div>
            <h3 className="text-xl font-black text-slate-800">Account & Permission Management</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-tight">Granular Role Assignment</p>
          </div>
        </div>
         
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-4 bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Create New Account</h4>
             <div className="space-y-3">
                <input type="text" placeholder="Full Name" className="w-full p-3 bg-white border rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500" value={newUserName} onChange={e => setNewUserName(e.target.value)} />
                <input type="email" placeholder="Email Address" className="w-full p-3 bg-white border rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} />
                <input type="password" placeholder="Password" className="w-full p-3 bg-white border rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} />
                <button onClick={handleAddUser} className="w-full py-3 bg-indigo-600 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-100 hover:scale-105 transition-all mt-2">Create User</button>
             </div>
          </div>
          <div className="lg:col-span-2 overflow-x-auto">
             <table className="w-full text-left font-bold text-sm">
                <thead>
                   <tr className="text-[10px] text-slate-400 uppercase tracking-widest border-b">
                      <th className="pb-4">User</th>
                      <th className="pb-4 text-center">Modules Allowed</th>
                      <th className="pb-4 text-right">Actions</th>
                   </tr>
                </thead>
                <tbody className="divide-y">
                   {users.map(u => (
                     <React.Fragment key={u.id}>
                       <tr className="hover:bg-slate-50/50">
                          <td className="py-4">
                             <p className="text-slate-900 font-black">{u.name}</p>
                             <p className="text-[10px] text-slate-400">{u.email}</p>
                          </td>
                          <td className="py-4 text-center">
                             <div className="flex flex-wrap justify-center gap-1">
                                {u.allowedViews.length === ALL_VIEWS.length ? <span className="bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded text-[8px]">FULL ACCESS</span> : <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded text-[8px]">{u.allowedViews.length} MODULES</span>}
                             </div>
                          </td>
                          <td className="py-4 text-right">
                             <button onClick={() => setEditingUserId(editingUserId === u.id ? null : u.id)} className="text-xs font-black text-indigo-600 hover:underline mr-4">Edit Permissions</button>
                             <button onClick={() => setUsers(users.filter(usr => usr.id !== u.id))} className="text-red-300 hover:text-red-500 transition-colors">🗑️</button>
                          </td>
                       </tr>
                       {editingUserId === u.id && (
                         <tr>
                            <td colSpan={3} className="p-8 bg-indigo-50/30 rounded-2xl animate-in slide-in-from-top-2">
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                  <div className="space-y-4">
                                     <h5 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Functional Access</h5>
                                     <div className="grid grid-cols-2 gap-2">
                                        {[
                                           { id: 'canManageAccounts', label: 'Manage Accounts' },
                                           { id: 'canCreateProducts', label: 'Create Products' },
                                           { id: 'canAdjustStock', label: 'Adjust Stock Manually' }
                                        ].map(perm => (
                                           <label key={perm.id} className="flex items-center gap-2 p-3 bg-white rounded-xl border cursor-pointer hover:border-indigo-300">
                                              <input type="checkbox" checked={u[perm.id as keyof UserAccount] as boolean} onChange={() => toggleUserPermission(u.id, perm.id as keyof UserAccount)} />
                                              <span className="text-[11px] font-bold text-slate-600">{perm.label}</span>
                                           </label>
                                        ))}
                                     </div>
                                  </div>
                                  <div className="space-y-4">
                                     <h5 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">View Access</h5>
                                     <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                        {ALL_VIEWS.map(v => (
                                           <label key={v} className="flex items-center gap-2 p-2 bg-white rounded-lg border cursor-pointer hover:border-indigo-300">
                                              <input type="checkbox" checked={u.allowedViews.includes(v)} onChange={() => toggleUserView(u.id, v)} />
                                              <span className="text-[9px] font-bold text-slate-500 truncate">{v.replace('_DEP', '')}</span>
                                           </label>
                                        ))}
                                     </div>
                                  </div>
                               </div>
                            </td>
                         </tr>
                       )}
                     </React.Fragment>
                   ))}
                </tbody>
             </table>
          </div>
        </div>
      </section>

      {/* Store & Branch Management Section */}
      <section className="bg-white p-10 rounded-[3rem] border shadow-sm space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-pink-50 text-pink-600 rounded-2xl flex items-center justify-center text-2xl">🏪</div>
          <div>
            <h3 className="text-xl font-black text-slate-800">Storefront & Branches</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-tight">Modern Trade Locations</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex flex-col justify-center items-center gap-4 border-dashed">
              <input type="text" placeholder="Store Name (e.g. Watson)" className="w-full p-4 bg-white border-2 border-slate-200 rounded-2xl text-xs font-black outline-none focus:border-pink-500" value={newStoreName} onChange={e => setNewStoreName(e.target.value)} />
              <button onClick={handleAddStore} className="w-full py-4 bg-pink-500 text-white rounded-2xl font-black text-xs shadow-xl shadow-pink-100 hover:scale-105 transition-all">+ Add Main Store</button>
           </div>
           
           {stores.map(s => (
             <div key={s.id} className="bg-white p-6 rounded-[2rem] border-2 border-slate-100 shadow-sm space-y-4 group hover:border-pink-200 transition-all">
                <div className="flex justify-between items-center">
                   <h4 className="font-black text-slate-800 italic uppercase">{s.name}</h4>
                   <button onClick={() => setStores(stores.filter(st => st.id !== s.id))} className="text-[10px] text-slate-300 hover:text-red-400">Remove</button>
                </div>
                <div className="space-y-2">
                   {s.subBranches?.map((b, idx) => (
                     <div key={idx} className="flex justify-between items-center bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 group/item">
                        <span className="text-[10px] font-bold text-slate-500">{b}</span>
                        <button onClick={() => {
                           const updated = stores.map(st => st.id === s.id ? { ...st, subBranches: st.subBranches?.filter((_, i) => i !== idx) } : st);
                           setStores(updated);
                        }} className="text-[8px] text-slate-300 opacity-0 group-hover/item:opacity-100 transition-opacity">✕</button>
                     </div>
                   ))}
                </div>
                <div className="pt-2 border-t">
                   <input 
                     type="text" 
                     placeholder="+ Add Branch" 
                     className="w-full p-2 text-[10px] font-bold outline-none border rounded bg-slate-50 focus:bg-white"
                     onKeyDown={e => {
                        if (e.key === 'Enter') {
                           handleAddBranch(s.id, (e.target as HTMLInputElement).value);
                           (e.target as HTMLInputElement).value = '';
                        }
                     }}
                   />
                </div>
             </div>
           ))}
        </div>
      </section>

      {/* Login Screen Customization */}
      <section className="bg-white p-10 rounded-[3rem] border shadow-sm space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-2xl">🖼️</div>
          <div>
            <h3 className="text-xl font-black text-slate-800">Customization</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-tight">Login Screen & UI Theming</p>
          </div>
        </div>
         
        <div className="space-y-4">
           <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Login Wallpaper URL</label>
              <div className="flex gap-4">
                 <input 
                   type="text" 
                   placeholder="https://images.unsplash.com/..." 
                   className="flex-1 p-4 bg-slate-50 border-none rounded-2xl font-bold outline-none focus:ring-2 focus:ring-blue-500"
                   value={loginWallpaper}
                   onChange={e => setLoginWallpaper(e.target.value)}
                 />
                 <button onClick={() => setLoginWallpaper('')} className="px-6 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs hover:bg-slate-200 transition-all">Clear</button>
              </div>
              <p className="text-[10px] text-slate-400 italic">Leave empty to use the default dynamic blur theme.</p>
           </div>
           
           <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center gap-2">
              <p className="text-[10px] font-black text-slate-400 uppercase">Simulate Local Upload</p>
              <input 
                type="file" 
                accept="image/*"
                className="hidden" 
                id="wallpaper-upload"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => setLoginWallpaper(reader.result as string);
                    reader.readAsDataURL(file);
                  }
                }}
              />
              <label htmlFor="wallpaper-upload" className="px-6 py-2 bg-white border rounded-xl text-xs font-bold cursor-pointer hover:bg-slate-100">Browse Files...</label>
           </div>
        </div>
         
        {loginWallpaper && (
           <div className="w-full aspect-video rounded-[2rem] overflow-hidden border-8 border-slate-50 shadow-inner group relative">
              <img src={loginWallpaper} className="w-full h-full object-cover" alt="Wallpaper Preview" />
              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                 <p className="text-white font-black text-sm italic tracking-widest">LOGIN SCREEN PREVIEW</p>
              </div>
           </div>
        )}
      </section>
    </div>
  );

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 overflow-hidden relative">
        {loginWallpaper ? (
          <img src={loginWallpaper} className="absolute inset-0 w-full h-full object-cover opacity-60 pointer-events-none scale-105 animate-pulse-slow" alt="" />
        ) : (
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-pink-500 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[120px]"></div>
          </div>
        )}
         
        <form onSubmit={handleLogin} className="w-full max-md:max-w-md bg-white/10 backdrop-blur-xl p-10 rounded-[3rem] border border-white/20 shadow-2xl space-y-8 animate-in zoom-in-95 duration-500 relative z-10 mx-auto">
          <div className="text-center">
            <h1 className="text-5xl font-black text-white italic tracking-tighter mb-2">LAGLACE</h1>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] ml-1">Master Inventory Access</p>
          </div>
          <div className="space-y-4">
            <input type="email" placeholder="EMAIL ADDRESS" className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-blue-500 transition-all font-bold placeholder:text-slate-600" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
            <div className="relative">
              <input type={showPassword ? "text" : "password"} placeholder="PASSWORD" className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-blue-500 transition-all font-bold placeholder:text-slate-600" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-5 text-slate-500">{showPassword ? '🙈' : '👁️'}</button>
            </div>
          </div>
          {loginError && <p className="text-red-400 text-xs text-center font-bold bg-red-400/10 py-3 rounded-2xl border border-red-400/20">{loginError}</p>}
          <button type="submit" className="w-full py-5 bg-white text-slate-900 rounded-2xl font-black hover:bg-blue-600 hover:text-white transition-all shadow-xl active:scale-95">AUTHORIZE ACCESS</button>
           
          {allowRegistration && (
             <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-4">
                No account? <button type="button" className="text-blue-400 hover:underline">Contact Admin to Request Access</button>
             </p>
          )}
        </form>
      </div>
    );
  }

  const isOperationView = [View.PURCHASING, View.INFLUENCER_DEP, View.LIVE_DEP, View.AFFILIATE_DEP, View.BUFFER_DEP].includes(activeView);

  return (
    <Layout activeView={activeView} setActiveView={setActiveView} currentUser={currentUser!} onLogout={() => setIsLoggedIn(false)} orders={orders}>
      <div className="pb-20">
        {activeView === View.DASHBOARD && <Dashboard orders={orders} products={products} stores={stores} influencers={influencers} users={users} setActiveView={setActiveView} />}
        {isOperationView && renderOperationModule()}
        {activeView === View.INVENTORY && renderInventory()}
        {activeView === View.WAREHOUSE && renderWarehouse()}
        {activeView === View.AI_CHAT && <AiChat products={products} orders={orders} />}
        {activeView === View.EXPORT && <ExportReports orders={orders} products={products} stores={stores} influencers={influencers} users={users} />}
        {activeView === View.NEWS_ANNOUNCEMENT && <NewsAnnouncement announcements={announcements} setAnnouncements={setAnnouncements} currentUser={currentUser!} />}
        {activeView === View.SHIPMENTS && renderShipmentTracker()}
        {activeView === View.SETTINGS && renderSettings()}
      </div>

      {notification && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] bg-slate-900/95 backdrop-blur-sm text-white px-8 py-4 rounded-3xl font-black text-xs shadow-2xl animate-in slide-in-from-bottom-8 flex items-center gap-3">
          <span className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-[10px]">✓</span>
          {notification}
        </div>
      )}
    </Layout>
  );
};

export default App;
