
export type OrderStatus = 'pending' | 'confirmed' | 'cancelled';
export type OrderSource = 'purchasing' | 'influencer' | 'live' | 'affiliate' | 'buffer';

export interface Store {
  id: string;
  name: string;
  subBranches?: string[];
}

export interface Influencer {
  id: string;
  name: string;
}

export type UserRole = string;

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  canManageAccounts: boolean;
  canCreateProducts: boolean;
  canAdjustStock: boolean;
  allowedViews: View[];
}

export interface Announcement {
  id: number;
  title: string;
  detail: string;
  icon: string;
  image?: string;
  color: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  unit: string;
  category: string;
  description?: string;
  barcode13?: string;
  barcodeMT?: string;
  images: string[];
  weight?: number;
  dimensions?: {
    l: number;
    w: number;
    h: number;
  };
  mfd?: string;
  exp?: string;
  lotNumber?: string;
  unitPrice: number;
  leadTime: string;
  stockPurchasing: number;
  stockContent: number;
  stockInfluencer: number;
  stockLive: number;
  stockAffiliate: number;
  stockBuffer: number;
}

export interface OrderItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  originalQuantity: number;
  unitPrice: number;
  stockAtTime?: number;
}

export interface Order {
  id: string;
  poNumber: string;
  source: OrderSource;
  storeName?: string;
  subBranch?: string;
  influencerName?: string;
  targetName?: string;
  recipientName?: string;
  recipientAddress?: string;
  items: OrderItem[];
  totalValue: number;
  status: OrderStatus;
  requestedAt: string;
  processedAt?: string;
  purchasingDept: string;
  warehouseNote?: string;
  trackingNumber?: string;
}

export enum View {
  DASHBOARD = 'DASHBOARD',
  PURCHASING = 'PURCHASING',
  INFLUENCER_DEP = 'INFLUENCER_DEP',
  LIVE_DEP = 'LIVE_DEP',
  AFFILIATE_DEP = 'AFFILIATE_DEP',
  BUFFER_DEP = 'BUFFER_DEP',
  WAREHOUSE = 'WAREHOUSE',
  INVENTORY = 'INVENTORY',
  AI_CHAT = 'AI_CHAT',
  SETTINGS = 'SETTINGS',
  EXPORT = 'EXPORT',
  SHIPMENTS = 'SHIPMENTS',
  NEWS_ANNOUNCEMENT = 'NEWS_ANNOUNCEMENT'
}

export enum InventoryType {
  OVERALL = 'OVERALL',
  PURCHASING = 'PURCHASING',
  CONTENT = 'CONTENT',
  INFLUENCERS = 'INFLUENCERS',
  LIVE = 'LIVE',
  AFFILIATE = 'AFFILIATE',
  BUFFER = 'BUFFER'
}
