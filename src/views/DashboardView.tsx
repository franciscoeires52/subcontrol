import React, { useState, useEffect, useCallback } from 'react';
import {
  getDashboardMetrics,
  createPayment,
  DashboardMetrics,
  SubscriptionWithDetails,
} from '@/services';
import { formatCurrency, formatDateBR } from '@/utils/formatters';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Modal } from '@/components/common/Modal';
import { useToast } from '@/context/ToastContext';
import { useRouter } from '@/context/RouterContext';
import {
  Users,
  Repeat,
  AlertTriangle,
  TrendingUp,
  Receipt,
  CheckCircle2,
  Calendar,
  ArrowRight,
  PlusCircle,
  Clock,
  Sparkles,
} from 'lucide-react';

export function DashboardView() {
  const toast = useToast();
  const { navigate } = useRouter();

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Quick payment modal state
  const [paymentModalSub, setPaymentModalSub] = useState<SubscriptionWithDetails | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [isSavingPayment, setIsSavingPayment] = useState(false);

  const fetchMetrics = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getDashboardMetrics();
      setMetrics(data);
    } catch {
      toast.error('Erro ao carregar métricas do dashboard.');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const handleOpenPaymentModal = (sub: SubscriptionWithDetails) => {
    setPaymentModalSub(sub);
    setPaymentAmount(sub.plan?.price || 0);
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentNotes('Pagamento registrado via Dashboard');
  };

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalSub) return;

    setIsSavingPayment(true);
    try {
      await createPayment({
        subscription_id: paymentModalSub.id,
        amount: Number(paymentAmount),
        paid_at: paymentDate,
        notes: paymentNotes,
      });

      toast.success(
        `Pagamento de ${formatCurrency(paymentAmount)} registrado! Assinatura renovada por +30 dias e ativada.`
      );
      setPaymentModalSub(null);
      await fetchMetrics();
    } catch {
      toast.error('Erro ao registrar pagamento.');
    } finally {
      setIsSavingPayment(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Painel Geral
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
            Visão consolidada da receita recorrente e saúde das assinaturas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/assinaturas')}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-medium rounded-xl transition-colors shadow-md shadow-indigo-600/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nova Assinatura</span>
          </button>
        </div>
      </div>

      {isLoading && !metrics ? (
        <div className="min-h-[300px] flex items-center justify-center">
          <LoadingSpinner size="lg" text="Carregando indicadores..." />
        </div>
      ) : (
        <>
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* KPI 1: MRR */}
            <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 relative overflow-hidden group hover:border-zinc-700 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-zinc-400">MRR Recorrente</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                {formatCurrency(metrics?.mrr || 0)}
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                Soma dos planos de assinaturas ativas
              </p>
            </div>

            {/* KPI 2: Assinaturas Ativas */}
            <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 relative overflow-hidden group hover:border-zinc-700 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-zinc-400">Assinaturas Ativas</span>
                <div className="w-8 h-8 rounded-lg bg-indigo-950/60 border border-indigo-800/40 text-indigo-400 flex items-center justify-center">
                  <Repeat className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                {metrics?.totalActiveSubscriptions || 0}
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                Clientes em dia com o serviço
              </p>
            </div>

            {/* KPI 3: Assinaturas Vencidas */}
            <div
              className={`bg-zinc-900 border rounded-2xl p-4 sm:p-5 relative overflow-hidden transition-colors ${
                (metrics?.overdueSubscriptionsCount || 0) > 0
                  ? 'border-rose-800/60 bg-rose-950/10'
                  : 'border-zinc-800/80'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-zinc-400">Assinaturas Vencidas</span>
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    (metrics?.overdueSubscriptionsCount || 0) > 0
                      ? 'bg-rose-950/80 border border-rose-800 text-rose-400'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div
                className={`text-xl sm:text-2xl font-bold tracking-tight ${
                  (metrics?.overdueSubscriptionsCount || 0) > 0
                    ? 'text-rose-400'
                    : 'text-white'
                }`}
              >
                {metrics?.overdueSubscriptionsCount || 0}
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                {(metrics?.overdueSubscriptionsCount || 0) > 0
                  ? 'Requer cobrança imediata'
                  : 'Nenhuma pendência crítica'}
              </p>
            </div>

            {/* KPI 4: Total de Clientes */}
            <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 relative overflow-hidden group hover:border-zinc-700 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-zinc-400">Total de Clientes</span>
                <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                {metrics?.totalCustomers || 0}
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                Base cadastrada na plataforma
              </p>
            </div>
          </div>

          {/* Section: Assinaturas Vencidas ou Vencendo Hoje */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 sm:p-5 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <h2 className="text-sm font-semibold text-zinc-100">
                  Assinaturas Vencidas ou Vencendo Hoje
                </h2>
                <span className="text-xs text-zinc-500">
                  ({metrics?.overdueOrDueTodaySubscriptions.length || 0})
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Ações rápidas de cobrança e renovação manual
              </p>
            </div>

            {metrics?.overdueOrDueTodaySubscriptions.length === 0 ? (
              <div className="p-8 text-center">
                <div className="inline-flex w-10 h-10 rounded-full bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 items-center justify-center mb-3">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-medium text-zinc-200">
                  Tudo em dia por aqui!
                </h3>
                <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                  Não existem assinaturas vencidas ou vencendo hoje. Todas as cobranças ativas estão no prazo regular.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/80">
                {metrics?.overdueOrDueTodaySubscriptions.map((sub) => {
                  const days = sub.daysRemaining ?? 0;
                  const isPast = days < 0;
                  const isToday = days === 0;

                  return (
                    <div
                      key={sub.id}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-850/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isPast
                              ? 'bg-rose-950/80 border border-rose-800 text-rose-400'
                              : 'bg-amber-950/80 border border-amber-800 text-amber-400'
                          }`}
                        >
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-zinc-100">
                              {sub.customer?.name || 'Cliente não identificado'}
                            </span>
                            <StatusBadge status={sub.status} />
                          </div>
                          <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1 flex-wrap">
                            <span>{sub.customer?.email}</span>
                            <span>&middot;</span>
                            <span className="text-zinc-300 font-medium">
                              {sub.plan?.name || 'Plano'} ({formatCurrency(sub.plan?.price || 0)}/mês)
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-1.5">
                            <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                            <span>Vencimento: {formatDateBR(sub.next_renewal)}</span>
                            <span
                              className={`ml-1 font-medium ${
                                isPast ? 'text-rose-400' : 'text-amber-400'
                              }`}
                            >
                              ({isToday ? 'Vence hoje' : `${Math.abs(days)} dia(s) em atraso`})
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => handleOpenPaymentModal(sub)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 shadow-sm shadow-emerald-600/20"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>Registrar Pagamento</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Navigation Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => navigate('/clientes')}
              className="p-4 bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 rounded-xl text-left transition-colors flex items-center justify-between group"
            >
              <div>
                <p className="text-xs font-semibold text-zinc-200">Gerenciar Clientes</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">Cadastrar, editar e buscar contatos</p>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-200 transition-colors" />
            </button>

            <button
              type="button"
              onClick={() => navigate('/planos')}
              className="p-4 bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 rounded-xl text-left transition-colors flex items-center justify-between group"
            >
              <div>
                <p className="text-xs font-semibold text-zinc-200">Tabela de Planos</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">Configurar preços e recorrências</p>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-200 transition-colors" />
            </button>

            <button
              type="button"
              onClick={() => navigate('/pagamentos')}
              className="p-4 bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 rounded-xl text-left transition-colors flex items-center justify-between group"
            >
              <div>
                <p className="text-xs font-semibold text-zinc-200">Histórico Financeiro</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">Auditoria e lançamentos de pagamentos</p>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-200 transition-colors" />
            </button>
          </div>
        </>
      )}

      {/* Quick Payment Modal */}
      <Modal
        isOpen={!!paymentModalSub}
        onClose={() => setPaymentModalSub(null)}
        title="Registrar Pagamento Manual"
        description="Ao confirmar o recebimento, a assinatura será automaticamente renovada por +30 dias e reativada."
      >
        {paymentModalSub && (
          <form onSubmit={handleConfirmPayment} className="space-y-4">
            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-zinc-400">Cliente:</span>
                <span className="font-semibold text-zinc-200">{paymentModalSub.customer?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Plano:</span>
                <span className="font-semibold text-zinc-200">
                  {paymentModalSub.plan?.name} ({formatCurrency(paymentModalSub.plan?.price || 0)})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Vencimento atual:</span>
                <span className="font-medium text-rose-400">
                  {formatDateBR(paymentModalSub.next_renewal)}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Valor Recebido (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
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
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Observações / Método
              </label>
              <input
                type="text"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Ex: Transferência PIX, Boleto, Cartão"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setPaymentModalSub(null)}
                className="px-3 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSavingPayment}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-600/20 disabled:opacity-50"
              >
                {isSavingPayment && <LoadingSpinner size="sm" />}
                <span>Confirmar Pagamento</span>
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
