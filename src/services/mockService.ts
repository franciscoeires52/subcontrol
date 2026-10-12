import {
  Customer,
  Plan,
  Subscription,
  Payment,
  SubscriptionWithDetails,
  PaymentWithDetails,
  DashboardMetrics,
  ISubControlService
} from './interface/types';

const STORAGE_KEYS = {
  CUSTOMERS: 'subcontrol_customers',
  PLANS: 'subcontrol_plans',
  SUBSCRIPTIONS: 'subcontrol_subscriptions',
  PAYMENTS: 'subcontrol_payments',
  INITIALIZED: 'subcontrol_initialized_v1',
};

// Helper: network delay simulation (300-500ms)
const delay = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms));

// Format date as YYYY-MM-DD
export function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return formatDateISO(d);
}

export function getTodayISO(): string {
  return formatDateISO(new Date());
}

// Generate human-readable clean unique IDs
function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
}

// Initial seed dataset (3 customers, 2 plans, 3 subscriptions, 2 payments)
function getInitialSeeds() {
  const today = new Date();
  
  // Future date (+8 days)
  const futureDate = new Date(today);
  futureDate.setDate(today.getDate() + 8);

  // Past date (-4 days)
  const pastDate = new Date(today);
  pastDate.setDate(today.getDate() - 4);

  // Older date (-35 days)
  const olderDate = new Date(today);
  olderDate.setDate(today.getDate() - 35);

  const start1 = new Date(today);
  start1.setDate(today.getDate() - 22);

  const start2 = new Date(today);
  start2.setDate(today.getDate() - 34);

  const start3 = new Date(today);
  start3.setDate(today.getDate() - 65);

  const customers: Customer[] = [
    {
      id: 'cust-1',
      name: 'Camila Rocha',
      email: 'camila.rocha@techcorp.com.br',
      status: 'ativo',
      notes: 'Cliente corporativo pioneiro. Faturamento mensal via PIX.',
      created_at: formatDateISO(start3),
    },
    {
      id: 'cust-2',
      name: 'Lucas Silveira',
      email: 'lucas.silveira@estudio.io',
      status: 'ativo',
      notes: 'Estúdio de design e produto digital. Assinatura corporativa.',
      created_at: formatDateISO(start2),
    },
    {
      id: 'cust-3',
      name: 'Beatriz Mendes',
      email: 'beatriz.mendes@consultoria.com',
      status: 'inativo',
      notes: 'Pausou projetos temporariamente até o próximo trimestre.',
      created_at: formatDateISO(start3),
    },
  ];

  const plans: Plan[] = [
    {
      id: 'plan-1',
      name: 'Plano Pro',
      price: 99.0,
      active: true,
      created_at: formatDateISO(start3),
    },
    {
      id: 'plan-2',
      name: 'Plano Enterprise',
      price: 299.0,
      active: true,
      created_at: formatDateISO(start3),
    },
  ];

  const subscriptions: Subscription[] = [
    {
      id: 'sub-1',
      customer_id: 'cust-1',
      plan_id: 'plan-1',
      start_date: formatDateISO(start1),
      next_renewal: formatDateISO(futureDate),
      status: 'ativa',
      created_at: formatDateISO(start1),
    },
    {
      id: 'sub-2',
      customer_id: 'cust-2',
      plan_id: 'plan-2',
      start_date: formatDateISO(start2),
      next_renewal: formatDateISO(pastDate),
      status: 'vencida', // Past date
      created_at: formatDateISO(start2),
    },
    {
      id: 'sub-3',
      customer_id: 'cust-3',
      plan_id: 'plan-1',
      start_date: formatDateISO(start3),
      next_renewal: formatDateISO(olderDate),
      status: 'cancelada',
      created_at: formatDateISO(start3),
    },
  ];

  const payments: Payment[] = [
    {
      id: 'pay-1',
      subscription_id: 'sub-1',
      amount: 99.0,
      paid_at: formatDateISO(start1),
      created_at: formatDateISO(start1),
      notes: 'Primeira mensalidade liquidada via PIX',
    },
    {
      id: 'pay-2',
      subscription_id: 'sub-2',
      amount: 299.0,
      paid_at: formatDateISO(start2),
      created_at: formatDateISO(start2),
      notes: 'Mensalidade inicial via Cartão de Crédito',
    },
  ];

  return { customers, plans, subscriptions, payments };
}

