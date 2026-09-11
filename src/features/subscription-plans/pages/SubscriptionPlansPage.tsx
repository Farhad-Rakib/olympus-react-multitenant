import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2 } from 'lucide-react';
import { DataTable, Column, RowAction } from '../../../components/table/DataTable';
import { ConfirmDialog } from '../../../components/ui/Dialog/ConfirmDialog';
import { Modal } from '../../../components/ui/Modal/Modal';
import { toast } from '../../../components/ui/Toast/toast.store';
import { BaseRepository } from '../../../core/api/base.repository';
import { ApiResponse } from '../../../domain/dto/auth.dto';
import { getApiErrorMessage } from '../../../core/utils/error';
import { formatCurrency } from '../../../core/i18n/format';
import { BillingInterval } from '../../../core/api/services/tenant-billing.api';

export interface SubscriptionPlanDto {
  id: number;
  key: string;
  name: string;
  description: string;
  maxUsers: number;
  isActive: boolean;
  price: number;
  currency: string;
  billingInterval: BillingInterval;
  externalPriceId: string | null;
  requestsPerMinute: number;
  moduleKeys: string[];
}

interface ModuleSummaryDto {
  id: number;
  key: string;
  name: string;
  description: string;
}

interface SubscriptionPlanWriteDto {
  name: string;
  description: string;
  maxUsers: number;
  price: number;
  currency: string;
  billingInterval: BillingInterval;
  externalPriceId: string | null;
  requestsPerMinute: number;
  moduleKeys: string[];
}

const INTERVAL_OPTIONS: { value: BillingInterval; label: string }[] = [
  { value: BillingInterval.None, label: 'None (managed manually)' },
  { value: BillingInterval.Monthly, label: 'Monthly' },
  { value: BillingInterval.Yearly, label: 'Yearly' },
];

const INTERVAL_SUFFIX: Record<BillingInterval, string> = {
  [BillingInterval.None]: '',
  [BillingInterval.Monthly]: '/mo',
  [BillingInterval.Yearly]: '/yr',
};

