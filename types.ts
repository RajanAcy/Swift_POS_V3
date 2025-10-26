import { ReactNode } from 'react';

export interface Product {
  id: string;
  name: string;
  image?: string | null;
  category: string;
  stock: number;
  buyingPrice: number;
  sellingPrice: number;
  size?: string | null;
  color?: string | null;
  supplierId?: string | null;
  barcode?: string | null;
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  discount: number;
  total: number;
}

export interface Sale {
  id: string;
  date: string; // YYYY-MM-DD
  time: string;
  customerType: string;
  customerId?: string;
  paymentMethod: string;
  items: CartItem[];
  total: number;
  profit: number;
  amountPaid: number;
  orderDiscount: number;
  change: number;
  notes?: string;
}

export interface CustomerPayment {
  id: string;
  date: string;
  customerId: string;
  amount: number;
  notes?: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  date: string; // YYYY-MM-DD
  description?: string | null;
  supplierId?: string; // For supplier payments
}

export interface Customer {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  activationDate?: string | null;
  interestCategories?: string[];
}

export interface Purchase {
  id: string;
  date: string; // YYYY-MM-DD
  supplierId: string;
  productId: string;
  quantity: number;
  unitCost: number; // buyingPrice at time of purchase
  totalCost: number;
}

export interface CompanyInfo {
  name: string;
  logo?: string | null;
  address?: string | null;
  phone?: string | null;
}

export interface SystemSettings {
  businessType: 'clothing' | 'pharmacy' | 'convenience' | 'hardware';
  currency: 'MMK' | 'USD' | 'EUR';
  taxRate: number;
  enableNotifications: boolean;
  enableSound: boolean;
  lowStockThreshold: number;
  receiptSize: 'standard' | '80mm' | '58mm';
  receiptFooter: string;
  storagePreference: 'local' | 'online';
  storagePath: string;
}

export type Category = string;