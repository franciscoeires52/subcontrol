import { supabase } from './supabaseClient';
import {
  Customer,
  Plan,
  Subscription,
  Payment,
  SubscriptionWithDetails,
  PaymentWithDetails,
  DashboardMetrics,
  ISubControlService,
} from './interface/types';

function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return formatDateISO(d);
}

function getTodayISO(): string {
  return formatDateISO(new Date());
}

export const supabaseService: ISubControlService = {
  // ===================== CUSTOMERS =====================
  async getCustomers(): Promise<Customer[]> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }
    return (data || []) as Customer[];
  },

  async createCustomer(data: Omit<Customer, 'id' | 'created_at'>): Promise<Customer> {
    const { data: created, error } = await supabase
      .from('customers')
      .insert([data])
      .select()
      .single();

    if (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
    return created as Customer;
  },

  async updateCustomer(
    id: string,
    data: Partial<Omit<Customer, 'id' | 'created_at'>>
  ): Promise<Customer> {
    const { data: updated, error } = await supabase
      .from('customers')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
    return updated as Customer;
  },

  async deleteCustomer(id: string): Promise<boolean> {
    const { error } = await supabase.from('customers').delete().eq('id', id);

    if (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
    return true;
  },

  // ===================== PLANS =====================
  async getPlans(): Promise<Plan[]> {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching plans:', error);
      throw error;
    }
    return (data || []).map((p) => ({
      ...p,
      price: Number(p.price),
    })) as Plan[];
  },

  async createPlan(data: Omit<Plan, 'id' | 'created_at'>): Promise<Plan> {
    const { data: created, error } = await supabase
      .from('plans')
      .insert([data])
      .select()
      .single();

    if (error) {
      console.error('Error creating plan:', error);
      throw error;
    }
    return {
      ...created,
      price: Number(created.price),
    } as Plan;
  },

  async updatePlan(
    id: string,
    data: Partial<Omit<Plan, 'id' | 'created_at'>>
  ): Promise<Plan> {
    const { data: updated, error } = await supabase
      .from('plans')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating plan:', error);
      throw error;
    }
    return {
      ...updated,
      price: Number(updated.price),
    } as Plan;
  },

  async deletePlan(id: string): Promise<boolean> {
    const { error } = await supabase.from('plans').delete().eq('id', id);

    if (error) {
      console.error('Error deleting plan:', error);
      throw error;
    }
    return true;
  },

  // ===================== SUBSCRIPTIONS =====================
  async getSubscriptions(): Promise<Subscription[]> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching subscriptions:', error);
      throw error;
    }

    const today = getTodayISO();
    return (data || []).map((sub) => {
      let status = sub.status as Subscription['status'];
      if (status === 'ativa' && sub.next_renewal < today) {
        status = 'vencida';
      }
      return {
        ...sub,
        status,
      };
    }) as Subscription[];
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

      const isOverdue =
        sub.status === 'vencida' || (sub.status !== 'cancelada' && sub.next_renewal < today);
      const isDueToday = sub.status !== 'cancelada' && sub.next_renewal === today;

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

  async createSubscription(
    data: Omit<Subscription, 'id' | 'created_at'>
  ): Promise<Subscription> {
    const today = getTodayISO();
    let initialStatus = data.status;
    if (data.status !== 'cancelada') {
      if (data.next_renewal < today) {
        initialStatus = 'vencida';
      } else {
        initialStatus = 'ativa';
      }
    }

    const payload = {
      ...data,
      status: initialStatus,
    };

    const { data: created, error } = await supabase
      .from('subscriptions')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
    return created as Subscription;
  },

  async updateSubscription(
    id: string,
    data: Partial<Omit<Subscription, 'id' | 'created_at'>>
  ): Promise<Subscription> {
    const today = getTodayISO();
    let targetStatus = data.status;

    if (data.next_renewal) {
      if (targetStatus !== 'cancelada') {
        if (data.next_renewal < today) {
          targetStatus = 'vencida';
        } else if (targetStatus === 'vencida' && data.next_renewal >= today) {
          targetStatus = 'ativa';
        }
      }
    }

    const payload = {
      ...data,
      ...(targetStatus ? { status: targetStatus } : {}),
    };

    const { data: updated, error } = await supabase
      .from('subscriptions')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
    return updated as Subscription;
  },

  async deleteSubscription(id: string): Promise<boolean> {
    const { error } = await supabase.from('subscriptions').delete().eq('id', id);

    if (error) {
      console.error('Error deleting subscription:', error);
      throw error;
    }
    return true;
  },

  // ===================== PAYMENTS =====================
  async getPayments(): Promise<Payment[]> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .order('paid_at', { ascending: false });

    if (error) {
      console.error('Error fetching payments:', error);
      throw error;
    }
    return (data || []).map((p) => ({
      ...p,
      amount: Number(p.amount),
    })) as Payment[];
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
      const customer = subscription
        ? customers.find((c) => c.id === subscription.customer_id)
        : undefined;
      const plan = subscription
        ? plans.find((p) => p.id === subscription.plan_id)
        : undefined;

      return {
        ...pay,
        subscription,
        customer,
        plan,
      };
    });
  },

  async createPayment(data: Omit<Payment, 'id' | 'created_at'>): Promise<Payment> {
    const today = getTodayISO();
    const paymentPayload = {
      subscription_id: data.subscription_id,
      amount: data.amount,
      paid_at: data.paid_at || today,
      notes: data.notes || '',
    };

    const { data: created, error } = await supabase
      .from('payments')
      .insert([paymentPayload])
      .select()
      .single();

    if (error) {
      console.error('Error creating payment:', error);
      throw error;
    }

    // Regra central: atualizar a assinatura correspondente (+30 dias e status 'ativa')
    try {
      const { data: currentSub } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('id', data.subscription_id)
        .maybeSingle();

      if (currentSub) {
        let baseDate = currentSub.next_renewal;
        if (baseDate < today) {
          baseDate = data.paid_at || today;
        }
        const newRenewal = addDays(baseDate, 30);

        await supabase
          .from('subscriptions')
          .update({
            next_renewal: newRenewal,
            status: 'ativa',
          })
          .eq('id', data.subscription_id);
      }
    } catch (subErr) {
      console.warn('Failed to auto-advance subscription renewal:', subErr);
    }

    return {
      ...created,
      amount: Number(created.amount),
    } as Payment;
  },

  async listPaymentsBySubscription(subscription_id: string): Promise<Payment[]> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('subscription_id', subscription_id)
      .order('paid_at', { ascending: false });

    if (error) {
      console.error('Error fetching payments by subscription:', error);
      throw error;
    }
    return (data || []).map((p) => ({
      ...p,
      amount: Number(p.amount),
    })) as Payment[];
  },

  // ===================== METRICS =====================
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const [customers, subsWithDetails] = await Promise.all([
      this.getCustomers(),
      this.getSubscriptionsWithDetails(),
    ]);

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
    // Limpar tabelas filhas primeiro para respeitar integridade referencial
    await supabase.from('payments').delete().neq('id', '');
    await supabase.from('subscriptions').delete().neq('id', '');
    await supabase.from('plans').delete().neq('id', '');
    await supabase.from('customers').delete().neq('id', '');

    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + 8);
    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - 4);
    const olderDate = new Date(today);
    olderDate.setDate(today.getDate() - 35);
    const start1 = new Date(today);
    start1.setDate(today.getDate() - 22);
    const start2 = new Date(today);
    start2.setDate(today.getDate() - 34);
    const start3 = new Date(today);
    start3.setDate(today.getDate() - 65);

    await supabase.from('customers').insert([
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
    ]);

    await supabase.from('plans').insert([
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
    ]);

    await supabase.from('subscriptions').insert([
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
        status: 'vencida',
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
    ]);

    await supabase.from('payments').insert([
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
    ]);
  },
};
