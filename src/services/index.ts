import { mockService } from './mockService';
import { supabaseService } from './supabaseService';
import { ISubControlService } from './interface/types';

// O serviço ativo atual é o Supabase Service conectado ao banco de dados Supabase
export const activeService: ISubControlService = supabaseService;

// Re-export das funções individuais para consumo direto e limpo nos componentes
export const getCustomers = () => activeService.getCustomers();
export const createCustomer = (data: Parameters<ISubControlService['createCustomer']>[0]) =>
  activeService.createCustomer(data);
export const updateCustomer = (
  id: string,
  data: Parameters<ISubControlService['updateCustomer']>[1]
) => activeService.updateCustomer(id, data);
export const deleteCustomer = (id: string) => activeService.deleteCustomer(id);

export const getPlans = () => activeService.getPlans();
export const createPlan = (data: Parameters<ISubControlService['createPlan']>[0]) =>
  activeService.createPlan(data);
export const updatePlan = (
  id: string,
  data: Parameters<ISubControlService['updatePlan']>[1]
) => activeService.updatePlan(id, data);
export const deletePlan = (id: string) => activeService.deletePlan(id);

export const getSubscriptions = () => activeService.getSubscriptions();
export const getSubscriptionsWithDetails = () => activeService.getSubscriptionsWithDetails();
export const createSubscription = (data: Parameters<ISubControlService['createSubscription']>[0]) =>
  activeService.createSubscription(data);
export const updateSubscription = (
  id: string,
  data: Parameters<ISubControlService['updateSubscription']>[1]
) => activeService.updateSubscription(id, data);
export const deleteSubscription = (id: string) => activeService.deleteSubscription(id);

export const getPayments = () => activeService.getPayments();
export const getPaymentsWithDetails = () => activeService.getPaymentsWithDetails();
export const createPayment = (data: Parameters<ISubControlService['createPayment']>[0]) =>
  activeService.createPayment(data);
export const listPaymentsBySubscription = (subscription_id: string) =>
  activeService.listPaymentsBySubscription(subscription_id);

export const getDashboardMetrics = () => activeService.getDashboardMetrics();
export const resetToSeeds = () => activeService.resetToSeeds();

export * from './interface/types';
export { mockService, supabaseService };

