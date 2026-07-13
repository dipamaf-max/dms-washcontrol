export type Role = 'ADMIN' | 'OWNER' | 'EMPLOYEE';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
}

export interface Station {
  id: string;
  name: string;
  address: string;
  phone: string;
  ownerId: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  fullName: string;
  phone: string;
  loyaltyPoints: number;
  stationId: string;
  createdAt: string;
  _count?: { washOrders: number; vehicles: number };
}

export interface Vehicle {
  id: string;
  plateNumber: string;
  type: string;
  brand?: string;
  model?: string;
  color?: string;
  qrCodeToken: string;
  customerId: string;
  stationId: string;
  customer?: Customer;
}

export interface ServiceItem {
  id: string;
  name: string;
  description?: string;
  price: string;
  durationMinutes: number;
  stationId: string;
}

export type WashOrderStatus = 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'DELIVERED';

export interface WashOrder {
  id: string;
  status: WashOrderStatus;
  price: string;
  arrivedAt: string;
  startedAt?: string;
  finishedAt?: string;
  deliveredAt?: string;
  stationId: string;
  customer: Customer;
  vehicle: Vehicle;
  service: ServiceItem;
  employeeId?: string;
}

export interface Employee {
  id: string;
  position: string;
  commissionRate: string;
  hiredAt: string;
  isActive: boolean;
  stationId: string;
  user: { id: string; email: string; fullName: string; phone?: string };
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: string;
  unit: string;
  alertThreshold: string;
  stationId: string;
}

export interface Transaction {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  amount: string;
  category: string;
  description?: string;
  date: string;
  stationId: string;
}

export interface DashboardOverview {
  revenueToday: number;
  expensesToday: number;
  profitToday: number;
  vehiclesWashedToday: number;
  activeEmployees: number;
  topCustomers: { id: string; fullName: string; loyaltyPoints: number; washCount: number }[];
}

export interface SubscriptionPlan {
  id: string;
  type: 'STARTER' | 'BUSINESS' | 'PREMIUM';
  name: string;
  monthlyPrice: string;
}
