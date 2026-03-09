// Full TypeScript types for the SistemaV database schema

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = 'admin' | 'member' | 'client';
export type PersonType = 'individual' | 'company';
export type OrderStatus = 'draft' | 'confirmed' | 'paid' | 'cancelled' | 'packed' | 'shipped' | 'delivered';
export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'refunded';
export type DeliveryType = 'pickup' | 'local_delivery' | 'third_party';
export type DeliveryStatus = 'pending' | 'scheduled' | 'in_transit' | 'delivered' | 'failed' | 'returned';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done';
export type NoteVisibility = 'private' | 'team';
export type OwnerType = 'person' | 'tenant';
export type ObjectType = 'identity_document' | 'digital_file' | 'archive_item' | 'merchandise';
export type InventoryMovementType = 'in' | 'out' | 'adjustment' | 'reservation' | 'release' | 'transfer';
export type FinanceType = 'income' | 'expense';
export type BankTransactionType = 'income' | 'expense' | 'transfer' | 'refund';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  tenant_id: string;
  person_id?: string;
  email: string;
  full_name: string;
  role: UserRole;
  status: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Person {
  id: string;
  tenant_id: string;
  type: PersonType;
  full_name: string;
  display_name?: string;
  document_type?: string;
  document_number?: string;
  birth_date?: string;
  email?: string;
  phone?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Address {
  id: string;
  tenant_id: string;
  person_id?: string;
  label: string;
  street: string;
  number: string;
  complement?: string;
  district?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  latitude?: number;
  longitude?: number;
  is_default: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  price: number;
  cost_price?: number;
  category?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SalesOrder {
  id: string;
  tenant_id: string;
  customer_person_id: string;
  seller_profile_id?: string;
  order_number: string;
  status: OrderStatus;
  subtotal_amount: number;
  discount_amount: number;
  delivery_amount: number;
  total_amount: number;
  payment_status: PaymentStatus;
  payment_method?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // joins
  customer?: Person;
  items?: SalesOrderItem[];
}

export interface SalesOrderItem {
  id: string;
  tenant_id: string;
  order_id: string;
  product_id?: string;
  product_name_snapshot: string;
  sku_snapshot?: string;
  unit_price: number;
  quantity: number;
  discount_amount: number;
  line_total: number;
  created_at: string;
}

export interface Delivery {
  id: string;
  tenant_id: string;
  order_id: string;
  recipient_person_id?: string;
  address_id?: string;
  delivery_type: DeliveryType;
  status: DeliveryStatus;
  scheduled_for?: string;
  dispatched_at?: string;
  delivered_at?: string;
  proof_file_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // joins
  order?: SalesOrder;
  recipient?: Person;
  events?: DeliveryEvent[];
}

export interface DeliveryEvent {
  id: string;
  tenant_id: string;
  delivery_id: string;
  event_type: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  created_by?: string;
  created_at: string;
}

export interface BankAccount {
  id: string;
  tenant_id: string;
  name: string;
  institution: string;
  account_type: string;
  currency: string;
  current_balance: number;
  external_provider?: string;
  external_account_ref?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BankTransaction {
  id: string;
  tenant_id: string;
  bank_account_id: string;
  type: BankTransactionType;
  amount: number;
  currency: string;
  occurred_at: string;
  description?: string;
  reference_type?: string;
  reference_id?: string;
  external_txn_ref?: string;
  status: string;
  created_at: string;
  // joins
  account?: BankAccount;
}

export interface Task {
  id: string;
  tenant_id: string;
  title: string;
  description?: string;
  assigned_to_profile_id?: string;
  created_by?: string;
  due_date?: string;
  priority: TaskPriority;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
  // joins
  assignee?: Profile;
}

export interface Note {
  id: string;
  tenant_id: string;
  title?: string;
  content: string;
  visibility: NoteVisibility;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CalendarEvent {
  id: string;
  tenant_id: string;
  title: string;
  description?: string;
  starts_at: string;
  ends_at?: string;
  created_by?: string;
  related_type?: string;
  related_id?: string;
  created_at: string;
}

export interface FinanceCategory {
  id: string;
  tenant_id: string;
  name: string;
  type: FinanceType;
  created_at: string;
}

export interface FinanceEntry {
  id: string;
  tenant_id: string;
  category_id?: string;
  type: FinanceType;
  amount: number;
  currency: string;
  description?: string;
  occurred_at: string;
  reference_type?: string;
  reference_id?: string;
  created_by?: string;
  created_at: string;
  // joins
  category?: FinanceCategory;
}

export interface Budget {
  id: string;
  tenant_id: string;
  name: string;
  category_id?: string;
  allocated_amount: number;
  spent_amount: number;
  period_start: string;
  period_end: string;
  created_at: string;
  category?: FinanceCategory;
}

export interface ObjectRecord {
  id: string;
  tenant_id: string;
  owner_type: OwnerType;
  owner_person_id?: string;
  owner_tenant_id?: string;
  object_type: ObjectType;
  title: string;
  description?: string;
  status?: string;
  tag_code?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface DigitalFile {
  id: string;
  object_id: string;
  storage_bucket: string;
  storage_path: string;
  mime_type?: string;
  size_bytes?: number;
  checksum?: string;
  uploaded_by?: string;
  uploaded_at: string;
  object?: ObjectRecord;
}

export interface Merchandise {
  id: string;
  object_id: string;
  sku: string;
  barcode?: string;
  unit: string;
  sale_price: number;
  cost_price?: number;
  track_stock: boolean;
  min_stock: number;
  is_active: boolean;
  object?: ObjectRecord;
}

export interface InventoryLocation {
  id: string;
  tenant_id: string;
  name: string;
  type: string;
  is_active: boolean;
  created_at: string;
}

export interface InventoryMovement {
  id: string;
  tenant_id: string;
  merchandise_id: string;
  location_id: string;
  movement_type: InventoryMovementType;
  quantity: number;
  unit_cost?: number;
  reference_type?: string;
  reference_id?: string;
  created_by?: string;
  created_at: string;
  location?: InventoryLocation;
}

export interface InventoryBalance {
  id: string;
  tenant_id: string;
  merchandise_id: string;
  location_id: string;
  quantity_on_hand: number;
  quantity_reserved: number;
  quantity_available: number;
  updated_at: string;
  merchandise?: Merchandise;
  location?: InventoryLocation;
}

// API response types
export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
}

export interface DashboardStats {
  totalSales: number;
  totalOrders: number;
  pendingDeliveries: number;
  revenue: number;
  expense: number;
  lowStockItems: number;
  activeTasks: number;
  recentOrders: SalesOrder[];
  recentDeliveries: Delivery[];
}
