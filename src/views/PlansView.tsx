import React, { useState, useEffect, useCallback } from 'react';
import {
  getPlans,
  createPlan,
  updatePlan,
  deletePlan,
  Plan,
} from '@/services';
import { formatCurrency, formatDateBR } from '@/utils/formatters';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Modal } from '@/components/common/Modal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useToast } from '@/context/ToastContext';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Check,
  Zap,
} from 'lucide-react';

export function PlansView() {
  const toast = useToast();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal create/edit state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: 99.0,
    active: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete dialog state
  const [planToDelete, setPlanToDelete] = useState<Plan | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadPlans = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getPlans();
      setPlans(data);
    } catch {
      toast.error('Erro ao carregar planos.');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const handleOpenCreate = () => {
    setEditingPlan(null);
    setFormData({
      name: '',
      price: 99.0,
      active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      price: plan.price,
      active: plan.active,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Preencha o nome do plano.');
      return;
    }

    if (formData.price <= 0) {
      toast.error('O preço do plano deve ser maior que zero.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingPlan) {
        await updatePlan(editingPlan.id, {
          name: formData.name.trim(),
          price: Number(formData.price),
          active: formData.active,
        });
        toast.success(`Plano "${formData.name}" atualizado com sucesso!`);
      } else {
        await createPlan({
          name: formData.name.trim(),
          price: Number(formData.price),
          active: formData.active,
        });
        toast.success(`Plano "${formData.name}" criado com sucesso!`);
      }
      setIsModalOpen(false);
      await loadPlans();
    } catch {
      toast.error('Erro ao salvar plano.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!planToDelete) return;
    setIsDeleting(true);
    try {
      await deletePlan(planToDelete.id);
      toast.success(`Plano "${planToDelete.name}" removido com sucesso.`);
      setPlanToDelete(null);
      await loadPlans();
    } catch {
      toast.error('Erro ao excluir plano.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Planos de Assinatura
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
            Definição de pacotes mensais e valores recorrentes comercializados.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-medium rounded-xl transition-colors shadow-md shadow-indigo-600/20 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Plano</span>
        </button>
      </div>

      {isLoading ? (
        <div className="min-h-[250px] flex items-center justify-center">
          <LoadingSpinner size="lg" text="Carregando planos..." />
        </div>
      ) : plans.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-zinc-800 text-zinc-500 flex items-center justify-center mx-auto mb-3">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-200">Nenhum plano cadastrado</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
            Cadastre planos recorrentes para vincular aos seus clientes.
          </p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Criar Primeiro Plano</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((p) => (
            <div
              key={p.id}
              className={`bg-zinc-900 border rounded-2xl p-5 flex flex-col justify-between transition-all ${
                p.active
                  ? 'border-zinc-800 hover:border-zinc-700 shadow-sm'
                  : 'border-zinc-850 opacity-75'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-950/60 border border-indigo-800/40 text-indigo-400 flex items-center justify-center">
                    <Zap className="w-4 h-4" />
                  </div>
                  <StatusBadge status={p.active ? 'active_plan' : 'inactive_plan'} />
                </div>

                <h3 className="text-base font-bold text-zinc-100">{p.name}</h3>

                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-white tracking-tight">
                    {formatCurrency(p.price)}
                  </span>
                  <span className="text-xs text-zinc-400 font-medium">/ mês</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500">
                <span>Criado em {formatDateBR(p.created_at)}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(p)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
                    title="Editar plano"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlanToDelete(p)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                    title="Excluir plano"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Create/Edit Plan */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPlan ? 'Editar Plano' : 'Novo Plano'}
        description="Defina os parâmetros do plano de assinatura recorrente."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Nome do Plano *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Plano Starter, Plano VIP..."
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Valor Mensal (R$) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })
              }
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="w-4 h-4 rounded bg-zinc-950 border-zinc-700 text-indigo-600 focus:ring-indigo-500/50 focus:ring-offset-zinc-900"
              />
              <div>
                <span className="text-xs font-medium text-zinc-200">
                  Plano Ativo para Novas Assinaturas
                </span>
                <p className="text-[11px] text-zinc-500">
                  Planos inativos não ficam visíveis ao criar novas assinaturas.
                </p>
              </div>
            </label>
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
              <span>{editingPlan ? 'Salvar Alterações' : 'Criar Plano'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!planToDelete}
        onClose={() => setPlanToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Excluir Plano?"
        message={`Tem certeza de que deseja excluir o "${planToDelete?.name}"? Esta ação é definitiva na base local.`}
        confirmText="Excluir Plano"
        cancelText="Cancelar"
        isDangerous={true}
        isLoading={isDeleting}
      />
    </div>
  );
}
