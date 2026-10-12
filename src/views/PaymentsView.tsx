import React, { useState, useEffect, useCallback } from 'react';
import {
  getPaymentsWithDetails,
  getSubscriptionsWithDetails,
  createPayment,
  PaymentWithDetails,
  SubscriptionWithDetails,
} from '@/services';
import { formatCurrency, formatDateBR } from '@/utils/formatters';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Modal } from '@/components/common/Modal';
import { useToast } from '@/context/ToastContext';
import { useRouter } from '@/context/RouterContext';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  Calendar,
  CreditCard,
  CheckCircle2,
  X,
  ArrowUpRight,
} from 'lucide-react';

export function PaymentsView() {
  const toast = useToast();
  const { params } = useRouter();

  const [payments, setPayments] = useState<PaymentWithDetails[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string>(
    params.sub || 'all'
  );
  const [searchTerm, setSearchTerm] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    subscription_id: '',
    amount: 0,
    paid_at: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [pays, subs] = await Promise.all([
        getPaymentsWithDetails(),
        getSubscriptionsWithDetails(),
      ]);
      setPayments(pays);
      setSubscriptions(subs);
    } catch {
      toast.error('Erro ao listar pagamentos.');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenCreate = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const initialSub = subscriptions[0];

    setFormData({
      subscription_id: initialSub?.id || '',
      amount: initialSub?.plan?.price || 0,
      paid_at: todayStr,
      notes: 'Pagamento de renovação manual',
    });
    setIsModalOpen(true);
  };

  const handleSubscriptionChange = (subId: string) => {
    const foundSub = subscriptions.find((s) => s.id === subId);
    setFormData((prev) => ({
      ...prev,
      subscription_id: subId,
      amount: foundSub?.plan?.price || prev.amount,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subscription_id) {
      toast.error('Selecione uma assinatura.');
      return;
    }

    if (formData.amount <= 0) {
      toast.error('O valor do pagamento deve ser maior que zero.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createPayment({
        subscription_id: formData.subscription_id,
        amount: Number(formData.amount),
        paid_at: formData.paid_at,
        notes: formData.notes.trim() || undefined,
      });

      toast.success(
        `Pagamento de ${formatCurrency(formData.amount)} lançado com sucesso! Assinatura renovada (+30 dias) e ativada.`
      );
      setIsModalOpen(false);
      await loadData();
    } catch {
      toast.error('Erro ao lançar pagamento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered payments
  const filteredPayments = payments.filter((p) => {
    const matchesSub =
      selectedSubscriptionId === 'all'
        ? true
        : p.subscription_id === selectedSubscriptionId;

    const custName = p.customer?.name || '';
    const planName = p.plan?.name || '';
    const notes = p.notes || '';

    const matchesSearch =
      custName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      planName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notes.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSub && matchesSearch;
  });

  // Total amount calculated from filtered list
  const totalReceived = filteredPayments.reduce((acc, p) => acc + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Pagamentos
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
            Registro e auditoria de pagamentos recebidos por assinatura.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-medium rounded-xl transition-colors shadow-md shadow-indigo-600/20 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Pagamento</span>
        </button>
      </div>

      {/* Summary Mini-Card & Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400">Total Listado</span>
            <div className="text-lg font-bold text-white mt-0.5">
              {formatCurrency(totalReceived)}
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between sm:col-span-2">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-indigo-400" />
            <div>
              <p className="text-xs font-semibold text-zinc-200">Regra de Renovação Ativa</p>
              <p className="text-[11px] text-zinc-400">
                Todo pagamento registrado estende a renovação em +30 dias e define status como Ativa.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 sm:p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por cliente, plano ou método..."
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

        {/* Subscription select filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-zinc-500 shrink-0" />
          <select
            value={selectedSubscriptionId}
            onChange={(e) => setSelectedSubscriptionId(e.target.value)}
            className="w-full md:w-64 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs sm:text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            <option value="all">Todas as assinaturas ({payments.length})</option>
            {subscriptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.customer?.name} - {s.plan?.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div className="min-h-[250px] flex items-center justify-center">
          <LoadingSpinner size="lg" text="Carregando pagamentos..." />
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-zinc-800 text-zinc-500 flex items-center justify-center mx-auto mb-3">
            <Receipt className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-200">
            Nenhum pagamento encontrado
          </h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
            {searchTerm || selectedSubscriptionId !== 'all'
              ? 'Nenhum lançamento corresponde ao filtro de busca.'
              : 'Registre o primeiro pagamento recebido para visualizar o fluxo financeiro.'}
          </p>
          {!(searchTerm || selectedSubscriptionId !== 'all') && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Registrar Pagamento</span>
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider bg-zinc-950/40">
                  <th className="px-5 py-3">Data</th>
                  <th className="px-5 py-3">Cliente</th>
                  <th className="px-5 py-3">Plano</th>
                  <th className="px-5 py-3">Observações / Método</th>
                  <th className="px-5 py-3 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80 text-sm">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-850/40 transition-colors">
                    <td className="px-5 py-4 text-xs text-zinc-300 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                        <span>{formatDateBR(p.paid_at)}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div>
                        <span className="font-semibold text-zinc-100">
                          {p.customer?.name || 'Cliente'}
                        </span>
                        <div className="text-xs text-zinc-400 mt-0.5">
                          {p.customer?.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700/60">
                        {p.plan?.name || 'Plano'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-zinc-400 max-w-xs">
                      {p.notes || '—'}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="font-bold text-emerald-400 tabular-nums">
                        {formatCurrency(p.amount)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="md:hidden space-y-3">
            {filteredPayments.map((p) => (
              <div
                key={p.id}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-2.5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-sm text-zinc-100">
                      {p.customer?.name}
                    </h3>
                    <p className="text-xs text-zinc-400">{p.plan?.name}</p>
                  </div>
                  <span className="font-bold text-emerald-400 text-base">
                    {formatCurrency(p.amount)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-zinc-500 pt-1">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDateBR(p.paid_at)}</span>
                  </div>
                  {p.notes && (
                    <span className="text-zinc-400 text-[11px] truncate max-w-[180px]">
                      {p.notes}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modal: Registrar Pagamento */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Registrar Pagamento"
        description="Lance o recebimento de uma mensalidade para atualizar a renovação da assinatura."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Assinatura / Cliente *
            </label>
            <select
              required
              value={formData.subscription_id}
              onChange={(e) => handleSubscriptionChange(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              <option value="" disabled>Selecione uma assinatura...</option>
              {subscriptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.customer?.name} — {s.plan?.name} ({formatCurrency(s.plan?.price || 0)}) [{s.status.toUpperCase()}]
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Valor Pago (R$) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={formData.amount}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  amount: parseFloat(e.target.value) || 0,
                })
              }
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
              value={formData.paid_at}
              onChange={(e) => setFormData({ ...formData, paid_at: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Observações / Forma de Pagamento
            </label>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Ex: PIX, Transferência bancária, Cartão de Crédito"
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 text-xs text-zinc-400">
            <span className="font-semibold text-indigo-400 block mb-0.5">
              Regra Automática:
            </span>
            Ao confirmar o pagamento, o vencimento da assinatura será postergado em +30 dias e seu status retornará para Ativa.
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
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-600/20 disabled:opacity-50"
            >
              {isSubmitting && <LoadingSpinner size="sm" />}
              <span>Confirmar Pagamento</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