class SubscriptionPlanApi extends BaseRepository {
  constructor() { super('/subscription-plans'); }
  async getAll(): Promise<SubscriptionPlanDto[]> {
    const res = await this.get<ApiResponse<SubscriptionPlanDto[]>>('');
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async getAvailableModules(): Promise<ModuleSummaryDto[]> {
    const res = await this.get<ApiResponse<ModuleSummaryDto[]>>('/available-modules');
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async create(dto: SubscriptionPlanWriteDto & { key: string }): Promise<SubscriptionPlanDto> {
    const res = await this.post<ApiResponse<SubscriptionPlanDto>>('', dto);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async update(id: number, dto: SubscriptionPlanWriteDto): Promise<SubscriptionPlanDto> {
    const res = await this.put<ApiResponse<SubscriptionPlanDto>>(`/${id}`, dto);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async remove(id: number): Promise<void> {
    await this.delete<void>(`/${id}`);
  }
}

export const subscriptionPlanApi = new SubscriptionPlanApi();

interface PlanFormValues {
  key: string;
  name: string;
  description: string;
  maxUsers: string;
  price: string;
  currency: string;
  billingInterval: BillingInterval;
  externalPriceId: string;
  requestsPerMinute: string;
}

const emptyForm: PlanFormValues = {
  key: '', name: '', description: '', maxUsers: '',
  price: '0', currency: 'USD', billingInterval: BillingInterval.None, externalPriceId: '', requestsPerMinute: '0',
};

const PlanForm: React.FC<{
  initial: PlanFormValues;
  isEdit: boolean;
  modules: ModuleSummaryDto[];
  initialModuleKeys: string[];
  isLoading: boolean;
  onCancel: () => void;
  onSubmit: (values: SubscriptionPlanWriteDto & { key: string }) => void;
}> = ({ initial, isEdit, modules, initialModuleKeys, isLoading, onCancel, onSubmit }) => {
  const [form, setForm] = useState(initial);
  const [moduleKeys, setModuleKeys] = useState<Set<string>>(new Set(initialModuleKeys));

  const toggleModule = (key: string) => {
    setModuleKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const isRecurring = form.billingInterval !== BillingInterval.None;
  const price = Number(form.price);
  // Mirrors SubscriptionPlan.SetPricing: a recurring plan must cost something; a manually managed
  // one is free to be zero. Surfaced inline so the admin doesn't have to read a 400 to learn it.
  const priceError =
    Number.isNaN(price) || price < 0
      ? 'Price cannot be negative'
      : isRecurring && price <= 0
        ? 'A recurring plan must have a price above zero'
        : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const maxUsers = Number(form.maxUsers);
    if (!form.key.trim() && !isEdit) return;
    if (!form.name.trim() || !maxUsers || maxUsers <= 0) return;
    if (priceError || form.currency.trim().length !== 3) return;

    onSubmit({
      key: form.key.trim().toLowerCase(),
      name: form.name.trim(),
      description: form.description.trim(),
      maxUsers,
      price,
      currency: form.currency.trim().toUpperCase(),
      billingInterval: form.billingInterval,
      externalPriceId: form.externalPriceId.trim() || null,
      requestsPerMinute: Math.max(0, Math.floor(Number(form.requestsPerMinute) || 0)),
      moduleKeys: Array.from(moduleKeys),
    });
  };

  const inputClasses =
    'w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!isEdit && (
        <div className="space-y-1">
          <label htmlFor="key" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Key<span className="text-red-500 ml-1">*</span>
          </label>
          <input id="key"
            type="text"
            required
            value={form.key}
            onChange={(e) => setForm({ ...form, key: e.target.value })}
            placeholder="e.g. starter"
            className={inputClasses}
          />
        </div>
      )}
      <div className="space-y-1">
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Name<span className="text-red-500 ml-1">*</span>
        </label>
        <input id="name"
          type="text"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. Starter"
          className={inputClasses}
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
        <textarea id="description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={2}
          className={`${inputClasses} resize-none`}
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="max-users" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Max Users<span className="text-red-500 ml-1">*</span>
        </label>
        <input id="max-users"
          type="number"
          min={1}
          required
          value={form.maxUsers}
          onChange={(e) => setForm({ ...form, maxUsers: e.target.value })}
          className={inputClasses}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1">
          <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Price</label>
          <input id="price"
            type="number"
            min={0}
            step="0.01"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className={inputClasses}
          />
          {priceError && <p className="text-xs text-red-500">{priceError}</p>}
        </div>
        <div className="space-y-1">
          <label htmlFor="currency" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Currency</label>
          <input id="currency"
            type="text"
            maxLength={3}
            value={form.currency}
            onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })}
            placeholder="USD"
            className={`${inputClasses} uppercase`}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="billing-interval" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Billing interval</label>
          <select id="billing-interval"
            value={form.billingInterval}
            onChange={(e) => setForm({ ...form, billingInterval: Number(e.target.value) as BillingInterval })}
            className={inputClasses}
          >
            {INTERVAL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-1">
        <label htmlFor="provider-price-id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Provider price ID</label>
        <input id="provider-price-id"
          type="text"
          value={form.externalPriceId}
          onChange={(e) => setForm({ ...form, externalPriceId: e.target.value })}
          placeholder="e.g. price_1Nxxxx"
          className={inputClasses}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          The price/plan id in your payment provider. Required for tenants to buy this plan through self-service checkout.
        </p>
      </div>
      <div className="space-y-1">
        <label htmlFor="api-requests-minute" className="block text-sm font-medium text-gray-700 dark:text-gray-300">API requests / minute</label>
        <input id="api-requests-minute"
          type="number"
          min={0}
          step={1}
          value={form.requestsPerMinute}
          onChange={(e) => setForm({ ...form, requestsPerMinute: e.target.value })}
          className={inputClasses}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Per tenant, across all of its users. 0 uses the platform default. Applies at the next token refresh.
        </p>
      </div>
      <div className="space-y-1">
        <label htmlFor="included-modules" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Included Modules</label>
        {modules.length === 0 ? (
          <p className="text-sm text-gray-400">No optional modules are available yet</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg">
            {modules.map((module) => (
              <label key={module.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer">
                <input id="included-modules"
                  type="checkbox"
                  checked={moduleKeys.has(module.key)}
                  onChange={() => toggleModule(module.key)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{module.name}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isEdit ? 'Update Plan' : 'Create Plan'}
        </button>
      </div>
    </form>
  );
};

export const SubscriptionPlansPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editPlan, setEditPlan] = useState<SubscriptionPlanDto | null>(null);
  const [deletePlanId, setDeletePlanId] = useState<number | null>(null);

  const { data: plans = [], isLoading, error, refetch } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: () => subscriptionPlanApi.getAll(),
  });

  const { data: modules = [] } = useQuery({
    queryKey: ['subscription-plans', 'available-modules'],
    queryFn: () => subscriptionPlanApi.getAvailableModules(),
  });

  const createMutation = useMutation({
    mutationFn: (dto: SubscriptionPlanWriteDto & { key: string }) => subscriptionPlanApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      toast.success('Subscription plan created successfully');
      setShowAddModal(false);
    },
    onError: (error: unknown) => toast.error(getApiErrorMessage(error, 'Failed to create subscription plan')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: SubscriptionPlanWriteDto }) => subscriptionPlanApi.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      toast.success('Subscription plan updated successfully');
      setEditPlan(null);
    },
    onError: (error: unknown) => toast.error(getApiErrorMessage(error, 'Failed to update subscription plan')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => subscriptionPlanApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      toast.success('Subscription plan deleted successfully');
      setDeletePlanId(null);
    },
    onError: (error: unknown) => toast.error(getApiErrorMessage(error, 'Failed to delete subscription plan')),
  });

  const columns: Column<SubscriptionPlanDto>[] = [
    { key: 'key', label: 'Key', width: '120px' },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'maxUsers', label: 'Max Users', sortable: true },
    {
      key: 'price',
      label: 'Price',
      sortable: true,
      render: (_, plan) =>
        plan.billingInterval === BillingInterval.None && plan.price === 0 ? (
          <span className="text-gray-400">Not sold</span>
        ) : (
          <span>
            {formatCurrency(plan.price, plan.currency)}
            <span className="text-gray-400">{INTERVAL_SUFFIX[plan.billingInterval]}</span>
            {!plan.externalPriceId && plan.billingInterval !== BillingInterval.None && (
              <span className="ml-1 text-xs text-amber-600 dark:text-amber-400" title="No provider price id: cannot be bought via checkout">!</span>
            )}
          </span>
        ),
    },
    {
      key: 'moduleKeys',
      label: 'Modules',
      render: (_, plan) => (plan.moduleKeys.length > 0 ? plan.moduleKeys.join(', ') : '—'),
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (_, plan) => (
        <span
          className={`px-2.5 py-1 text-xs font-medium rounded-full ${
            plan.isActive
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
          }`}
        >
          {plan.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ];

  const rowActions: RowAction<SubscriptionPlanDto>[] = [
    { icon: Pencil, label: 'Edit', onClick: (plan) => setEditPlan(plan), variant: 'primary' },
    { icon: Trash2, label: 'Delete', onClick: (plan) => setDeletePlanId(plan.id), variant: 'danger' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Subscription Plans</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage the module bundles and user limits tenants can subscribe to
        </p>
      </div>

      <DataTable
        columns={columns}
        data={plans}
        isLoading={isLoading}
        error={error?.message}
        searchable
        searchPlaceholder="Search plans..."
        emptyState={{ title: 'No subscription plans found', description: 'Create a plan to get started' }}
        actions={{ add: { label: 'Add Plan', onClick: () => setShowAddModal(true) } }}
        rowActions={rowActions}
        onRetry={() => refetch()}
      />

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Create Subscription Plan" size="md">
        <PlanForm
          initial={emptyForm}
          isEdit={false}
          modules={modules}
          initialModuleKeys={[]}
          isLoading={createMutation.isPending}
          onCancel={() => setShowAddModal(false)}
          onSubmit={(values) => createMutation.mutate(values)}
        />
      </Modal>

      <Modal isOpen={editPlan !== null} onClose={() => setEditPlan(null)} title="Edit Subscription Plan" size="md">
        {editPlan && (
          <PlanForm
            key={editPlan.id}
            initial={{
              key: editPlan.key,
              name: editPlan.name,
              description: editPlan.description,
              maxUsers: String(editPlan.maxUsers),
              price: String(editPlan.price ?? 0),
              currency: editPlan.currency || 'USD',
              billingInterval: editPlan.billingInterval ?? BillingInterval.None,
              externalPriceId: editPlan.externalPriceId ?? '',
              requestsPerMinute: String(editPlan.requestsPerMinute ?? 0),
            }}
            isEdit
            modules={modules}
            initialModuleKeys={editPlan.moduleKeys}
            isLoading={updateMutation.isPending}
            onCancel={() => setEditPlan(null)}
            onSubmit={(values) =>
              updateMutation.mutate({
                id: editPlan.id,
                dto: {
                  name: values.name,
                  description: values.description,
                  maxUsers: values.maxUsers,
                  price: values.price,
                  currency: values.currency,
                  billingInterval: values.billingInterval,
                  externalPriceId: values.externalPriceId,
                  requestsPerMinute: values.requestsPerMinute,
                  moduleKeys: values.moduleKeys,
                },
              })
            }
          />
        )}
      </Modal>

      <ConfirmDialog
        isOpen={deletePlanId !== null}
        onClose={() => setDeletePlanId(null)}
        onConfirm={() => deletePlanId !== null && deleteMutation.mutate(deletePlanId)}
        title="Delete Subscription Plan"
        message="Are you sure you want to delete this plan? This will fail if any tenant is currently subscribed to it."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};
