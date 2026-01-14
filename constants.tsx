
import { Product, Order, UserAccount, Store, View, Influencer, Announcement } from './types';

export const USER_ROLES = {
  PURCHASING: 'Purchasing',
  WAREHOUSE: 'Warehouse',
  ADMIN: 'Admin',
  LIVE: 'Live Dept',
  AFFILIATE: 'Affiliate Dept'
};

export const PRODUCT_CATEGORIES = [
  'เครื่องสำอาง (Makeup)',
  'สกินแคร์ (Skincare)',
  'อุปกรณ์ (Accessories)',
  'น้ำหอม (Fragrance)',
  'ของสมนาคุณ (Premiums)',
  'อื่นๆ (Others)'
];

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  { 
    id: 1,
    title: 'ข้อควรระวัง MFG/EXP', 
    icon: '⚠️', 
    detail: 'กรุณาตรวจสอบวันที่ผลิตและวันหมดอายุก่อนบรรจุลงกล่องทุกครั้ง สินค้า Modern Trade ต้องมีอายุเหลือไม่ต่ำกว่า 70% ของอายุสินค้าทั้งหมด ห้ามส่งสินค้าที่เหลืออายุการใช้งานไม่ถึง 6 เดือนเด็ดขาดเพื่อป้องกันการตีคืนสินค้า',
    color: 'red',
    updatedAt: new Date().toISOString()
  },
  { 
    id: 2,
    title: 'กฎการส่งหน้าร้านต่างๆ', 
    icon: '📝', 
    detail: 'ระเบียบการจัดส่งห้างสรรพสินค้า: ต้องมีใบกำกับภาษีเต็มรูปแบบและใบส่งสินค้าตัวจริงแนบไปด้วยเสมอ กรุณาเช็คเงื่อนไขของแต่ละเจ้าในคู่มือพนักงาน ตัวอย่างเช่น 7-Eleven ต้องเข้าคลัง DC ภายใน 08:00 น. เท่านั้น',
    color: 'blue',
    updatedAt: new Date().toISOString()
  },
  { 
    id: 3,
    title: 'สาขาย่อยที่จะเปิดในอนาคต', 
    icon: '🏢', 
    detail: 'อัปเดตสาขาเตรียมเปิดใหม่ไตรมาส 3: 7-Eleven สาขา IconSiam (Zone B), Lotus Go Fresh สาขาใหม่พระราม 2, และ Big C Mini สาขาปากเกร็ด ทีมสต็อกกรุณาสำรองสินค้ากลุ่ม Best Seller เพิ่มขึ้น 15% สำหรับสต็อกเปิดร้าน',
    color: 'emerald',
    updatedAt: new Date().toISOString()
  },
  { 
    id: 4,
    title: 'เส้นทางต่างๆของการส่ง', 
    icon: '🚚', 
    detail: 'เส้นทางเดินรถขนส่งใหม่: เพิ่มเส้นทางรอบเมืองฝั่งตะวันออก (สมุทรปราการ-ชลบุรี) ทุกวันอังคารและพฤหัสบดี, เส้นทางฝั่งตะวันตก (ราชพฤกษ์-พุทธมณฑล) ทุกวันจันทร์และศุกร์ กรุณาวางแผนคัดสินค้าก่อนวันเดินทาง 24 ชม.',
    color: 'pink',
    updatedAt: new Date().toISOString()
  }
];

export const INITIAL_PRODUCTS: Product[] = [
  { 
    id: 'P001', 
    sku: '845125118',
    name: 'น้ำเปล่า', 
    unit: 'แพ็ค', 
    category: 'อื่นๆ (Others)',
    description: 'น้ำดื่มสะอาดผ่านกระบวนการ RO',
    barcode13: '8850000000012',
    barcodeMT: 'MT-WTR-001',
    images: ['https://images.unsplash.com/photo-1523362628744-0c100150b504?auto=format&fit=crop&q=80&w=300'],
    weight: 7.2,
    dimensions: { l: 30, w: 20, h: 25 },
    unitPrice: 10,
    leadTime: '1 day',
    stockPurchasing: 30,
    stockContent: 250,
    stockInfluencer: 750,
    stockLive: 300,
    stockAffiliate: 200,
    stockBuffer: 1000,
    lotNumber: 'L2401',
    mfd: '2024-01-01',
    exp: '2025-01-01'
  },
  { 
    id: 'P003', 
    sku: '83840528',
    name: 'น้ำมันพืช 1L', 
    unit: 'ขวด', 
    category: 'อื่นๆ (Others)',
    description: 'น้ำมันปาล์มคุณภาพสูงสำหรับการทอด',
    barcode13: '8850000000101',
    barcodeMT: 'MT-OIL-001',
    images: ['https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=300'],
    weight: 1.0,
    unitPrice: 20,
    leadTime: '1 day',
    stockPurchasing: 300,
    stockContent: 100,
    stockInfluencer: 200,
    stockLive: 150,
    stockAffiliate: 80,
    stockBuffer: 400,
    lotNumber: 'L2402',
    mfd: '2024-02-01',
    exp: '2025-02-01'
  }
];

export const INITIAL_STORES: Store[] = [
  { id: 'S1', name: '7-Eleven', subBranches: ['บางนา', 'ลาดพร้าว', 'สยาม'] },
  { id: 'S2', name: 'Lotus\'s Go Fresh', subBranches: ['บางนา', 'พระราม 2'] },
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
    id: 'TXN-001',
    poNumber: 'PO-42136',
    source: 'purchasing',
    storeName: '7-Eleven',
    subBranch: 'บางนา',
    items: [
      {
        productId: 'P003',
        productName: 'น้ำมันพืช 1L',
        sku: '83840528',
        quantity: 20,
        originalQuantity: 20,
        unitPrice: 20,
        stockAtTime: 300
      },
      {
        productId: 'P001',
        productName: 'น้ำเปล่า',
        sku: '845125118',
        quantity: 5,
        originalQuantity: 5,
        unitPrice: 10,
        stockAtTime: 30
      }
    ],
    totalValue: 450,
    status: 'pending',
    requestedAt: '2026-01-14T19:00:00',
    purchasingDept: 'คุณหมวย'
  }
];