// LocalStorage helpers
function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${key} from localStorage:`, err);
    return fallback;
  }
}

function writeStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Error writing ${key} to localStorage:`, err);
  }
}

// Check and initialize seeds if needed
function ensureSeeds(): void {
  const isInit = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
  const custRaw = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
  if (!isInit || !custRaw) {
    const seeds = getInitialSeeds();
    writeStorage(STORAGE_KEYS.CUSTOMERS, seeds.customers);
    writeStorage(STORAGE_KEYS.PLANS, seeds.plans);
    writeStorage(STORAGE_KEYS.SUBSCRIPTIONS, seeds.subscriptions);
    writeStorage(STORAGE_KEYS.PAYMENTS, seeds.payments);
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
  }
}

// Automatically seed on module load
if (typeof window !== 'undefined') {
  ensureSeeds();
}

/**
 * Mock Service Implementation
 */
export const mockService: ISubControlService = {
  // ===================== CUSTOMERS =====================
  async getCustomers(): Promise<Customer[]> {
    await delay(250);
    ensureSeeds();
    return readStorage<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
  },

  async createCustomer(data: Omit<Customer, 'id' | 'created_at'>): Promise<Customer> {
    await delay(350);
    ensureSeeds();
    const customers = readStorage<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
    const newCustomer: Customer = {
      ...data,
      id: generateId('cust'),
      created_at: getTodayISO(),
    };
    customers.unshift(newCustomer);
    writeStorage(STORAGE_KEYS.CUSTOMERS, customers);
    return newCustomer;
  },

  async updateCustomer(id: string, data: Partial<Omit<Customer, 'id' | 'created_at'>>): Promise<Customer> {
    await delay(350);
    ensureSeeds();
    const customers = readStorage<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
    const index = customers.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error(`Cliente com ID ${id} não encontrado.`);
    }
    const updated: Customer = {
      ...customers[index],
      ...data,
    };
    customers[index] = updated;
    writeStorage(STORAGE_KEYS.CUSTOMERS, customers);
    return updated;
  },

  async deleteCustomer(id: string): Promise<boolean> {
    await delay(350);
    ensureSeeds();
    const customers = readStorage<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
    const filtered = customers.filter((c) => c.id !== id);
    writeStorage(STORAGE_KEYS.CUSTOMERS, filtered);
    return true;
  },

  // ===================== PLANS =====================
  async getPlans(): Promise<Plan[]> {
    await delay(250);
    ensureSeeds();
    return readStorage<Plan[]>(STORAGE_KEYS.PLANS, []);
  },

  async createPlan(data: Omit<Plan, 'id' | 'created_at'>): Promise<Plan> {
    await delay(350);
    ensureSeeds();
    const plans = readStorage<Plan[]>(STORAGE_KEYS.PLANS, []);
    const newPlan: Plan = {
      ...data,
      id: generateId('plan'),
      created_at: getTodayISO(),
    };
    plans.unshift(newPlan);
    writeStorage(STORAGE_KEYS.PLANS, plans);
    return newPlan;
  },

  async updatePlan(id: string, data: Partial<Omit<Plan, 'id' | 'created_at'>>): Promise<Plan> {
    await delay(350);
    ensureSeeds();
    const plans = readStorage<Plan[]>(STORAGE_KEYS.PLANS, []);
    const index = plans.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error(`Plano com ID ${id} não encontrado.`);
    }
    const updated: Plan = {
      ...plans[index],
      ...data,
    };
    plans[index] = updated;
    writeStorage(STORAGE_KEYS.PLANS, plans);
    return updated;
  },

  async deletePlan(id: string): Promise<boolean> {
    await delay(350);
    ensureSeeds();
    const plans = readStorage<Plan[]>(STORAGE_KEYS.PLANS, []);
    const filtered = plans.filter((p) => p.id !== id);
    writeStorage(STORAGE_KEYS.PLANS, filtered);
    return true;
  },

  // ===================== SUBSCRIPTIONS =====================
  async getSubscriptions(): Promise<Subscription[]> {
    await delay(250);
    ensureSeeds();
    const subscriptions = readStorage<Subscription[]>(STORAGE_KEYS.SUBSCRIPTIONS, []);
    const today = getTodayISO();

    // Regra: se hoje > next_renewal e status !== 'cancelada' -> marcar como vencida automaticamente
    let hasChanges = false;
    const evaluated = subscriptions.map((sub) => {
      if (sub.status === 'ativa' && sub.next_renewal < today) {
        hasChanges = true;
        return { ...sub, status: 'vencida' as const };
      }
      return sub;
    });

    if (hasChanges) {
      writeStorage(STORAGE_KEYS.SUBSCRIPTIONS, evaluated);
    }

    return evaluated;
  },

  async getSubscriptionsWithDetails(): Promise<SubscriptionWithDetails[]> {
    const [subs, customers, plans] = await Promise.all([
      this.getSubscriptions(),
      this.getCustomers(),
      this.getPlans(),
    ]);

    const today = getTodayISO();

    return subs.map((sub) => {
      const customer = customers.find((c) => c.id === sub.customer_id);
      const plan = plans.find((p) => p.id === sub.plan_id);

      const isOverdue = sub.status === 'vencida' || (sub.status !== 'cancelada' && sub.next_renewal < today);
      const isDueToday = sub.status !== 'cancelada' && sub.next_renewal === today;

      // Calculate days difference
      const tDate = new Date(today + 'T00:00:00').getTime();
      const rDate = new Date(sub.next_renewal + 'T00:00:00').getTime();
      const diffDays = Math.round((rDate - tDate) / (1000 * 60 * 60 * 24));

      return {
        ...sub,
        customer,
        plan,
        isOverdue,
        isDueToday,
        daysRemaining: diffDays,
      };
    });
  },

  async createSubscription(data: Omit<Subscription, 'id' | 'created_at'>): Promise<Subscription> {
    await delay(350);
    ensureSeeds();
    const subscriptions = readStorage<Subscription[]>(STORAGE_KEYS.SUBSCRIPTIONS, []);
    const today = getTodayISO();

    // Check status based on next_renewal
    let initialStatus = data.status;
    if (data.status !== 'cancelada') {
      if (data.next_renewal < today) {
        initialStatus = 'vencida';
      } else {
        initialStatus = 'ativa';
      }
    }

    const newSub: Subscription = {
      ...data,
      status: initialStatus,
      id: generateId('sub'),
      created_at: today,
    };

    subscriptions.unshift(newSub);
    writeStorage(STORAGE_KEYS.SUBSCRIPTIONS, subscriptions);
    return newSub;
  },

  async updateSubscription(id: string, data: Partial<Omit<Subscription, 'id' | 'created_at'>>): Promise<Subscription> {
    await delay(350);
    ensureSeeds();
    const subscriptions = readStorage<Subscription[]>(STORAGE_KEYS.SUBSCRIPTIONS, []);
    const index = subscriptions.findIndex((s) => s.id === id);
    if (index === -1) {
      throw new Error(`Assinatura com ID ${id} não encontrada.`);
    }

    const current = subscriptions[index];
    const nextRenewal = data.next_renewal ?? current.next_renewal;
    const today = getTodayISO();

    let targetStatus = data.status ?? current.status;
    if (targetStatus !== 'cancelada') {
      if (nextRenewal < today) {
        targetStatus = 'vencida';
      } else if (targetStatus === 'vencida' && nextRenewal >= today) {
        targetStatus = 'ativa';
      }
    }

    const updated: Subscription = {
      ...current,
      ...data,
      status: targetStatus,
    };

    subscriptions[index] = updated;
    writeStorage(STORAGE_KEYS.SUBSCRIPTIONS, subscriptions);
    return updated;
  },

  async deleteSubscription(id: string): Promise<boolean> {
    await delay(350);
    ensureSeeds();
    const subscriptions = readStorage<Subscription[]>(STORAGE_KEYS.SUBSCRIPTIONS, []);
    const filtered = subscriptions.filter((s) => s.id !== id);
    writeStorage(STORAGE_KEYS.SUBSCRIPTIONS, filtered);
    return true;
  },

  // ===================== PAYMENTS =====================
  async getPayments(): Promise<Payment[]> {
    await delay(250);
    ensureSeeds();
    return readStorage<Payment[]>(STORAGE_KEYS.PAYMENTS, []);
  },

  async getPaymentsWithDetails(): Promise<PaymentWithDetails[]> {
    const [payments, subscriptions, customers, plans] = await Promise.all([
      this.getPayments(),
      this.getSubscriptions(),
      this.getCustomers(),
      this.getPlans(),
    ]);

    return payments.map((pay) => {
      const subscription = subscriptions.find((s) => s.id === pay.subscription_id);
      const customer = subscription ? customers.find((c) => c.id === subscription.customer_id) : undefined;
      const plan = subscription ? plans.find((p) => p.id === subscription.plan_id) : undefined;

      return {
        ...pay,
        subscription,
        customer,
        plan,
      };
    });
  },

  /**
   * REGRA CENTRAL:
   * ao registrar pagamento manual -> next_renewal = +30 dias e status = Ativa
   */
  async createPayment(data: Omit<Payment, 'id' | 'created_at'>): Promise<Payment> {
    await delay(450);
    ensureSeeds();
    const payments = readStorage<Payment[]>(STORAGE_KEYS.PAYMENTS, []);
    const subscriptions = readStorage<Subscription[]>(STORAGE_KEYS.SUBSCRIPTIONS, []);
    const today = getTodayISO();

    const newPayment: Payment = {
      ...data,
      id: generateId('pay'),
      paid_at: data.paid_at || today,
      created_at: today,
    };

    payments.unshift(newPayment);
    writeStorage(STORAGE_KEYS.PAYMENTS, payments);

    // Atualiza a assinatura correspondente
    const subIndex = subscriptions.findIndex((s) => s.id === data.subscription_id);
    if (subIndex !== -1) {
      const currentSub = subscriptions[subIndex];
      // Se a data de renovação atual for futura, adiciona 30 dias a ela;
      // se estiver vencida/passada, adiciona 30 dias a partir da data do pagamento
      let baseDate = currentSub.next_renewal;
      if (baseDate < today) {
        baseDate = data.paid_at || today;
      }
      const newRenewal = addDays(baseDate, 30);

      subscriptions[subIndex] = {
        ...currentSub,
        next_renewal: newRenewal,
        status: 'ativa',
      };
      writeStorage(STORAGE_KEYS.SUBSCRIPTIONS, subscriptions);
    }

    return newPayment;
  },

  async listPaymentsBySubscription(subscription_id: string): Promise<Payment[]> {
    await delay(250);
    ensureSeeds();
    const payments = readStorage<Payment[]>(STORAGE_KEYS.PAYMENTS, []);
    return payments.filter((p) => p.subscription_id === subscription_id);
  },

  // ===================== METRICS =====================
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const [customers, subsWithDetails, plans] = await Promise.all([
      this.getCustomers(),
      this.getSubscriptionsWithDetails(),
      this.getPlans(),
    ]);

    const activeCustomers = customers.filter((c) => c.status === 'ativo');
    const activeSubs = subsWithDetails.filter((s) => s.status === 'ativa');
    const overdueSubs = subsWithDetails.filter((s) => s.status === 'vencida');

    // MRR = soma dos planos das assinaturas ativas
    const mrr = activeSubs.reduce((acc, sub) => {
      const planPrice = sub.plan?.price ?? 0;
      return acc + planPrice;
    }, 0);

    // Assinaturas vencidas ou vencendo hoje
    const overdueOrDueTodaySubscriptions = subsWithDetails.filter(
      (s) => s.status === 'vencida' || s.isDueToday
    );

    return {
      totalCustomers: customers.length,
      totalActiveSubscriptions: activeSubs.length,
      overdueSubscriptionsCount: overdueSubs.length,
      mrr,
      overdueOrDueTodaySubscriptions,
    };
  },

  async resetToSeeds(): Promise<void> {
    await delay(300);
    const seeds = getInitialSeeds();
    writeStorage(STORAGE_KEYS.CUSTOMERS, seeds.customers);
    writeStorage(STORAGE_KEYS.PLANS, seeds.plans);
    writeStorage(STORAGE_KEYS.SUBSCRIPTIONS, seeds.subscriptions);
    writeStorage(STORAGE_KEYS.PAYMENTS, seeds.payments);
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
  },
};
