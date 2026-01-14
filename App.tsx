
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import AiChat from './components/AiChat';
import ExportReports from './components/ExportReports';
import NewsAnnouncement from './components/NewsAnnouncement';
import { View, UserRole, Order, Product, OrderStatus, InventoryType, Store, UserAccount, Influencer, OrderSource } from './types';
import { INITIAL_PRODUCTS, INITIAL_ORDERS, INITIAL_STORES, INITIAL_USERS, INITIAL_INFLUENCERS, USER_ROLES, ALL_VIEWS, PURCHASING_VIEWS } from './constants';
import { analyzeStockConflict } from './services/geminiService';

interface DraftItem {
  quantity: number;
}

const LEAD_TIME_OPTIONS = [
  '1 day',
  '1 week',
  '2 weeks',
  '1 month',
  '3 months',
  '7 months',
  '1 year'
];

const App: React.FC = () => {
  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginBg, setLoginBg] = useState<string | null>(null);

  const [activeView, setActiveView] = useState<View>(View.DASHBOARD);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [stores, setStores] = useState<Store[]>(INITIAL_STORES);
  const [influencers, setInfluencers] = useState<Influencer[]>(INITIAL_INFLUENCERS);
  const [users, setUsers] = useState<UserAccount[]>(INITIAL_USERS);
  
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [adminPassword] = useState('1234'); 
  const [settingsTab, setSettingsTab] = useState<'stores' | 'users' | 'system'>('stores');
  
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showAddStoreModal, setShowAddStoreModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);

  // Shipment Tracker filters
  const [shipmentSearch, setShipmentSearch] = useState('');
  const [shipmentStoreFilter, setShipmentStoreFilter] = useState('all');
  const [shipmentBranchFilter, setShipmentBranchFilter] = useState('all');
  const [shipmentStartDate, setShipmentStartDate] = useState('');
  const [shipmentEndDate, setShipmentEndDate] = useState('');

  // User Form State
  const [newUser, setNewUser] = useState<Partial<UserAccount>>({
    name: '',
    email: '',
    password: '',
    role: USER_ROLES.PURCHASING,
    allowedViews: [...PURCHASING_VIEWS]
  });

  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);

  // New Product Form State
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    images: [],
    unit: 'ชิ้น',
    category: '',
    dimensions: { l: 0, w: 0, h: 0 },
    unitPrice: 0,
    leadTime: '1 week',
    stockPurchasing: 0,
    stockInfluencer: 0,
    stockLive: 0,
    stockAffiliate: 0,
    stockBuffer: 0,
    stockContent: 0
  });

  const [isWarehouseOnlyFilter, setIsWarehouseOnlyFilter] = useState(false);
  const [isCatalogMode, setIsCatalogMode] = useState(false);
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState<string>('All');
  const [adjustments, setAdjustments] = useState<Record<string, Record<string, number>>>({}); 
  const [showConfirmModal, setShowConfirmModal] = useState<{ productId?: string, channel?: InventoryType, amount?: number, status?: OrderStatus, orderId?: string, type?: 'order' | 'stock' | 'delete_product' | 'delete_user' } | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [selectedAdjReporter, setSelectedAdjReporter] = useState('');

  const [whStatusFilter, setWhStatusFilter] = useState<OrderStatus | 'all'>('pending');
  const [whSourceFilter, setWhSourceFilter] = useState<OrderSource | 'all'>('all');
  const [whSearch, setWhSearch] = useState('');
  const [whStartDate, setWhStartDate] = useState('');
  const [whEndDate, setWhEndDate] = useState('');
  const [whStoreFilter, setWhStoreFilter] = useState('all');

  const [showReporterModal, setShowReporterModal] = useState(false);
  const [selectedReporter, setSelectedReporter] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  const [selectedStore, setSelectedStore] = useState(stores[0]?.name || '');
  const [selectedSubBranch, setSelectedSubBranch] = useState('');
  const [selectedInfluencerName, setSelectedInfluencerName] = useState(influencers[0]?.name || '');
  const [influencerFirstName, setInfluencerFirstName] = useState('');

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [draftOrder, setDraftOrder] = useState<Record<string, DraftItem>>({});
  const [processingChannel, setProcessingChannel] = useState<OrderSource>('purchasing');

  // Load from local storage on mount
  useEffect(() => {
    const savedUsers = localStorage.getItem('laglace_users');
    const savedProducts = localStorage.getItem('laglace_products');
    const savedOrders = localStorage.getItem('laglace_orders');
    const savedBg = localStorage.getItem('laglace_login_bg');
    
    if (savedUsers) setUsers(JSON.parse(savedUsers));
    if (savedProducts) setProducts(JSON.parse(savedProducts));
    if (savedOrders) setOrders(JSON.parse(savedOrders));
    if (savedBg) setLoginBg(savedBg);
  }, []);

  // Save to local storage when changed
  useEffect(() => {
    localStorage.setItem('laglace_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('laglace_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('laglace_orders', JSON.stringify(orders));
  }, [orders]);

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setLoginBg(base64String);
        localStorage.setItem('laglace_login_bg', base64String);
        setNotification("📸 อัปเดตภาพพื้นหลังหน้า Login สำเร็จ");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetBg = () => {
    setLoginBg(null);
    localStorage.removeItem('laglace_login_bg');
    setNotification("📸 รีเซ็ตภาพพื้นหลังเป็นค่าเริ่มต้นสำเร็จ");
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const user = users.find(u => u.email === loginEmail && u.password === loginPassword);
    if (user) {
      setCurrentUser(user);
      setIsLoggedIn(true);
      setSelectedAdjReporter(user.name);
      setSelectedReporter(user.name);
      setActiveView(user.allowedViews.includes(View.DASHBOARD) ? View.DASHBOARD : user.allowedViews[0]);
    } else {
      setLoginError('Invalid email or password. Please try again.');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setLoginEmail('');
    setLoginPassword('');
    setShowPassword(false);
  };

  const categories = useMemo(() => {
    const cats = products.map(p => p.category).filter(c => c && c.trim() !== '');
    return ['All', ...Array.from(new Set(cats))];
  }, [products]);

  const filteredInventoryProducts = useMemo(() => {
    let result = products;
    if (inventoryCategoryFilter !== 'All') {
      result = result.filter(p => p.category === inventoryCategoryFilter);
    }
    if (isWarehouseOnlyFilter) {
      result = result.filter(p => p.stockBuffer > 0);
    }
    return result;
  }, [products, inventoryCategoryFilter, isWarehouseOnlyFilter]);

  const filteredPurchasingProducts = useMemo(() => {
    if (selectedCategory === 'All') return products;
    return products.filter(p => p.category === selectedCategory);
  }, [products, selectedCategory]);

  const filteredWarehouseOrders = useMemo(() => {
    return orders.filter(o => {
      const matchStatus = whStatusFilter === 'all' || o.status === whStatusFilter;
      const matchSource = whSourceFilter === 'all' || o.source === whSourceFilter;
      const matchSearch = whSearch === '' || 
        o.productName.toLowerCase().includes(whSearch.toLowerCase()) ||
        o.productId.toLowerCase().includes(whSearch.toLowerCase()) ||
        (o.storeName?.toLowerCase().includes(whSearch.toLowerCase()) ?? false) ||
        (o.influencerName?.toLowerCase().includes(whSearch.toLowerCase()) ?? false);
      const orderDate = new Date(o.requestedAt).toISOString().split('T')[0];
      const matchStart = !whStartDate || orderDate >= whStartDate;
      const matchEnd = !whEndDate || orderDate <= whEndDate;
      const matchStore = whStoreFilter === 'all' || o.storeName === whStoreFilter;
      return matchStatus && matchSource && matchSearch && matchStart && matchEnd && matchStore;
    });
  }, [orders, whStatusFilter, whSourceFilter, whSearch, whStartDate, whEndDate, whStoreFilter]);

  const groupedWarehouseOrders = useMemo(() => {
    const groups: Record<string, {
      title: string;
      subTitle: string;
      date: string;
      time: string;
      source: OrderSource;
      orders: Order[];
    }> = {};

    filteredWarehouseOrders.forEach(o => {
      const dateObj = new Date(o.requestedAt);
      const dateStr = dateObj.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: '2-digit' });
      const timeStr = dateObj.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
      const mainKey = o.storeName || o.influencerName || 'Unspecified';
      const subKey = o.subBranch || '-';
      const groupKey = `${mainKey}|${subKey}|${o.requestedAt}`;

      if (!groups[groupKey]) {
        groups[groupKey] = {
          title: mainKey,
          subTitle: subKey,
          date: dateStr,
          time: timeStr,
          source: o.source,
          orders: []
        };
      }
      groups[groupKey].orders.push(o);
    });

    return Object.values(groups).sort((a, b) => new Date(b.orders[0].requestedAt).getTime() - new Date(a.orders[0].requestedAt).getTime());
  }, [filteredWarehouseOrders]);

  /* Filter and group confirmed orders for Shipment Tracker view */
  const confirmedMtGroups = useMemo(() => {
    const filtered = orders.filter(o => {
      const isConfirmed = o.status === 'confirmed';
      const matchSearch = shipmentSearch === '' || 
        o.productName.toLowerCase().includes(shipmentSearch.toLowerCase()) ||
        o.id.toLowerCase().includes(shipmentSearch.toLowerCase());
      const matchStore = shipmentStoreFilter === 'all' || o.storeName === shipmentStoreFilter || o.influencerName === shipmentStoreFilter;
      const matchBranch = shipmentBranchFilter === 'all' || o.subBranch === shipmentBranchFilter;
      const orderDate = new Date(o.requestedAt).toISOString().split('T')[0];
      const matchStart = !shipmentStartDate || orderDate >= shipmentStartDate;
      const matchEnd = !shipmentEndDate || orderDate <= shipmentEndDate;
      
      return isConfirmed && matchSearch && matchStore && matchBranch && matchStart && matchEnd;
    });

    const groups: Record<string, {
      title: string;
      subTitle: string;
      date: string;
      time: string;
      source: OrderSource;
      trackingNumber?: string;
      orders: Order[];
    }> = {};

    filtered.forEach(o => {
      const dateObj = new Date(o.requestedAt);
      const dateStr = dateObj.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: '2-digit' });
      const timeStr = dateObj.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
      const mainKey = o.storeName || o.influencerName || 'Unspecified';
      const subKey = o.subBranch || '-';
      const groupKey = `${mainKey}|${subKey}|${o.requestedAt}`;

      if (!groups[groupKey]) {
        groups[groupKey] = {
          title: mainKey,
          subTitle: subKey,
          date: dateStr,
          time: timeStr,
          source: o.source,
          trackingNumber: o.trackingNumber,
          orders: []
        };
      }
      groups[groupKey].orders.push(o);
    });

    return Object.values(groups).sort((a, b) => new Date(b.orders[0].requestedAt).getTime() - new Date(a.orders[0].requestedAt).getTime());
  }, [orders, shipmentSearch, shipmentStoreFilter, shipmentBranchFilter, shipmentStartDate, shipmentEndDate]);

  const stockSummary = useMemo(() => {
    return products.reduce((acc, p) => ({
      purchasing: acc.purchasing + (p.stockPurchasing || 0),
      influencer: acc.influencer + (p.stockInfluencer || 0),
      live: acc.live + (p.stockLive || 0),
      affiliate: acc.affiliate + (p.stockAffiliate || 0),
      buffer: acc.buffer + (p.stockBuffer || 0),
      total: acc.total + (p.stockPurchasing || 0) + (p.stockInfluencer || 0) + (p.stockLive || 0) + (p.stockAffiliate || 0) + (p.stockBuffer || 0)
    }), { purchasing: 0, influencer: 0, live: 0, affiliate: 0, buffer: 0, total: 0 });
  }, [products]);

  const deptHistory = useMemo(() => {
    let source: OrderSource;
    switch(activeView) {
      case View.INFLUENCER_DEP: source = 'influencer'; break;
      case View.LIVE_DEP: source = 'live'; break;
      case View.AFFILIATE_DEP: source = 'affiliate'; break;
      case View.BUFFER_DEP: source = 'buffer'; break;
      default: source = 'purchasing';
    }
    return orders.filter(o => o.source === source).sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
  }, [orders, activeView]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const currentStoreData = useMemo(() => {
    return stores.find(s => s.name === selectedStore);
  }, [stores, selectedStore]);

  const handleUpdateOrderStatus = (orderId: string, status: OrderStatus) => {
    setShowConfirmModal({ orderId, status, type: 'order' });
    setPasswordInput('');
    setPasswordError(false);
  };

  const handleUpdateTrackingNumberForGroup = (orderIds: string[], value: string) => {
    setOrders(prev => prev.map(o => orderIds.includes(o.id) ? { ...o, trackingNumber: value } : o));
  };

  const handleUpdateWarehouseNote = (orderId: string, value: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, warehouseNote: value } : o));
  };

  const handleWhQuantityChange = (orderId: string, delta: number) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return { ...o, quantity: Math.max(0, o.quantity + delta) };
      }
      return o;
    }));
  };

  const handleBulkConfirm = () => {
    const pending = orders.filter(o => o.status === 'pending');
    if (pending.length === 0) return;
    setShowConfirmModal({ status: 'confirmed', type: 'order' }); 
    setPasswordInput('');
    setPasswordError(false);
  };

  const fetchAiAnalysis = async () => {
    setIsAiLoading(true);
    try {
      const result = await analyzeStockConflict(orders, products);
      alert(result);
    } catch (error) {
      console.error("Error fetching AI analysis:", error);
      setNotification("❌ ไม่สามารถวิเคราะห์สต็อกได้ในขณะนี้");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleVerifyPassword = () => {
    if (passwordInput === adminPassword) {
      if (showConfirmModal?.type === 'order') {
        if (showConfirmModal.orderId) {
          const { orderId, status } = showConfirmModal;
          setOrders(prev => prev.map(order => {
            if (order.id === orderId) {
              if (status === 'confirmed') {
                setProducts(currProducts => currProducts.map(p => {
                  if (p.id === order.productId) {
                    const fieldMap: Record<OrderSource, keyof Product> = {
                      influencer: 'stockInfluencer',
                      purchasing: 'stockPurchasing',
                      live: 'stockLive',
                      affiliate: 'stockAffiliate',
                      buffer: 'stockBuffer'
                    };
                    const field = fieldMap[order.source];
                    return { ...p, [field]: Math.max(0, (p[field] as number) - order.quantity) };
                  }
                  return p;
                }));
              }
              return { ...order, status: status!, processedAt: new Date().toISOString() };
            }
            return order;
          }));
        } else if (showConfirmModal.status === 'confirmed') {
          let tempProducts = [...products];
          const updatedOrders = orders.map(order => {
            if (order.status === 'pending') {
              const productIndex = tempProducts.findIndex(p => p.id === order.productId);
              if (productIndex !== -1) {
                const product = tempProducts[productIndex];
                const fieldMap: Record<OrderSource, keyof Product> = {
                  influencer: 'stockInfluencer',
                  purchasing: 'stockPurchasing',
                  live: 'stockLive',
                  affiliate: 'stockAffiliate',
                  buffer: 'stockBuffer'
                    };
                const field = fieldMap[order.source];
                const availableStock = product[field] as number;
                if (availableStock >= order.quantity) {
                  const updatedProduct = { ...product };
                  (updatedProduct[field] as number) -= order.quantity;
                  tempProducts[productIndex] = updatedProduct;
                  return { ...order, status: 'confirmed' as OrderStatus, processedAt: new Date().toISOString() };
                }
              }
            }
            return order;
          });
          setOrders(updatedOrders);
          setProducts(tempProducts);
          setNotification(`✅ ยืนยันสต็อกสำเร็จ`);
        }
      } else if (showConfirmModal?.type === 'stock' && showConfirmModal.productId && showConfirmModal.channel) {
        const { productId, channel, amount } = showConfirmModal;
        setProducts(prev => prev.map(p => {
          if (p.id === productId) {
            const fieldMap: Record<InventoryType, keyof Product> = {
              [InventoryType.PURCHASING]: 'stockPurchasing',
              [InventoryType.CONTENT]: 'stockContent',
              [InventoryType.INFLUENCERS]: 'stockInfluencer',
              [InventoryType.LIVE]: 'stockLive',
              [InventoryType.AFFILIATE]: 'stockAffiliate',
              [InventoryType.BUFFER]: 'stockBuffer',
              [InventoryType.OVERALL]: 'stockBuffer'
            };
            const field = fieldMap[channel!];
            return { ...p, [field]: Math.max(0, (p[field] as number) + amount!) };
          }
          return p;
        }));
        
        setAdjustments(prev => { 
          const next = { ...prev };
          if (next[productId!]) delete next[productId!][channel!];
          return next;
        });
        setNotification(`✅ ปรับปรุงสต็อก ${channel === InventoryType.BUFFER ? 'Buffer Stock Warehouse' : channel} โดยคุณ ${selectedAdjReporter} สำเร็จ (+/- ${amount})`);
      } else if (showConfirmModal?.type === 'delete_product' && showConfirmModal.productId) {
        setProducts(prev => prev.filter(p => p.id !== showConfirmModal.productId));
        setNotification(`🗑️ ลบสินค้าออกจากระบบสำเร็จ`);
      } else if (showConfirmModal?.type === 'delete_user' && showConfirmModal.orderId) {
        setUsers(prev => prev.filter(u => u.id !== showConfirmModal.orderId));
        setNotification(`🗑️ ลบผู้ใช้งานสำเร็จ`);
      }
      setShowConfirmModal(null); setPasswordInput(''); setPasswordError(false);
    } else setPasswordError(true);
  };

  const updateAdjustmentValue = (productId: string, channel: string, value: string) => {
    const num = parseInt(value) || 0;
    setAdjustments(prev => ({
      ...prev,
      [productId]: {
        ...(prev[productId] || {}),
        [channel]: num
      }
    }));
  };

  const initiateAdjustment = (productId: string, channel: InventoryType) => {
    const amount = adjustments[productId]?.[channel] || 0;
    if (amount === 0) {
      alert("กรุณาระบุจำนวนที่ต้องการปรับปรุง (เช่น +10 หรือ -5)");
      return;
    }
    setShowConfirmModal({ productId, channel, amount, type: 'stock' }); 
    setPasswordInput(''); 
    setPasswordError(false);
  };

  const initiateDeleteProduct = (productId: string) => {
    setShowConfirmModal({ productId, type: 'delete_product' });
    setPasswordInput('');
    setPasswordError(false);
  };

  const initiateDeleteUser = (userId: string) => {
    setShowConfirmModal({ orderId: userId, type: 'delete_user' });
    setPasswordInput('');
    setPasswordError(false);
  };

  const incrementDraft = (productId: string, amount: number) => {
    setDraftOrder(prev => {
      const current = prev[productId]?.quantity || 0;
      const newQty = Math.max(0, current + amount);
      if (newQty === 0) {
        const next = { ...prev };
        delete next[productId];
        return next;
      }
      return { ...prev, [productId]: { quantity: newQty } };
    });
  };

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.sku) {
      alert("กรุณาระบุชื่อสินค้าและ SKU");
      return;
    }

    const p: Product = {
      id: `P${Math.floor(Math.random() * 900) + 100}`,
      sku: newProduct.sku,
      name: newProduct.name,
      unit: newProduct.unit || 'ชิ้น',
      category: newProduct.category || 'ทั่วไป',
      description: newProduct.description,
      barcode13: newProduct.barcode13,
      barcodeMT: newProduct.barcodeMT,
      images: newProduct.images?.length ? newProduct.images : ['https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=300'],
      weight: newProduct.weight,
      dimensions: newProduct.dimensions as any,
      productionDate: newProduct.productionDate,
      expirationDate: newProduct.expirationDate,
      unitPrice: newProduct.unitPrice || 0,
      leadTime: newProduct.leadTime || '1 week',
      stockPurchasing: newProduct.stockPurchasing || 0,
      stockContent: newProduct.stockContent || 0,
      stockInfluencer: newProduct.stockInfluencer || 0,
      stockLive: newProduct.stockLive || 0,
      stockAffiliate: newProduct.stockAffiliate || 0,
      stockBuffer: newProduct.stockBuffer || 0
    };

    setProducts(prev => [...prev, p]);
    setShowAddProductModal(false);
    setNewProduct({
      images: [],
      unit: 'ชิ้น',
      category: '',
      dimensions: { l: 0, w: 0, h: 0 },
      unitPrice: 0,
      leadTime: '1 week',
      stockPurchasing: 0,
      stockInfluencer: 0,
      stockLive: 0,
      stockAffiliate: 0,
      stockBuffer: 0,
      stockContent: 0
    });
    setNotification("✨ เพิ่มสินค้าใหม่เข้าระบบสำเร็จ");
  };

  const handleAddUser = () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      alert("Please fill in all required fields.");
      return;
    }
    
    const isWarehouseRole = newUser.role === USER_ROLES.WAREHOUSE || newUser.role === USER_ROLES.ADMIN;

    const u: UserAccount = {
      id: `U${Date.now()}`,
      name: newUser.name,
      email: newUser.email,
      password: newUser.password,
      role: newUser.role || USER_ROLES.PURCHASING,
      canManageAccounts: newUser.role === USER_ROLES.ADMIN,
      canCreateProducts: isWarehouseRole,
      canAdjustStock: isWarehouseRole,
      allowedViews: newUser.allowedViews || (isWarehouseRole ? ALL_VIEWS : PURCHASING_VIEWS)
    };

    setUsers(prev => [...prev, u]);
    setShowAddUserModal(false);
    setNewUser({
      name: '',
      email: '',
      password: '',
      role: USER_ROLES.PURCHASING,
      allowedViews: [...PURCHASING_VIEWS]
    });
    setNotification("👤 สร้างบัญชีผู้ใช้งานใหม่สำเร็จ");
  };

  const handleSaveEditUser = () => {
    if (!editingUser) return;
    if (!editingUser.name || !editingUser.email || !editingUser.password) {
      alert("Please fill in all required fields.");
      return;
    }

    setUsers(prev => prev.map(u => u.id === editingUser.id ? editingUser : u));
    
    if (currentUser && editingUser.id === currentUser.id) {
      setCurrentUser(editingUser);
    }

    setShowEditUserModal(false);
    setEditingUser(null);
    setNotification("👤 อัปเดตข้อมูลผู้ใช้งานสำเร็จ");
  };

  const submitBatchOrders = () => {
    const isInfluencerSource = activeView === View.INFLUENCER_DEP;
    const isLiveSource = activeView === View.LIVE_DEP;
    const isAffiliateSource = activeView === View.AFFILIATE_DEP;
    const isBufferSource = activeView === View.BUFFER_DEP;

    let finalSource: OrderSource = processingChannel;
    if (isInfluencerSource) finalSource = 'influencer';
    else if (isLiveSource) finalSource = 'live';
    else if (isAffiliateSource) finalSource = 'affiliate';
    else if (isBufferSource) finalSource = 'buffer';

    const timestamp = new Date().toISOString();
    const newOrdersList: Order[] = (Object.entries(draftOrder) as [string, DraftItem][]).map(([productId, item]): Order => {
      const product = products.find(p => p.id === productId);
      return {
        id: `ORD-${Math.floor(Math.random() * 9000) + 1000}`,
        source: finalSource,
        storeName: isInfluencerSource ? undefined : selectedStore,
        subBranch: isInfluencerSource ? undefined : selectedSubBranch,
        influencerName: isInfluencerSource ? selectedInfluencerName : undefined,
        productId: productId,
        productName: product?.name || 'Unknown',
        requestedQuantity: item.quantity,
        quantity: item.quantity,
        status: 'pending' as OrderStatus,
        requestedAt: timestamp,
        purchasingDept: selectedReporter
      };
    });
    setOrders(prev => [...newOrdersList, ...prev]);
    setDraftOrder({});
    setShowReporterModal(false);
    setNotification(`✅ ส่งใบจองสต็อกสำเร็จ ${newOrdersList.length} รายการ`);
  };

  const changeView = (view: View, topicId?: number) => {
    setActiveView(view);
    if (view === View.NEWS_ANNOUNCEMENT && topicId) {
      setTimeout(() => {
        const element = document.getElementById(`news-topic-${topicId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  };

  // If not logged in, show the login screen
  if (!isLoggedIn || !currentUser) {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-6 overflow-hidden">
         {/* Background Layer */}
         <div 
           className="absolute inset-0 bg-slate-900 z-0 transition-all duration-700" 
           style={loginBg ? {
             backgroundImage: `url(${loginBg})`,
             backgroundSize: 'cover',
             backgroundPosition: 'center'
           } : {}}
         />
         
         {/* Overlay Layer for Readability */}
         <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] z-10" />

         <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl animate-in zoom-in duration-500 relative z-20">
            <div className="text-center mb-10">
               <h1 className="text-3xl font-black text-pink-500 flex items-center justify-center gap-3 mb-2">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
                    <path d="m3.3 7 8.7 5 8.7-5"/>
                    <path d="M12 22V12"/>
                 </svg>
                 LAGLACE
               </h1>
               <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Stock Management Portal</p>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-6">
               <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Work Email</label>
                  <input 
                    type="email" 
                    placeholder="name@laglace.com"
                    className="w-full p-4 bg-slate-50 border rounded-2xl text-sm font-bold text-black focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    required
                  />
               </div>
               <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Security Key</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      placeholder="••••••••"
                      className="w-full p-4 bg-slate-50 border rounded-2xl text-sm font-bold text-black focus:ring-4 focus:ring-blue-50 outline-none transition-all pr-12"
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      required
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.774 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        </svg>
                      )}
                    </button>
                  </div>
               </div>

               {loginError && (
                 <div className="bg-red-50 text-red-500 text-[10px] font-black uppercase tracking-widest p-3 rounded-xl text-center border border-red-100">
                    {loginError}
                 </div>
               )}

               <button 
                 type="submit"
                 className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black text-sm shadow-xl shadow-slate-200 hover:translate-y-[-2px] transition-all active:scale-95"
               >
                 Authorize & Access
               </button>
            </form>

            <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col items-center gap-2">
               <p className="text-[10px] text-slate-400 font-bold">LAGLACE CO., LTD. &copy; 2024</p>
               <p className="text-[9px] text-slate-300">Unauthorized access is strictly prohibited.</p>
            </div>
         </div>
      </div>
    );
  }

  const renderView = () => {
    switch (activeView) {
      case View.DASHBOARD: return <Dashboard orders={orders} products={products} stores={stores} influencers={influencers} users={users} setActiveView={setActiveView} />;
      case View.AI_CHAT: return <AiChat products={products} orders={orders} />;
      case View.EXPORT: return <ExportReports orders={orders} products={products} stores={stores} influencers={influencers} users={users} />;
      case View.NEWS_ANNOUNCEMENT: return <NewsAnnouncement />;
      
      case View.SHIPMENTS:
        return (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-800">Tracking Dispatched Items</h2>
                <p className="text-xs text-slate-400">ตรวจสอบเลขพัสดุและสถานะการจัดส่งแยกตามกลุ่มใบสั่งซื้อ</p>
              </div>
              <div className="bg-pink-50 border border-pink-100 px-6 py-3 rounded-2xl flex items-center gap-4">
                <div className="text-right">
                  <p className="text-[9px] font-black text-pink-400 uppercase tracking-widest">MT Total Dispatched</p>
                  <p className="text-xl font-black text-pink-600">{orders.filter(o => o.status === 'confirmed').reduce((s,o) => s+o.quantity, 0).toLocaleString()} <span className="text-[10px]">Units</span></p>
                </div>
                <div className="w-px h-8 bg-pink-100"></div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-pink-400 uppercase tracking-widest">Total Market Value</p>
                  <p className="text-xl font-black text-pink-600">฿{orders.filter(o => o.status === 'confirmed').reduce((s,o) => s + (o.quantity * (products.find(p => p.id === o.productId)?.unitPrice || 0)), 0).toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[2rem] border shadow-sm grid grid-cols-1 md:grid-cols-5 gap-4">
               <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1 tracking-widest">Search Order ID</label>
                  <input 
                    type="text" 
                    placeholder="ค้นหารหัสรายการ..." 
                    className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold outline-none border-slate-100 focus:border-pink-300"
                    value={shipmentSearch}
                    onChange={e => setShipmentSearch(e.target.value)}
                  />
               </div>
               <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1 tracking-widest">หน้าร้าน / Identity</label>
                  <select 
                    className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold outline-none border-slate-100"
                    value={shipmentStoreFilter}
                    onChange={e => {
                      setShipmentStoreFilter(e.target.value);
                      setShipmentBranchFilter('all');
                    }}
                  >
                    <option value="all">ทุกร้านค้า/Influencer</option>
                    <optgroup label="Modern Trade">
                      {stores.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </optgroup>
                    <optgroup label="Influencers">
                      {influencers.map(inf => <option key={inf.id} value={inf.name}>{inf.name}</option>)}
                    </optgroup>
                  </select>
               </div>
               <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1 tracking-widest">สาขา (Sub Branch)</label>
                  <select 
                    className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold outline-none border-slate-100"
                    value={shipmentBranchFilter}
                    onChange={e => setShipmentBranchFilter(e.target.value)}
                    disabled={shipmentStoreFilter === 'all'}
                  >
                    <option value="all">ทุกสาขา</option>
                    {stores.find(s => s.name === shipmentStoreFilter)?.subBranches?.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                    {shipmentStoreFilter !== 'all' && !stores.find(s => s.name === shipmentStoreFilter) && <option value="อื่นๆ">อื่นๆ</option>}
                  </select>
               </div>
               <div className="md:col-span-2">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1 tracking-widest">ช่วงวันที่จัดส่ง</label>
                  <div className="flex gap-2">
                    <input type="date" className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold outline-none border-slate-100" value={shipmentStartDate} onChange={e => setShipmentStartDate(e.target.value)} />
                    <input type="date" className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold outline-none border-slate-100" value={shipmentEndDate} onChange={e => setShipmentEndDate(e.target.value)} />
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
               {confirmedMtGroups.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                    <p className="text-slate-400 font-black uppercase tracking-widest">No matching shipments found</p>
                  </div>
               ) : confirmedMtGroups.map((group, idx) => {
                 const orderIds = group.orders.map(o => o.id);
                 return (
                  <div key={idx} className="bg-white rounded-[2.5rem] border shadow-sm overflow-hidden transition-all hover:shadow-md border-t-8 border-t-pink-500 animate-in fade-in slide-in-from-bottom-4">
                    <div className="bg-slate-50 p-6 border-b flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                           <div className="flex items-center gap-3 mb-1">
                              <h3 className="text-xl font-black text-slate-800 tracking-tight">{group.title}</h3>
                              <span className="bg-white border border-slate-200 px-2 py-0.5 rounded text-[10px] font-black text-slate-400">{group.orders.length} Items</span>
                           </div>
                           <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                              📍 {group.subTitle} | 📅 {group.date} | ⏰ {group.time}
                           </p>
                        </div>
                        <div className="flex-1 max-w-md w-full">
                           <label className="block text-[10px] font-black text-pink-600 uppercase mb-1.5 tracking-widest text-right">เลขพัสดุขนส่ง (Tracking Number)</label>
                           <input 
                              type="text" 
                              placeholder="กรอกเลขพัสดุสำหรับรอบจัดส่งนี้..." 
                              className="w-full p-3.5 bg-white border-2 border-pink-100 rounded-2xl text-right font-black text-slate-800 focus:border-pink-500 focus:ring-4 focus:ring-pink-50 outline-none transition-all shadow-sm"
                              value={group.trackingNumber || ''}
                              onChange={(e) => handleUpdateTrackingNumberForGroup(orderIds, e.target.value)}
                           />
                        </div>
                    </div>

                    <div className="p-0 overflow-x-auto">
                       <table className="w-full text-left">
                          <thead className="bg-slate-100/50 border-b text-[9px] font-black text-slate-400 uppercase tracking-widest">
                             <tr>
                                <th className="px-8 py-3">Product Description</th>
                                <th className="px-8 py-3 text-center">รหัสรายการ (Order ID)</th>
                                <th className="px-8 py-3 text-center">Qty Sent</th>
                                <th className="px-8 py-3">หมายเหตุ (Notes)</th>
                                <th className="px-8 py-3 text-right">Total Value</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y text-xs font-bold text-slate-700">
                             {group.orders.map(o => {
                                const product = products.find(p => p.id === o.productId);
                                const totalValue = o.quantity * (product?.unitPrice || 0);
                                return (
                                   <tr key={o.id} className="hover:bg-slate-50/30 transition-colors">
                                      <td className="px-8 py-4">
                                         <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-slate-50 border overflow-hidden flex-shrink-0">
                                               <img src={product?.images[0]} className="w-full h-full object-cover" alt="" />
                                            </div>
                                            <div>
                                               <p className="text-slate-900 font-black">{o.productName}</p>
                                               <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">SKU: {product?.sku}</p>
                                            </div>
                                         </div>
                                      </td>
                                      <td className="px-8 py-4 text-center">
                                         <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-[10px] font-black border border-blue-100">#{o.id}</span>
                                      </td>
                                      <td className="px-8 py-4 text-center">
                                         <span className="bg-slate-900 text-white px-3 py-1 rounded-full text-[10px] font-black">{o.quantity}</span>
                                      </td>
                                      <td className="px-8 py-4">
                                         <input 
                                           type="text" 
                                           placeholder="พิมพ์หมายเหตุ..." 
                                           className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-slate-200 outline-none transition-all"
                                           value={o.warehouseNote || ''}
                                           onChange={(e) => handleUpdateWarehouseNote(o.id, e.target.value)}
                                         />
                                      </td>
                                      <td className="px-8 py-4 text-right font-black text-slate-900">฿{totalValue.toLocaleString()}</td>
                                   </tr>
                                );
                             })}
                             <tr className="bg-slate-50/50">
                                <td colSpan={4} className="px-8 py-4 text-right text-[10px] font-black uppercase text-slate-400 tracking-widest">Shipment Total Market Value</td>
                                <td className="px-8 py-4 text-right font-black text-lg text-pink-600">
                                   ฿{group.orders.reduce((sum, o) => {
                                      const p = products.find(prod => prod.id === o.productId);
                                      return sum + (o.quantity * (p?.unitPrice || 0));
                                   }, 0).toLocaleString()}
                                </td>
                             </tr>
                          </tbody>
                       </table>
                    </div>
                  </div>
                 );
               })}
            </div>
          </div>
        );

      case View.INVENTORY: return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
               <div className="bg-blue-50/50 p-5 rounded-3xl border border-blue-100">
                  <p className="text-[10px] font-black text-blue-400 uppercase mb-1">Purchasing</p>
                  <p className="text-xl font-black text-blue-700">{stockSummary.purchasing.toLocaleString()}</p>
               </div>
               <div className="bg-purple-50/50 p-5 rounded-3xl border border-purple-100">
                  <p className="text-[10px] font-black text-purple-400 uppercase mb-1">Influencer</p>
                  <p className="text-xl font-black text-purple-700">{stockSummary.influencer.toLocaleString()}</p>
               </div>
               <div className="bg-red-50/50 p-5 rounded-3xl border border-red-100">
                  <p className="text-[10px] font-black text-red-400 uppercase mb-1">Live</p>
                  <p className="text-xl font-black text-red-700">{stockSummary.live.toLocaleString()}</p>
               </div>
               <div className="bg-emerald-50/50 p-5 rounded-3xl border border-emerald-100">
                  <p className="text-[10px] font-black text-emerald-400 uppercase mb-1">Affiliate</p>
                  <p className="text-xl font-black text-emerald-700">{stockSummary.affiliate.toLocaleString()}</p>
               </div>
               <div className="bg-slate-50/50 p-5 rounded-3xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Buffer Stock Warehouse</p>
                  <p className="text-xl font-black text-slate-700">{stockSummary.buffer.toLocaleString()}</p>
               </div>
               <div className="bg-white p-5 rounded-3xl border shadow-sm ring-1 ring-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Total Overall</p>
                  <p className="text-xl font-black text-black">{stockSummary.total.toLocaleString()}</p>
               </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
              <div className="p-6 border-b flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                  <div>
                    <h3 className="font-black text-slate-800">{isCatalogMode ? 'จัดการรายการสินค้า (Catalog)' : 'จัดการสต็อก (Warehouse Logic)'}</h3>
                    <p className="text-xs text-slate-400">{isCatalogMode ? 'เพิ่ม ลบ และแก้ไขข้อมูลทางเทคนิคของสินค้า' : 'ระบุจำนวนที่ต้องการปรับปรุงยอดสต็อกแต่ละประเภท'}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                   {!isCatalogMode && (
                     <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border">
                        <input 
                          type="checkbox" 
                          id="wh-only" 
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                          checked={isWarehouseOnlyFilter}
                          onChange={e => setIsWarehouseOnlyFilter(e.target.checked)}
                        />
                        <label htmlFor="wh-only" className="text-xs font-black text-slate-600 uppercase">Buffer Stock Only</label>
                      </div>
                   )}
                   <select value={inventoryCategoryFilter} onChange={e => setInventoryCategoryFilter(e.target.value)} className="p-2.5 bg-slate-50 border rounded-xl text-xs font-bold outline-none">
                      {categories.map(c => <option key={c} value={c}>{c === 'All' ? 'ทุกหมวดหมู่' : c}</option>)}
                   </select>
                   <button 
                    onClick={() => setIsCatalogMode(!isCatalogMode)}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all ${isCatalogMode ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                   >
                     {isCatalogMode ? 'กลับไปที่สต็อก' : 'จัดการ Catalog'}
                   </button>
                   {isCatalogMode && (
                     <button onClick={() => setShowAddProductModal(true)} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black">+ เพิ่มสินค้า</button>
                   )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  {isCatalogMode ? (
                    <>
                      <thead className="bg-slate-50 text-slate-400 uppercase font-black text-[9px] border-b">
                        <tr>
                          <th className="px-6 py-4">ข้อมูลสินค้า</th>
                          <th className="px-6 py-4 text-center">Market Price</th>
                          <th className="px-6 py-4 text-center">Lead Time</th>
                          <th className="px-6 py-4">SKU / Barcodes</th>
                          <th className="px-6 py-4">Description</th>
                          <th className="px-6 py-4 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y text-[11px] font-bold">
                        {filteredInventoryProducts.map(p => (
                          <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4">
                               <div className="flex items-center gap-3">
                                  <img src={p.images[0]} className="w-12 h-12 rounded-lg object-cover border" alt="" />
                                  <div>
                                     <p className="text-[12px] font-black text-slate-800">{p.name}</p>
                                     <p className="text-[9px] text-blue-500 font-bold uppercase">{p.category} | {p.unit}</p>
                                  </div>
                               </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                               <p className="text-slate-800">฿{p.unitPrice?.toLocaleString() || 0}</p>
                            </td>
                            <td className="px-6 py-4 text-center">
                               <p className="text-pink-500 font-black uppercase tracking-tighter">{p.leadTime || 'N/A'}</p>
                            </td>
                            <td className="px-6 py-4">
                               <p className="text-slate-700">SKU: {p.sku}</p>
                               <p className="text-[9px] text-slate-400">MT: {p.barcodeMT || '-'}</p>
                            </td>
                            <td className="px-6 py-4 max-w-xs">
                               <p className="text-slate-500 line-clamp-2">{p.description || 'ไม่มีคำอธิบาย'}</p>
                            </td>
                            <td className="px-6 py-4 text-center">
                               <button onClick={() => initiateDeleteProduct(p.id)} className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                               </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </>
                  ) : (
                    <>
                      <thead className="bg-slate-50 text-slate-400 uppercase font-black text-[9px] border-b">
                        <tr>
                          <th className="px-6 py-4">สินค้า</th>
                          <th className="px-6 py-4 text-center">PC</th>
                          <th className="px-6 py-4 text-center">INF</th>
                          <th className="px-6 py-4 text-center">LIVE</th>
                          <th className="px-6 py-4 text-center">AFF</th>
                          <th className="px-6 py-4 text-center bg-slate-100 text-slate-800">BUFFER STOCK WAREHOUSE</th>
                          <th className="px-6 py-4 text-center font-black text-black">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {filteredInventoryProducts.map(p => (
                          <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4">
                               <div className="flex items-center gap-3">
                                  <img src={p.images[0]} className="w-8 h-8 rounded-lg object-cover border" alt="" />
                                  <div>
                                     <p className="text-[11px] font-black">{p.name}</p>
                                     <p className="text-[9px] text-slate-400 font-bold uppercase">{p.id}</p>
                                  </div>
                               </div>
                            </td>
                            {[
                              { val: p.stockPurchasing, type: InventoryType.PURCHASING, color: 'blue' },
                              { val: p.stockInfluencer, type: InventoryType.INFLUENCERS, color: 'purple' },
                              { val: p.stockLive, type: InventoryType.LIVE, color: 'red' },
                              { val: p.stockAffiliate, type: InventoryType.AFFILIATE, color: 'emerald' },
                              { val: p.stockBuffer, type: InventoryType.BUFFER, color: 'slate' }
                            ].map((cell, idx) => (
                              <td key={idx} className={`px-4 py-4 ${cell.type === InventoryType.BUFFER ? 'bg-slate-50' : ''}`}>
                                 <div className="flex flex-col items-center gap-1">
                                    <span className={`text-xs font-black text-${cell.color}-700`}>{cell.val.toLocaleString()}</span>
                                    {currentUser?.canAdjustStock && (
                                      <div className="flex items-center gap-1 scale-90">
                                         <input type="number" placeholder="0" className="w-12 p-1 text-center text-[10px] font-bold border rounded" value={adjustments[p.id]?.[cell.type] || ''} onChange={e => updateAdjustmentValue(p.id, cell.type, e.target.value)} />
                                         <button onClick={() => initiateAdjustment(p.id, cell.type)} disabled={!adjustments[p.id]?.[cell.type]} className={`w-5 h-5 bg-${cell.color}-600 text-white rounded flex items-center justify-center text-[10px]`}>✓</button>
                                      </div>
                                    )}
                                 </div>
                              </td>
                            ))}
                            <td className="px-6 py-4 text-center">
                               <span className="text-xs font-black text-black">{(p.stockPurchasing + p.stockInfluencer + p.stockLive + p.stockAffiliate + p.stockBuffer).toLocaleString()}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </>
                  )}
                </table>
              </div>
            </div>
          </div>
      );

      case View.PURCHASING:
      case View.INFLUENCER_DEP:
      case View.LIVE_DEP:
      case View.AFFILIATE_DEP:
      case View.BUFFER_DEP:
        const currentIsInfluencer = activeView === View.INFLUENCER_DEP;
        return (
          <div className="space-y-12">
            <div className={`bg-white p-6 rounded-3xl shadow-sm border-t-4 flex flex-col items-end gap-6 sticky top-20 z-20 ${currentIsInfluencer ? 'border-t-purple-500' : 'border-t-blue-500'}`}>
              <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Processing Channel</label>
                  <select 
                    value={activeView === View.PURCHASING ? processingChannel : (activeView === View.INFLUENCER_DEP ? 'influencer' : (activeView === View.LIVE_DEP ? 'live' : (activeView === View.AFFILIATE_DEP ? 'affiliate' : 'buffer')))} 
                    onChange={e => setProcessingChannel(e.target.value as OrderSource)} 
                    disabled={activeView !== View.PURCHASING}
                    className="w-full p-3 bg-slate-50 border rounded-xl text-xs font-bold"
                  >
                    <option value="purchasing">Purchasing Channel</option>
                    <option value="influencer">Influencer Channel</option>
                    <option value="live">Live Channel</option>
                    <option value="affiliate">Affiliate Channel</option>
                    <option value="buffer">Buffer Stock Warehouse Channel</option>
                  </select>
                </div>
                {!currentIsInfluencer ? (
                  <>
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Main Store</label>
                      <select value={selectedStore} onChange={e => { setSelectedStore(e.target.value); setSelectedSubBranch(''); }} className="w-full p-3 bg-slate-50 border rounded-xl text-xs font-bold">
                        {stores.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Sub Branch</label>
                      <select value={selectedSubBranch} onChange={e => setSelectedSubBranch(e.target.value)} className="w-full p-3 bg-slate-50 border rounded-xl text-xs font-bold">
                        <option value="">เลือกสาขาย่อย...</option>
                        {currentStoreData?.subBranches?.map(b => <option key={b} value={b}>{b}</option>)}
                        <option value="อื่นๆ">อื่นๆ</option>
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Influencer Identity</label>
                      <select value={selectedInfluencerName} onChange={e => setSelectedInfluencerName(e.target.value)} className="w-full p-3 bg-slate-50 border rounded-xl text-xs font-bold">
                        {influencers.map(inf => <option key={inf.id} value={inf.name}>{inf.name}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Notes</label>
                      <input type="text" placeholder="ระบุเพิ่มเติม..." className="w-full p-3 bg-slate-50 border rounded-xl text-xs font-bold" value={influencerFirstName} onChange={e => setInfluencerFirstName(e.target.value)} />
                    </div>
                  </>
                )}
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Category Filter</label>
                  <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="w-full p-3 bg-slate-50 border rounded-xl text-xs font-bold">
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <button onClick={() => setShowReporterModal(true)} disabled={Object.keys(draftOrder).length === 0} className={`px-8 py-3.5 rounded-2xl font-black text-sm text-white ${currentIsInfluencer ? 'bg-purple-600 shadow-purple-200' : 'bg-blue-600 shadow-blue-200'} shadow-xl transition-all active:scale-95`}>
                ส่งใบจองสต็อก ({Object.keys(draftOrder).length})
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-4">
              {filteredPurchasingProducts.map(p => (
                <div key={p.id} className="bg-white rounded-2xl border p-3 text-center cursor-pointer hover:shadow-lg transition-all group" onClick={() => incrementDraft(p.id, 1)}>
                   <div className="relative mb-2 overflow-hidden rounded-xl">
                     <img src={p.images[0]} className="w-full h-24 object-cover transition-transform group-hover:scale-110" alt="" />
                     {draftOrder[p.id] && (
                       <div className="absolute top-1 right-1 bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white shadow-md animate-in zoom-in">
                        {draftOrder[p.id].quantity}
                       </div>
                     )}
                   </div>
                   <h4 className="text-[11px] font-bold truncate text-slate-700">{p.name}</h4>
                   <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">฿{p.unitPrice?.toLocaleString() || 0}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-3xl shadow-sm border overflow-hidden mt-10">
               <div className="p-6 border-b bg-slate-50/50 flex justify-between items-center">
                  <div>
                    <h3 className="font-black text-slate-800">📋 ประวัติการจองสต็อก</h3>
                    <p className="text-xs text-slate-400">รายการล่าสุดจากแผนกของคุณ</p>
                  </div>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[9px] border-b">
                       <tr>
                          <th className="px-6 py-4">Transaction</th>
                          <th className="px-6 py-4">Target Entity</th>
                          <th className="px-6 py-4">Product</th>
                          <th className="px-6 py-4 text-center">Qty</th>
                          <th className="px-6 py-4 text-center">Status</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y">
                       {deptHistory.length === 0 ? (
                         <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-300 font-black uppercase tracking-widest">No Recent activity</td></tr>
                       ) : deptHistory.map(h => (
                         <tr key={h.id} className="hover:bg-slate-50/30 transition-colors">
                            <td className="px-6 py-4">
                               <p className="font-black text-slate-800">{h.id}</p>
                               <p className="text-[9px] text-slate-400">{new Date(h.requestedAt).toLocaleString('th-TH')}</p>
                            </td>
                            <td className="px-6 py-4">
                               <p className="font-bold text-slate-600">{h.storeName || h.influencerName}</p>
                               {h.subBranch && <span className="text-[9px] text-blue-500 font-black uppercase tracking-tight">{h.subBranch}</span>}
                            </td>
                            <td className="px-6 py-4 font-medium">{h.productName}</td>
                            <td className="px-6 py-4 text-center">
                               <div className="flex flex-col">
                                 <span className="text-slate-300 font-bold">{h.requestedQuantity}</span>
                                 <span className="text-blue-600 font-black text-sm">{h.status === 'confirmed' ? h.quantity : '-'}</span>
                               </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                               <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                 h.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                 h.status === 'cancelled' ? 'bg-red-50 text-red-600 border-red-100' :
                                 'bg-amber-50 text-amber-600 border-amber-100'
                               }`}>
                                 {h.status}
                               </span>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                  </table>
               </div>
            </div>
          </div>
        );

      case View.WAREHOUSE:
        return (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
               <div>
                  <h2 className="text-2xl font-black text-slate-800">จัดการออเดอร์คลังสินค้า</h2>
                  <p className="text-xs text-slate-400">ตรวจสอบและยืนยันยอดส่งจริงรายกลุ่มออเดอร์</p>
               </div>
               <div className="flex gap-2">
                  <button onClick={handleBulkConfirm} className="px-5 py-2.5 bg-emerald-600 text-white rounded-2xl text-xs font-bold shadow-lg shadow-emerald-50 active:scale-95 transition-all">Bulk Confirm All (PIN)</button>
                  <button onClick={fetchAiAnalysis} disabled={isAiLoading} className="px-5 py-2.5 bg-indigo-600 text-white rounded-2xl text-xs font-bold shadow-lg shadow-indigo-50 active:scale-95 transition-all">✨ AI Analysis</button>
               </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4">
               <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Status</label>
                  <select className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold outline-none" value={whStatusFilter} onChange={e => setWhStatusFilter(e.target.value as any)}>
                    <option value="all">All Status</option>
                    <option value="pending">Pending Only</option>
                    <option value="confirmed">Confirmed Only</option>
                  </select>
               </div>
               <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Source Dept</label>
                  <select className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold outline-none" value={whSourceFilter} onChange={e => setWhSourceFilter(e.target.value as any)}>
                    <option value="all">All Departments</option>
                    <option value="purchasing">Purchasing</option>
                    <option value="influencer">Influencer</option>
                    <option value="live">Live</option>
                    <option value="affiliate">Affiliate</option>
                    <option value="buffer">Buffer Stock Warehouse</option>
                  </select>
               </div>
               <div className="md:col-span-2">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Quick Search</label>
                  <input type="text" placeholder="Search entity, product..." className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none" value={whSearch} onChange={e => setWhSearch(e.target.value)} />
               </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
               {groupedWarehouseOrders.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                    <p className="text-slate-400 font-black uppercase tracking-widest">No matching orders found</p>
                  </div>
               ) : groupedWarehouseOrders.map((group, gIdx) => (
                  <div key={gIdx} className="bg-white rounded-[2.5rem] border shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 transition-all hover:shadow-md">
                     <div className="bg-slate-900 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b">
                        <div>
                           <div className="flex items-center gap-3 mb-1">
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg uppercase ${group.source === 'buffer' ? 'bg-pink-500 text-white' : 'bg-blue-600 text-white'}`}>
                                 {group.source === 'buffer' ? 'Buffer Stock' : group.source}
                              </span>
                              <h3 className="text-xl font-black text-white tracking-tight">{group.title}</h3>
                           </div>
                           <p className="text-slate-400 text-xs font-bold">
                              📍 {group.subTitle} | 📅 {group.date} | ⏰ {group.time}
                           </p>
                        </div>
                        <div className="bg-slate-800 px-4 py-2 rounded-2xl border border-slate-700">
                           <p className="text-[10px] text-slate-500 font-black uppercase text-center mb-0.5">Total SKU Items</p>
                           <p className="text-white font-black text-center">{group.orders.length}</p>
                        </div>
                     </div>

                     <div className="p-4 md:p-8 space-y-4">
                        {group.orders.map(o => (
                           <div key={o.id} className={`flex flex-col md:flex-row items-start md:items-center justify-between p-5 rounded-2xl border transition-all ${o.status === 'confirmed' ? 'bg-emerald-50/30 border-emerald-100' : 'bg-white hover:bg-slate-50'}`}>
                              <div className="flex-1 min-w-0">
                                 <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-black text-slate-400">#{o.id}</span>
                                    <h4 className="text-sm font-black text-slate-800 truncate">{o.productName}</h4>
                                 </div>
                                 <div className="flex gap-4">
                                    <p className="text-xs font-bold text-slate-500">Requested: <span className="text-slate-900">{o.requestedQuantity}</span></p>
                                    <p className="text-xs font-bold text-slate-400">By: {o.purchasingDept}</p>
                                 </div>
                              </div>

                              <div className="flex items-center gap-4 mt-4 md:mt-0 w-full md:w-auto justify-between md:justify-end">
                                 <div className="flex items-center gap-3">
                                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest hidden md:block">Confirm Qty</p>
                                    <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                       {o.status === 'pending' && <button onClick={() => handleWhQuantityChange(o.id, -1)} className="px-3 py-2 bg-slate-50 hover:bg-slate-100 transition-colors font-black text-slate-400">-</button>}
                                       <span className="px-4 py-2 font-black text-slate-900 min-w-[3rem] text-center">{o.quantity}</span>
                                       {o.status === 'pending' && <button onClick={() => handleWhQuantityChange(o.id, 1)} className="px-3 py-2 bg-slate-50 hover:bg-slate-100 transition-colors font-black text-slate-400">+</button>}
                                    </div>
                                 </div>

                                 <div className="flex items-center gap-2">
                                    {o.status === 'pending' ? (
                                       <>
                                          <button 
                                             onClick={() => handleUpdateOrderStatus(o.id, 'cancelled')} 
                                             className="w-10 h-10 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                             title="Reject Order"
                                          >
                                             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                             </svg>
                                          </button>
                                          <button 
                                             onClick={() => handleUpdateOrderStatus(o.id, 'confirmed')} 
                                             className="w-12 h-12 bg-blue-600 text-white flex items-center justify-center rounded-xl shadow-lg shadow-blue-100 hover:scale-105 active:scale-95 transition-all"
                                             title="Confirm & Dispatch"
                                          >
                                             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                             </svg>
                                          </button>
                                       </>
                                    ) : (
                                       <div className="text-right flex items-center gap-3">
                                          <div className="flex flex-col items-end">
                                             <span className={`text-[10px] font-black uppercase tracking-widest ${o.status === 'confirmed' ? 'text-emerald-500' : 'text-red-500'}`}>{o.status} ✓</span>
                                             <p className="text-[8px] text-slate-400 font-bold uppercase">{o.processedAt ? new Date(o.processedAt).toLocaleTimeString('th-TH', {hour:'2-digit', minute:'2-digit'}) : ''}</p>
                                          </div>
                                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${o.status === 'confirmed' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                             {o.status === 'confirmed' ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                   <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                             ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                   <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                             )}
                                          </div>
                                       </div>
                                    )}
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               ))}
            </div>
          </div>
        );

      case View.SETTINGS:
        return (
          <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm max-w-4xl mx-auto space-y-12">
             <div className="flex border-b">
                <button onClick={() => setSettingsTab('stores')} className={`flex-1 py-4 font-black text-sm border-b-2 transition-all ${settingsTab === 'stores' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}>🛍️ Partner Stores</button>
                <button onClick={() => setSettingsTab('users')} className={`flex-1 py-4 font-black text-sm border-b-2 transition-all ${settingsTab === 'users' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}>👥 User Accounts</button>
                {currentUser?.canManageAccounts && (
                   <button onClick={() => setSettingsTab('system')} className={`flex-1 py-4 font-black text-sm border-b-2 transition-all ${settingsTab === 'system' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}>🖥️ System Assets</button>
                )}
             </div>
             
             {settingsTab === 'stores' && (
               <div>
                  <h3 className="text-lg font-black mb-6 uppercase tracking-widest text-slate-400 text-center">Manage Partner Stores</h3>
                  <div className="space-y-4">
                     {stores.map(s => (
                       <div key={s.id} className="bg-slate-50 p-4 rounded-3xl border border-slate-100 flex items-center justify-between">
                          <span className="font-black text-slate-800">{s.name}</span>
                          <button onClick={() => setStores(stores.filter(st => st.id !== s.id))} className="text-red-300 hover:text-red-500 text-xs font-bold">Remove</button>
                       </div>
                     ))}
                     <button onClick={() => setShowAddStoreModal(true)} className="w-full py-4 bg-slate-900 text-white rounded-3xl font-black text-sm shadow-xl shadow-slate-200">Add New Store</button>
                  </div>
               </div>
             )}

             {settingsTab === 'users' && (
               <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-black uppercase tracking-widest text-slate-400">Personnel & Permissions</h3>
                    {currentUser?.canManageAccounts && (
                      <button 
                        onClick={() => setShowAddUserModal(true)}
                        className="px-6 py-2 bg-slate-900 text-white rounded-2xl text-xs font-black shadow-lg shadow-slate-200"
                      >
                        + Create Account
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    {users.map(u => (
                      <div key={u.id} className="p-6 bg-white border border-slate-100 rounded-3xl flex justify-between items-center shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center font-black text-blue-300 text-lg border border-blue-100">{u.name[0]}</div>
                            <div className="flex-1 min-w-0">
                              <p className="font-black text-slate-800 text-sm truncate">{u.name}</p>
                              <p className="text-[10px] text-slate-400 font-bold mb-1 truncate">{u.email}</p>
                              <div className="flex flex-wrap gap-2 mt-1">
                                <span className="text-[8px] uppercase font-black tracking-widest px-2 py-0.5 bg-slate-900 text-white rounded-lg">{u.role}</span>
                                <span className="text-[8px] uppercase font-black tracking-widest px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg">{u.allowedViews.length} Features Enabled</span>
                              </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                           {currentUser?.canManageAccounts && (
                             <button 
                               onClick={() => {
                                 setEditingUser({...u});
                                 setShowEditUserModal(true);
                               }}
                               className="p-3 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-2xl transition-all"
                               title="Edit User"
                             >
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                               </svg>
                             </button>
                           )}
                           {currentUser?.canManageAccounts && u.id !== currentUser.id && (
                             <button 
                               onClick={() => initiateDeleteUser(u.id)}
                               className="p-3 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                               title="Delete User"
                             >
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                               </svg>
                             </button>
                           )}
                        </div>
                      </div>
                    ))}
                  </div>
               </div>
             )}

             {settingsTab === 'system' && currentUser?.canManageAccounts && (
               <div className="space-y-8 animate-in fade-in duration-300">
                  <div className="text-center mb-8">
                     <h3 className="text-lg font-black uppercase tracking-widest text-slate-800">System Customization</h3>
                     <p className="text-xs text-slate-400">เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถแก้ไขส่วนนี้ได้</p>
                  </div>

                  <div className="bg-slate-50 p-8 rounded-[2rem] border-2 border-dashed border-slate-200">
                     <div className="flex flex-col items-center gap-6">
                        <div className="w-full max-w-lg aspect-video rounded-3xl bg-slate-200 overflow-hidden shadow-inner border-4 border-white relative group">
                           {loginBg ? (
                              <img src={loginBg} className="w-full h-full object-cover" alt="Login Background" />
                           ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-xs uppercase tracking-widest">Default Background</div>
                           )}
                           <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-white font-black text-xs uppercase">Current Asset Preview</span>
                           </div>
                        </div>
                        
                        <div className="flex flex-col items-center gap-4 w-full">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">อัปโหลดภาพพื้นหลังใหม่ (แนะนำขนาด 1920 x 1080)</p>
                           <div className="flex gap-3">
                              <label className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs shadow-xl cursor-pointer hover:scale-105 transition-all">
                                 เลือกไฟล์รูปภาพ
                                 <input type="file" className="hidden" accept="image/*" onChange={handleBgUpload} />
                              </label>
                              {loginBg && (
                                 <button 
                                   onClick={handleResetBg}
                                   className="px-8 py-3 border-2 border-red-100 text-red-500 rounded-2xl font-black text-xs hover:bg-red-50 transition-all"
                                 >
                                    ใช้ค่าเริ่มต้น
                                 </button>
                              )}
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex items-start gap-4">
                     <div className="text-2xl">💡</div>
                     <div>
                        <p className="text-blue-900 font-black text-xs uppercase mb-1">Admin Guide</p>
                        <p className="text-blue-700/70 text-xs font-medium leading-relaxed">
                           ภาพที่คุณอัปโหลดจะถูกใช้เป็นพื้นหลังหลักของหน้าเข้าสู่ระบบ (Login Screen) สำหรับพอร์ทัลนี้ 
                           กรุณาเลือกภาพที่มีความละเอียดสูงและไม่รบกวนการอ่านข้อความในกล่อง Login
                        </p>
                     </div>
                  </div>
               </div>
             )}
          </div>
        );

      default: return null;
    }
  };

  return (
    <Layout activeView={activeView} setActiveView={changeView} currentUser={currentUser!} onLogout={handleLogout} orders={orders}>
      {renderView()}
      
      {/* PIN Verification Modal */}
      {showConfirmModal && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm p-8 animate-in zoom-in">
              <div className="text-center mb-6">
                 <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 text-2xl mx-auto mb-4">🔐</div>
                 <h3 className="text-xl font-black text-slate-800">Security PIN Check</h3>
                 <p className="text-xs text-slate-400 mt-1">authorized access required for critical actions</p>
              </div>
              
              <div className="space-y-4">
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">Entry PIN (1234)</label>
                    <input type="password" placeholder="••••" className="w-full p-4 bg-slate-50 border rounded-2xl text-center text-3xl font-black outline-none tracking-[0.5em] text-black" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} />
                    {passwordError && <p className="text-[10px] text-red-500 text-center mt-3 font-black uppercase">Invalid PIN. Try again.</p>}
                 </div>
              </div>

              <div className="flex gap-3 mt-8">
                 <button onClick={() => setShowConfirmModal(null)} className="flex-1 py-4 border rounded-3xl font-black text-sm text-slate-400">Cancel</button>
                 <button onClick={handleVerifyPassword} className={`flex-1 py-4 ${showConfirmModal.type?.includes('delete') ? 'bg-red-500' : 'bg-blue-600'} text-white rounded-3xl font-black text-sm shadow-xl`}>Confirm</button>
              </div>
            </div>
         </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto py-10">
           <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-2xl animate-in zoom-in">
              <div className="text-center mb-8">
                 <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 text-3xl mx-auto mb-4">👤</div>
                 <h3 className="text-xl font-black text-slate-800 tracking-tight">Create User Account</h3>
                 <p className="text-xs text-slate-400 mt-1">Configure workspace access and security credentials</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                   <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest border-b pb-2 mb-4">Account Profile</h4>
                   <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Full Name</label>
                      <input type="text" placeholder="Ex: John Doe" className="w-full p-4 bg-slate-50 border rounded-2xl text-sm font-bold outline-none text-black" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
                   </div>
                   <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Work Email Address</label>
                      <input type="email" placeholder="name@laglace.com" className="w-full p-4 bg-slate-50 border rounded-2xl text-sm font-bold outline-none text-black" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
                   </div>
                   <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Account Password</label>
                      <input type="text" placeholder="••••••••" className="w-full p-4 bg-slate-50 border rounded-2xl text-sm font-bold outline-none text-black" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
                   </div>
                   <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Primary Position</label>
                      <select className="w-full p-4 bg-slate-50 border rounded-2xl text-sm font-bold outline-none text-black" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                         <option value={USER_ROLES.PURCHASING}>{USER_ROLES.PURCHASING}</option>
                         <option value={USER_ROLES.WAREHOUSE}>{USER_ROLES.WAREHOUSE}</option>
                         <option value={USER_ROLES.ADMIN}>{USER_ROLES.ADMIN}</option>
                         <option value={USER_ROLES.LIVE}>{USER_ROLES.LIVE}</option>
                         <option value={USER_ROLES.AFFILIATE}>{USER_ROLES.AFFILIATE}</option>
                      </select>
                   </div>
                </div>

                <div>
                   <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest border-b pb-2 mb-4">Feature Access Rights</h4>
                   <div className="grid grid-cols-1 gap-2 overflow-y-auto max-h-[300px] pr-2">
                     {ALL_VIEWS.map(v => (
                       <label key={v} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                         <input 
                           type="checkbox" 
                           className="w-4 h-4 rounded text-blue-600"
                           checked={newUser.allowedViews?.includes(v)}
                           onChange={(e) => {
                             const current = newUser.allowedViews || [];
                             if (e.target.checked) {
                               setNewUser({...newUser, allowedViews: [...current, v]});
                             } else {
                               setNewUser({...newUser, allowedViews: current.filter(view => view !== v)});
                             }
                           }}
                         />
                         <span className="text-[11px] font-black text-slate-600 uppercase tracking-tighter truncate">{v.replace('_DEP', '')}</span>
                       </label>
                     ))}
                   </div>
                </div>
              </div>

              <div className="flex gap-3 mt-10 pt-6 border-t">
                 <button onClick={() => setShowAddUserModal(false)} className="flex-1 py-4 border rounded-3xl font-black text-sm text-slate-400">Cancel</button>
                 <button onClick={handleAddUser} className="flex-1 py-4 bg-slate-900 text-white rounded-3xl font-black text-sm shadow-xl shadow-slate-200">Create Identity</button>
              </div>
           </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUserModal && editingUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto py-10">
           <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-2xl animate-in zoom-in">
              <div className="text-center mb-8">
                 <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 text-3xl mx-auto mb-4">⚙️</div>
                 <h3 className="text-xl font-black text-slate-800 tracking-tight">Edit Identity & Rights</h3>
                 <p className="text-xs text-slate-400 mt-1">Modify account details for <span className="text-blue-600 font-black">{editingUser.name}</span></p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                   <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest border-b pb-2 mb-4">Account Profile</h4>
                   <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Full Name</label>
                      <input type="text" placeholder="Ex: John Doe" className="w-full p-4 bg-slate-50 border rounded-2xl text-sm font-bold outline-none text-black" value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} />
                   </div>
                   <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Work Email Address</label>
                      <input type="email" placeholder="name@laglace.com" className="w-full p-4 bg-slate-50 border rounded-2xl text-sm font-bold outline-none text-black" value={editingUser.email} onChange={e => setEditingUser({...editingUser, email: e.target.value})} />
                   </div>
                   <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Account Password</label>
                      <input type="text" placeholder="••••••••" className="w-full p-4 bg-slate-50 border rounded-2xl text-sm font-bold outline-none text-black" value={editingUser.password} onChange={e => setEditingUser({...editingUser, password: e.target.value})} />
                   </div>
                   <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Primary Position</label>
                      <select className="w-full p-4 bg-slate-50 border rounded-2xl text-sm font-bold outline-none text-black" value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value})}>
                         <option value={USER_ROLES.PURCHASING}>{USER_ROLES.PURCHASING}</option>
                         <option value={USER_ROLES.WAREHOUSE}>{USER_ROLES.WAREHOUSE}</option>
                         <option value={USER_ROLES.ADMIN}>{USER_ROLES.ADMIN}</option>
                         <option value={USER_ROLES.LIVE}>{USER_ROLES.LIVE}</option>
                         <option value={USER_ROLES.AFFILIATE}>{USER_ROLES.AFFILIATE}</option>
                      </select>
                   </div>
                </div>

                <div>
                   <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest border-b pb-2 mb-4">Feature Access Rights</h4>
                   <div className="grid grid-cols-1 gap-2 overflow-y-auto max-h-[300px] pr-2">
                     {ALL_VIEWS.map(v => (
                       <label key={v} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                         <input 
                           type="checkbox" 
                           className="w-4 h-4 rounded text-blue-600"
                           checked={editingUser.allowedViews?.includes(v)}
                           onChange={(e) => {
                             const current = editingUser.allowedViews || [];
                             if (e.target.checked) {
                               setEditingUser({...editingUser, allowedViews: [...current, v]});
                             } else {
                               setEditingUser({...editingUser, allowedViews: current.filter(view => view !== v)});
                             }
                           }}
                         />
                         <span className="text-[11px] font-black text-slate-600 uppercase tracking-tighter truncate">{v.replace('_DEP', '')}</span>
                       </label>
                     ))}
                   </div>
                </div>
              </div>

              <div className="flex gap-3 mt-10 pt-6 border-t">
                 <button onClick={() => { setShowEditUserModal(false); setEditingUser(null); }} className="flex-1 py-4 border rounded-3xl font-black text-sm text-slate-400">Cancel</button>
                 <button onClick={handleSaveEditUser} className="flex-1 py-4 bg-slate-900 text-white rounded-3xl font-black text-sm shadow-xl shadow-slate-200">Save Changes</button>
              </div>
           </div>
        </div>
      )}

      {showAddProductModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto py-10">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-5xl my-8 animate-in zoom-in">
            <h3 className="text-2xl font-black mb-6 text-slate-800 tracking-tighter">New Product Logistics Entry</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Left Column: General Info */}
              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest border-b pb-2">Core Identity</h4>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">ชื่อสินค้า</label>
                  <input type="text" placeholder="ชื่อสินค้า..." className="w-full p-3.5 bg-slate-50 border rounded-2xl text-sm font-bold outline-none text-black" value={newProduct.name || ''} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">SKU Code</label>
                    <input type="text" placeholder="SKU-XXXX" className="w-full p-3.5 bg-slate-50 border rounded-2xl text-sm font-bold outline-none text-black" value={newProduct.sku || ''} onChange={e => setNewProduct({...newProduct, sku: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">Category</label>
                    <input 
                      list="categories-list"
                      placeholder="Select/Create..." 
                      className="w-full p-3.5 bg-slate-50 border rounded-2xl text-sm font-bold outline-none text-black" 
                      value={newProduct.category || ''} 
                      onChange={e => setNewProduct({...newProduct, category: e.target.value})} 
                    />
                    <datalist id="categories-list">
                      {categories.filter(c => c !== 'All').map(c => <option key={c} value={c} />)}
                    </datalist>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">Unit Price (฿)</label>
                      <input type="number" placeholder="0.00" className="w-full p-3.5 bg-slate-900 text-emerald-400 border rounded-2xl text-sm font-black outline-none" value={newProduct.unitPrice || ''} onChange={e => setNewProduct({...newProduct, unitPrice: parseFloat(e.target.value) || 0})} />
                   </div>
                   <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">Lead Time (Duration)</label>
                      <select className="w-full p-3.5 bg-slate-50 border rounded-2xl text-sm font-bold outline-none text-black" value={newProduct.leadTime} onChange={e => setNewProduct({...newProduct, leadTime: e.target.value})}>
                         {LEAD_TIME_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                   </div>
                </div>
                <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Product Images</label>
                   <div className="flex gap-2">
                      <div className="w-16 h-16 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center bg-slate-50 hover:bg-slate-100 cursor-pointer transition-all" onClick={() => {
                        const url = prompt("ระบุ URL รูปภาพสินค้า:");
                        if (url) setNewProduct({...newProduct, images: [...(newProduct.images || []), url].slice(0, 3)});
                      }}>
                         <span className="text-xl text-slate-300">+</span>
                      </div>
                      {newProduct.images?.map((img, idx) => (
                        <div key={idx} className="relative w-16 h-16">
                           <img src={img} className="w-full h-full object-cover rounded-xl border" alt="" />
                           <button onClick={() => setNewProduct({...newProduct, images: newProduct.images?.filter((_, i) => i !== idx)})} className="absolute -top-1 -right-1 bg-red-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[8px]">✕</button>
                        </div>
                      ))}
                   </div>
                </div>
              </div>

              {/* Middle Column: Initial Stock Levels */}
              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest border-b pb-2">Stock Allocation</h4>
                <div className="grid grid-cols-2 gap-4">
                   <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                      <label className="block text-[9px] font-black text-blue-400 uppercase mb-1 tracking-widest">Purchasing</label>
                      <input type="number" placeholder="0" className="w-full bg-transparent text-lg font-black text-blue-700 outline-none" value={newProduct.stockPurchasing || ''} onChange={e => setNewProduct({...newProduct, stockPurchasing: parseInt(e.target.value) || 0})} />
                   </div>
                   <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100">
                      <label className="block text-[9px] font-black text-purple-400 uppercase mb-1 tracking-widest">Influencer</label>
                      <input type="number" placeholder="0" className="w-full bg-transparent text-lg font-black text-purple-700 outline-none" value={newProduct.stockInfluencer || ''} onChange={e => setNewProduct({...newProduct, stockInfluencer: parseInt(e.target.value) || 0})} />
                   </div>
                   <div className="p-4 bg-red-50/50 rounded-2xl border border-red-100">
                      <label className="block text-[9px] font-black text-red-400 uppercase mb-1 tracking-widest">Live</label>
                      <input type="number" placeholder="0" className="w-full bg-transparent text-lg font-black text-red-700 outline-none" value={newProduct.stockLive || ''} onChange={e => setNewProduct({...newProduct, stockLive: parseInt(e.target.value) || 0})} />
                   </div>
                   <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                      <label className="block text-[9px] font-black text-emerald-400 uppercase mb-1 tracking-widest">Affiliate</label>
                      <input type="number" placeholder="0" className="w-full bg-transparent text-lg font-black text-emerald-700 outline-none" value={newProduct.stockAffiliate || ''} onChange={e => setNewProduct({...newProduct, stockAffiliate: parseInt(e.target.value) || 0})} />
                   </div>
                   <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-200 col-span-2">
                      <label className="block text-[9px] font-black text-slate-400 uppercase mb-1 tracking-widest">Buffer Stock Warehouse</label>
                      <input type="number" placeholder="0" className="w-full bg-transparent text-xl font-black text-slate-800 outline-none" value={newProduct.stockBuffer || ''} onChange={e => setNewProduct({...newProduct, stockBuffer: parseInt(e.target.value) || 0})} />
                   </div>
                </div>
                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 text-[10px] text-amber-700 font-bold flex gap-3">
                   <div className="text-lg">💡</div>
                   <div>System will initialize with these volumes. Prices affect global valuation.</div>
                </div>
              </div>

              {/* Right Column: Dimensions & Dates */}
              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest border-b pb-2">Logistics & Dates</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">น้ำหนัก (kg)</label>
                    <input type="number" step="0.01" className="w-full p-3.5 bg-slate-50 border rounded-2xl text-sm font-bold outline-none text-black" value={newProduct.weight || ''} onChange={e => setNewProduct({...newProduct, weight: parseFloat(e.target.value)})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">Unit</label>
                    <input type="text" placeholder="ชิ้น, ถุง..." className="w-full p-3.5 bg-slate-50 border rounded-2xl text-sm font-bold outline-none text-black" value={newProduct.unit || ''} onChange={e => setNewProduct({...newProduct, unit: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">วันที่ผลิต</label>
                    <input type="date" className="w-full p-3.5 bg-slate-50 border rounded-2xl text-sm font-bold outline-none text-black" value={newProduct.productionDate || ''} onChange={e => setNewProduct({...newProduct, productionDate: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">วันหมดอายุ</label>
                    <input type="date" className="w-full p-3.5 bg-slate-50 border rounded-2xl text-sm font-bold outline-none text-black" value={newProduct.expirationDate || ''} onChange={e => setNewProduct({...newProduct, expirationDate: e.target.value})} />
                  </div>
                </div>
                <div className="pt-4 space-y-3">
                   <button onClick={handleAddProduct} className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-sm shadow-xl hover:translate-y-[-2px] transition-all">Create Product</button>
                   <button onClick={() => setShowAddProductModal(false)} className="w-full py-4 border rounded-[2rem] font-black text-sm text-slate-400">Cancel</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showReporterModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
           <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl animate-in slide-in-from-bottom-10">
              <h3 className="text-xl font-black text-center mb-6 text-slate-800">Authorized Agent</h3>
              <div className="p-4 bg-slate-50 border rounded-2xl text-sm font-black text-center text-slate-600 uppercase tracking-widest mb-8">
                 {currentUser?.name}
              </div>
              <div className="flex gap-3">
                 <button onClick={() => setShowReporterModal(false)} className="flex-1 py-4 border rounded-3xl font-bold text-slate-400">Back</button>
                 <button onClick={submitBatchOrders} className="flex-1 py-4 bg-blue-600 text-white rounded-3xl font-black shadow-xl shadow-blue-50">Submit Request</button>
              </div>
           </div>
        </div>
      )}

      {showAddStoreModal && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm animate-in zoom-in">
               <h3 className="text-xl font-black mb-6 text-slate-800">Add Modern Trade Partner</h3>
               <input type="text" placeholder="Store Name..." className="w-full p-4 bg-slate-50 border rounded-2xl mb-8 font-black text-sm outline-none text-black" id="newStoreInput" />
               <div className="flex gap-3">
                  <button onClick={() => setShowAddStoreModal(false)} className="flex-1 py-3.5 border rounded-3xl font-bold text-slate-400">Cancel</button>
                  <button onClick={() => {
                     const val = (document.getElementById('newStoreInput') as HTMLInputElement).value;
                     if (val) setStores([...stores, {id: Date.now().toString(), name: val, subBranches: []}]);
                     setShowAddStoreModal(false);
                  }} className="flex-1 py-3.5 bg-slate-900 text-white rounded-3xl font-black">Add Partner</button>
               </div>
            </div>
         </div>
      )}

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
