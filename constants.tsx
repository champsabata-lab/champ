
import { Product, Order, UserAccount, Store, View, Influencer } from './types';

export const USER_ROLES = {
  PURCHASING: 'Purchasing',
  WAREHOUSE: 'Warehouse',
  ADMIN: 'Admin',
  LIVE: 'Live Dept',
  AFFILIATE: 'Affiliate Dept'
};

export const INITIAL_PRODUCTS: Product[] = [
  { 
    id: 'P001', 
    sku: 'SKU-WTR-001',
    name: 'น้ำดื่ม 600ml (แพ็ค 12)', 
    unit: 'แพ็ค', 
    category: 'เครื่องดื่ม',
    description: 'น้ำดื่มสะอาดผ่านกระบวนการ RO',
    barcode13: '8850000000012',
    barcodeMT: 'MT-WTR-001',
    images: ['https://images.unsplash.com/photo-1523362628744-0c100150b504?auto=format&fit=crop&q=80&w=300'],
    weight: 7.2,
    dimensions: { l: 30, w: 20, h: 25 },
    unitPrice: 120,
    leadTime: '1 day',
    stockPurchasing: 500,
    stockContent: 250,
    stockInfluencer: 750,
    stockLive: 300,
    stockAffiliate: 200,
    stockBuffer: 1000
  },
  { 
    id: 'P002', 
    sku: 'SKU-RICE-005',
    name: 'ข้าวหอมมะลิ 5kg', 
    unit: 'ถุง', 
    category: 'อาหารแห้ง',
    description: 'ข้าวหอมมะลิแท้ 100% คัดพิเศษ',
    barcode13: '8850000000055',
    barcodeMT: 'MT-RICE-005',
    images: ['https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=300'],
    weight: 5.0,
    unitPrice: 245,
    leadTime: '1 week',
    stockPurchasing: 150,
    stockContent: 50,
    stockInfluencer: 300,
    stockLive: 100,
    stockAffiliate: 50,
    stockBuffer: 500
  },
  { 
    id: 'P003', 
    sku: 'SKU-OIL-001',
    name: 'น้ำมันพืช 1L', 
    unit: 'ขวด', 
    category: 'เครื่องปรุง',
    description: 'น้ำมันปาล์มคุณภาพสูงสำหรับการทอด',
    barcode13: '8850000000101',
    barcodeMT: 'MT-OIL-001',
    images: ['https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=300'],
    weight: 1.0,
    unitPrice: 48,
    leadTime: '1 day',
    stockPurchasing: 200,
    stockContent: 100,
    stockInfluencer: 200,
    stockLive: 150,
    stockAffiliate: 80,
    stockBuffer: 400
  }
];

export const INITIAL_STORES: Store[] = [
  { id: 'S1', name: '7-Eleven Central', subBranches: ['สาขาลาดพร้าว', 'สาขาสยาม', 'สาขาบางนา'] },
  { id: 'S2', name: 'Lotus\'s Go Fresh', subBranches: ['สาขาลาดพร้าว', 'สาขาบางนา'] },
  { id: 'S3', name: 'Big C Extra', subBranches: ['สาขาลาดพร้าว'] },
];

export const INITIAL_INFLUENCERS: Influencer[] = [
  { id: 'IF1', name: 'คุณมานี Channel' },
  { id: 'IF2', name: 'รีวิวของกิน 4.0' }
];

export const ALL_VIEWS = [
  View.DASHBOARD,
  View.NEWS_ANNOUNCEMENT,
  View.INVENTORY,
  View.AI_CHAT,
  View.PURCHASING,
  View.INFLUENCER_DEP,
  View.LIVE_DEP,
  View.AFFILIATE_DEP,
  View.BUFFER_DEP,
  View.WAREHOUSE,
  View.SHIPMENTS,
  View.SETTINGS,
  View.EXPORT
];

export const PURCHASING_VIEWS = [
  View.DASHBOARD,
  View.NEWS_ANNOUNCEMENT,
  View.PURCHASING,
  View.INFLUENCER_DEP,
  View.LIVE_DEP,
  View.AFFILIATE_DEP,
  View.BUFFER_DEP,
  View.SHIPMENTS,
  View.AI_CHAT,
  View.EXPORT
];

export const INITIAL_USERS: UserAccount[] = [
  { 
    id: 'U1', 
    name: 'คุณประเสริฐ (Admin)', 
    email: 'admin@laglace.com',
    password: 'password123',
    role: USER_ROLES.WAREHOUSE, 
    canManageAccounts: true, 
    canCreateProducts: true,
    canAdjustStock: true,
    allowedViews: ALL_VIEWS 
  },
  { 
    id: 'U2', 
    name: 'คุณสมชาย (Staff)', 
    email: 'staff@laglace.com',
    password: 'password123',
    role: USER_ROLES.PURCHASING, 
    canManageAccounts: false, 
    canCreateProducts: false,
    canAdjustStock: false,
    allowedViews: PURCHASING_VIEWS 
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ORD-001',
    source: 'purchasing',
    storeName: '7-Eleven Central',
    subBranch: 'สาขาลาดพร้าว',
    productId: 'P001',
    productName: 'น้ำดื่ม 600ml (แพ็ค 12)',
    requestedQuantity: 100,
    quantity: 100,
    status: 'confirmed',
    requestedAt: '2024-05-20T10:30:00',
    processedAt: '2024-05-20T11:00:00Z',
    purchasingDept: 'คุณสมชาย (Staff)'
  },
  {
    id: 'ORD-002',
    source: 'purchasing',
    storeName: "Lotus's Go Fresh",
    subBranch: 'สาขาบางนา',
    productId: 'P002',
    productName: 'ข้าวหอมมะลิ 5kg',
    requestedQuantity: 50,
    quantity: 50,
    status: 'pending',
    requestedAt: '2024-05-21T09:15:00',
    purchasingDept: 'คุณสมชาย (Staff)'
  }
];
