/**
 * SubControl - Domain Models and Service Interface
 */

export type CustomerStatus = 'ativo' | 'inativo';

export interface Customer {
  id: string;
  name: string;
  email: string;
  status: CustomerStatus;
  notes?: string;
  created_at: string;
}

export interface Plan {
  id: string;
  name: string;
  price: number; // Monthly price in BRL
  active: boolean;
  created_at: string;
}

export type SubscriptionStatus = 'ativa' | 'vencida' | 'cancelada';

export interface Subscription {
  id: string;
  customer_id: string;
  plan_id: string;
  start_date: string; // YYYY-MM-DD
  next_renewal: string; // YYYY-MM-DD
  status: SubscriptionStatus;
  created_at: string;
}

export interface SubscriptionWithDetails extends Subscription {
  customer?: Customer;
  plan?: Plan;
  isOverdue?: boolean;
  isDueToday?: boolean;
  daysRemaining?: number;
}

export interface Payment {
  id: string;
  subscription_id: string;
  amount: number;
  paid_at: string; // YYYY-MM-DD or ISO string
  created_at: string;
  notes?: string;
}

export interface PaymentWithDetails extends Payment {
  subscription?: Subscription;
  customer?: Customer;
  plan?: Plan;
}

export interface DashboardMetrics {
  totalCustomers: number;
  totalActiveSubscriptions: number;
  overdueSubscriptionsCount: number;
  mrr: number;
  overdueOrDueTodaySubscriptions: SubscriptionWithDetails[];
}

export interface ISubControlService {
  // Customers
  getCustomers(): Promise<Customer[]>;
  createCustomer(data: Omit<Customer, 'id' | 'created_at'>): Promise<Customer>;
  updateCustomer(id: string, data: Partial<Omit<Customer, 'id' | 'created_at'>>): Promise<Customer>;
  deleteCustomer(id: string): Promise<boolean>;

  // Plans
  getPlans(): Promise<Plan[]>;
  createPlan(data: Omit<Plan, 'id' | 'created_at'>): Promise<Plan>;
  updatePlan(id: string, data: Partial<Omit<Plan, 'id' | 'created_at'>>): Promise<Plan>;
  deletePlan(id: string): Promise<boolean>;

  // Subscriptions
  getSubscriptions(): Promise<Subscription[]>;
  getSubscriptionsWithDetails(): Promise<SubscriptionWithDetails[]>;
  createSubscription(data: Omit<Subscription, 'id' | 'created_at'>): Promise<Subscription>;
  updateSubscription(id: string, data: Partial<Omit<Subscription, 'id' | 'created_at'>>): Promise<Subscription>;
  deleteSubscription(id: string): Promise<boolean>;

  // Payments
  getPayments(): Promise<Payment[]>;
  getPaymentsWithDetails(): Promise<PaymentWithDetails[]>;
  createPayment(data: Omit<Payment, 'id' | 'created_at'>): Promise<Payment>;
  listPaymentsBySubscription(subscription_id: string): Promise<Payment[]>;

  // Metrics
  getDashboardMetrics(): Promise<DashboardMetrics>;
  resetToSeeds(): Promise<void>;
}
