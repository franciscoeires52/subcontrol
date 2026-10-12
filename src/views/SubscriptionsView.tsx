import React, { useState, useEffect, useCallback } from 'react';
import {
  getSubscriptionsWithDetails,
  getCustomers,
  getPlans,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  createPayment,
  SubscriptionWithDetails,
  Customer,
  Plan,
  SubscriptionStatus,
} from '@/services';
import { formatCurrency, formatDateBR } from '@/utils/formatters';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Modal } from '@/components/common/Modal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useToast } from '@/context/ToastContext';
import {
  Repeat,
  Plus,
  Search,
  Edit2,
  Trash2,
  Receipt,
  Calendar,
  AlertTriangle,
  Clock,
  X,
  CreditCard,
  User,
} from 'lucide-react';

export function SubscriptionsView() {
  const toast = useToast();

  const [subscriptions, setSubscriptions] = useState<SubscriptionWithDetails[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | SubscriptionStatus>('all');

  // Modal Create/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<SubscriptionWithDetails | null>(null);
  const [formData, setFormData] = useState({
    customer_id: '',
    plan_id: '',
    start_date: '',
    next_renewal: '',
    status: 'ativa' as SubscriptionStatus,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick Payment Modal
  const [paymentSub, setPaymentSub] = useState<SubscriptionWithDetails | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payDate, setPayDate] = useState<string>('');
  const [payNotes, setPayNotes] = useState<string>('');
  const [isPaying, setIsPaying] = useState(false);

  // Delete dialog
  const [subToDelete, setSubToDelete] = useState<SubscriptionWithDetails | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadAll = useCallback(async () => {
    try {
      setIsLoading(true);
      const [subsData, custsData, plansData] = await Promise.all([
        getSubscriptionsWithDetails(),
        getCustomers(),
        getPlans(),
      ]);
      setSubscriptions(subsData);
      setCustomers(custsData);
      setPlans(plansData);
    } catch {
      toast.error('Erro ao carregar dados de assinaturas.');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleOpenCreate = () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // default next renewal = today + 30 days
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + 30);
    const nextStr = nextDate.toISOString().split('T')[0];

    // Pick first active customer and plan if available
    const firstCust = customers.find((c) => c.status === 'ativo') || customers[0];
    const firstPlan = plans.find((p) => p.active) || plans[0];

    setEditingSub(null);
    setFormData({
      customer_id: firstCust?.id || '',
      plan_id: firstPlan?.id || '',
      start_date: todayStr,
      next_renewal: nextStr,
      status: 'ativa',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sub: SubscriptionWithDetails) => {
    setEditingSub(sub);
    setFormData({
      customer_id: sub.customer_id,
      plan_id: sub.plan_id,
      start_date: sub.start_date,
      next_renewal: sub.next_renewal,
      status: sub.status,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer_id || !formData.plan_id) {
      toast.error('Selecione um cliente e um plano.');
      return;
    }

    if (!formData.start_date || !formData.next_renewal) {
      toast.error('Informe a data de início e a data da próxima renovação.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingSub) {
        await updateSubscription(editingSub.id, {
          customer_id: formData.customer_id,
          plan_id: formData.plan_id,
          start_date: formData.start_date,
          next_renewal: formData.next_renewal,
          status: formData.status,
        });
        toast.success('Assinatura atualizada com sucesso!');
      } else {
        await createSubscription({
          customer_id: formData.customer_id,
          plan_id: formData.plan_id,
          start_date: formData.start_date,
          next_renewal: formData.next_renewal,
          status: formData.status,
        });
        toast.success('Assinatura criada com sucesso!');
      }
      setIsModalOpen(false);
      await loadAll();
    } catch {
      toast.error('Erro ao salvar assinatura.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenPayment = (sub: SubscriptionWithDetails) => {
    setPaymentSub(sub);
    setPayAmount(sub.plan?.price || 0);
    setPayDate(new Date().toISOString().split('T')[0]);
    setPayNotes(`Mensalidade plano ${sub.plan?.name || ''}`);
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentSub) return;

    setIsPaying(true);
    try {
      await createPayment({
        subscription_id: paymentSub.id,
        amount: Number(payAmount),
        paid_at: payDate,
        notes: payNotes,
      });

      toast.success(
        `Pagamento de ${formatCurrency(payAmount)} registrado! Renovação estendida em +30 dias e status reativado.`
      );
      setPaymentSub(null);
      await loadAll();
    } catch {
      toast.error('Erro ao registrar pagamento.');
    } finally {
      setIsPaying(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!subToDelete) return;
    setIsDeleting(true);
    try {
      await deleteSubscription(subToDelete.id);
      toast.success('Assinatura removida com sucesso.');
      setSubToDelete(null);
      await loadAll();
    } catch {
      toast.error('Erro ao excluir assinatura.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered subscriptions
  const filteredSubs = subscriptions.filter((sub) => {
    const custName = sub.customer?.name || '';
    const custEmail = sub.customer?.email || '';
    const planName = sub.plan?.name || '';

    const matchesSearch =
      custName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      custEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      planName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ? true : sub.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Assinaturas
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
            Controle de contratos ativos, datas de vencimento e renovações recorrentes.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-medium rounded-xl transition-colors shadow-md shadow-indigo-600/20 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Assinatura</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por cliente ou plano..."
            className="w-full pl-9 pr-8 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status segmented tabs */}
        <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              statusFilter === 'all'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Todas ({subscriptions.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('ativa')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              statusFilter === 'ativa'
                ? 'bg-zinc-800 text-emerald-400 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Ativas ({subscriptions.filter((s) => s.status === 'ativa').length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('vencida')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              statusFilter === 'vencida'
                ? 'bg-zinc-800 text-rose-400 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Vencidas ({subscriptions.filter((s) => s.status === 'vencida').length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('cancelada')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              statusFilter === 'cancelada'
                ? 'bg-zinc-800 text-zinc-400 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Canceladas ({subscriptions.filter((s) => s.status === 'cancelada').length})
          </button>
        </div>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div className="min-h-[250px] flex items-center justify-center">
          <LoadingSpinner size="lg" text="Carregando assinaturas..." />
        </div>
      ) : filteredSubs.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-zinc-800 text-zinc-500 flex items-center justify-center mx-auto mb-3">
            <Repeat className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-200">
            Nenhuma assinatura encontrada
          </h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
            {searchTerm || statusFilter !== 'all'
              ? 'Nenhum resultado corresponde aos filtros aplicados.'
              : 'Vincule clientes aos planos cadastrados criando uma nova assinatura.'}
          </p>
          {!(searchTerm || statusFilter !== 'all') && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Criar Nova Assinatura</span>
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider bg-zinc-950/40">
                  <th className="px-5 py-3">Cliente</th>
                  <th className="px-5 py-3">Plano</th>
                  <th className="px-5 py-3">Início</th>
                  <th className="px-5 py-3">Próxima Renovação</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80 text-sm">
                {filteredSubs.map((sub) => {
                  const days = sub.daysRemaining ?? 0;
                  const isPast = days < 0;
                  const isToday = days === 0;

                  return (
                    <tr key={sub.id} className="hover:bg-zinc-850/40 transition-colors">
                      <td className="px-5 py-4">
                        <div>
                          <span className="font-semibold text-zinc-100">
                            {sub.customer?.name || 'Cliente desconhecido'}
                          </span>
                          <div className="text-xs text-zinc-400 mt-0.5">
                            {sub.customer?.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div>
                          <span className="font-medium text-zinc-200">
                            {sub.plan?.name || 'Plano'}
                          </span>
                          <div className="text-xs text-zinc-400 mt-0.5">
                            {formatCurrency(sub.plan?.price || 0)}/mês
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs text-zinc-400">
                        {formatDateBR(sub.start_date)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-xs">
                          <span
                            className={`font-semibold ${
                              isPast
                                ? 'text-rose-400'
                                : isToday
                                ? 'text-amber-400'
                                : 'text-zinc-200'
                            }`}
                          >
                            {formatDateBR(sub.next_renewal)}
                          </span>
                          {sub.status !== 'cancelada' && (
                            <p
                              className={`text-[11px] mt-0.5 ${
                                isPast
                                  ? 'text-rose-400'
                                  : isToday
                                  ? 'text-amber-400'
                                  : 'text-zinc-500'
                              }`}
                            >
                              {isToday
                                ? 'Vence hoje'
                                : isPast
                                ? `${Math.abs(days)}d em atraso`
                                : `Em ${days} dias`}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={sub.status} />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Quick Payment Action */}
                          <button
                            type="button"
                            onClick={() => handleOpenPayment(sub)}
                            className="px-2.5 py-1 text-xs font-medium text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 hover:bg-emerald-950/70 border border-emerald-800/40 rounded-lg transition-colors flex items-center gap-1"
                            title="Registrar pagamento manual (+30 dias)"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            <span>Pagar</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(sub)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
                            title="Editar assinatura"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSubToDelete(sub)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                            title="Excluir assinatura"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile / Tablet Cards View */}
          <div className="lg:hidden space-y-3">
            {filteredSubs.map((sub) => {
              const days = sub.daysRemaining ?? 0;
              const isPast = days < 0;
              const isToday = days === 0;

              return (
                <div
                  key={sub.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-sm text-zinc-100">
                        {sub.customer?.name}
                      </h3>
                      <p className="text-xs text-zinc-400">{sub.customer?.email}</p>
                    </div>
                    <StatusBadge status={sub.status} />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/80">
                    <div>
                      <span className="text-zinc-500">Plano:</span>
                      <p className="font-semibold text-zinc-200 mt-0.5">
                        {sub.plan?.name} ({formatCurrency(sub.plan?.price || 0)})
                      </p>
                    </div>
                    <div>
                      <span className="text-zinc-500">Próxima Renovação:</span>
                      <p
                        className={`font-semibold mt-0.5 ${
                          isPast
                            ? 'text-rose-400'
                            : isToday
                            ? 'text-amber-400'
                            : 'text-zinc-200'
                        }`}
                      >
                        {formatDateBR(sub.next_renewal)}
                        {sub.status !== 'cancelada' && (
                          <span className="text-[10px] block font-normal text-zinc-400">
                            {isToday
                              ? 'Vence hoje'
                              : isPast
                              ? `${Math.abs(days)}d atrasado`
                              : `Em ${days} dias`}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                    <span className="text-zinc-500">
                      Início: {formatDateBR(sub.start_date)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenPayment(sub)}
                        className="px-2.5 py-1 text-xs font-medium text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 border border-emerald-800/50 rounded-lg flex items-center gap-1 transition-colors"
                      >
                        <Receipt className="w-3 h-3" />
                        <span>Pagar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(sub)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setSubToDelete(sub)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Modal: Create/Edit Subscription */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSub ? 'Editar Assinatura' : 'Nova Assinatura'}
        description="Selecione o cliente, o plano e defina a periodicidade do contrato."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Cliente *
            </label>
            <select
              required
              value={formData.customer_id}
              onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              <option value="" disabled>Selecione um cliente...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.email}) {c.status === 'inativo' ? '[Inativo]' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Plano *
            </label>
            <select
              required
              value={formData.plan_id}
              onChange={(e) => setFormData({ ...formData, plan_id: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              <option value="" disabled>Selecione um plano...</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} - {formatCurrency(p.price)}/mês {!p.active ? '[Desativado]' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Data de Início *
              </label>
              <input
                type="date"
                required
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Próxima Renovação *
              </label>
              <input
                type="date"
                required
                value={formData.next_renewal}
                onChange={(e) =>
                  setFormData({ ...formData, next_renewal: e.target.value })
                }
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Status da Assinatura
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as SubscriptionStatus,
                })
              }
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              <option value="ativa">Ativa</option>
              <option value="vencida">Vencida</option>
              <option value="cancelada">Cancelada</option>
            </select>
            <p className="text-[11px] text-zinc-500 mt-1">
              * Nota: se a data de renovação estiver no passado, o sistema marcará automaticamente como vencida.
            </p>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 shadow-md shadow-indigo-600/20 disabled:opacity-50"
            >
              {isSubmitting && <LoadingSpinner size="sm" />}
              <span>{editingSub ? 'Salvar Alterações' : 'Criar Assinatura'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Quick Payment on Subscription */}
      <Modal
        isOpen={!!paymentSub}
        onClose={() => setPaymentSub(null)}
        title="Registrar Pagamento Manual"
        description="Ao confirmar, o status voltará para Ativa e a data de renovação será avançada em +30 dias."
      >
        {paymentSub && (
          <form onSubmit={handleSavePayment} className="space-y-4">
            <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-zinc-400">Cliente:</span>
                <span className="font-semibold text-zinc-200">{paymentSub.customer?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Plano:</span>
                <span className="font-semibold text-zinc-200">
                  {paymentSub.plan?.name} ({formatCurrency(paymentSub.plan?.price || 0)})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Renovação Atual:</span>
                <span className="font-medium text-rose-400">
                  {formatDateBR(paymentSub.next_renewal)}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Valor do Pagamento (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={payAmount}
                onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Data do Pagamento *
              </label>
              <input
                type="date"
                required
                value={payDate}
                onChange={(e) => setPayDate(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Observações
              </label>
              <input
                type="text"
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
                placeholder="Ex: Pagamento confirmado via PIX"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setPaymentSub(null)}
                className="px-3 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPaying}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-600/20 disabled:opacity-50"
              >
                {isPaying && <LoadingSpinner size="sm" />}
                <span>Confirmar e Renovar</span>
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!subToDelete}
        onClose={() => setSubToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Excluir Assinatura?"
        message={`Deseja remover a assinatura de "${subToDelete?.customer?.name}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir Assinatura"
        cancelText="Cancelar"
        isDangerous={true}
        isLoading={isDeleting}
      />
    </div>
  );
}
