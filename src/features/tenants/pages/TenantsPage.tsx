import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Ban, Blocks, Rocket, PackageCheck } from 'lucide-react';
import { DataTable, Column, RowAction } from '../../../components/table/DataTable';
import { ConfirmDialog } from '../../../components/ui/Dialog/ConfirmDialog';
import { Modal } from '../../../components/ui/Modal/Modal';
import { DynamicForm, FormField } from '../../../components/form/DynamicForm';
import { toast } from '../../../components/ui/Toast/toast.store';
import { BaseRepository } from '../../../core/api/base.repository';
import { ApiResponse } from '../../../domain/dto/auth.dto';
import { subscriptionPlanApi } from '../../subscription-plans/pages/SubscriptionPlansPage';

interface TenantDto {
  id: number;
  slug: string;
  name: string;
  isActive: boolean;
  subscriptionPlanId: number | null;
}

interface ModuleToggleDto {
  id: number;
  key: string;
  name: string;
  description: string;
  isEnabled: boolean;
}

class TenantApi extends BaseRepository {
  constructor() { super('/tenants'); }
  async getAll(): Promise<TenantDto[]> {
    const res = await this.get<ApiResponse<TenantDto[]>>('');
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async create(dto: { slug: string; name: string }): Promise<TenantDto> {
    const res = await this.post<ApiResponse<TenantDto>>('', dto);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async update(id: number, dto: { name: string }): Promise<TenantDto> {
    const res = await this.put<ApiResponse<TenantDto>>(`/${id}`, dto);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async disable(id: number): Promise<void> {
    await this.delete<any>(`/${id}`);
  }
  async getModules(tenantId: number): Promise<ModuleToggleDto[]> {
    const res = await this.get<ApiResponse<ModuleToggleDto[]>>(`/${tenantId}/modules`);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async enableModule(tenantId: number, moduleId: number): Promise<void> {
    await this.post<any>(`/${tenantId}/modules/${moduleId}`, {});
  }
  async disableModule(tenantId: number, moduleId: number): Promise<void> {
    await this.delete<any>(`/${tenantId}/modules/${moduleId}`);
  }
  async provision(tenantId: number, subscriptionPlanId: number | null): Promise<void> {
    await this.post<any>(`/${tenantId}/provision`, { subscriptionPlanId });
  }
  async assignSubscriptionPlan(tenantId: number, subscriptionPlanId: number): Promise<void> {
    await this.post<any>(`/${tenantId}/subscription-plan`, { subscriptionPlanId });
  }
}

const tenantApi = new TenantApi();

const ToggleSwitch: React.FC<{ checked: boolean; disabled?: boolean; onChange: () => void }> = ({ checked, disabled, onChange }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={onChange}
    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
      checked ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
    }`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
        checked ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
);

export const TenantsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTenant, setEditTenant] = useState<TenantDto | null>(null);
  const [disableTenantId, setDisableTenantId] = useState<number | null>(null);
  const [modulesTenant, setModulesTenant] = useState<TenantDto | null>(null);
  const [pendingModuleId, setPendingModuleId] = useState<number | null>(null);
  const [provisionTenant, setProvisionTenant] = useState<TenantDto | null>(null);
  const [provisionPlanId, setProvisionPlanId] = useState<string>('');
  const [assignPlanTenant, setAssignPlanTenant] = useState<TenantDto | null>(null);
  const [assignPlanId, setAssignPlanId] = useState<string>('');

  const { data: tenants = [], isLoading, error, refetch } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => tenantApi.getAll(),
  });

  const { data: subscriptionPlans = [] } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: () => subscriptionPlanApi.getAll(),
  });

  const planNameById = new Map(subscriptionPlans.map((plan) => [plan.id, plan.name]));

  const { data: modules = [], isLoading: loadingModules } = useQuery({
    queryKey: ['tenant-modules', modulesTenant?.id],
    queryFn: () => tenantApi.getModules(modulesTenant!.id),
    enabled: modulesTenant !== null,
  });

  const moduleToggleMutation = useMutation({
    mutationFn: ({ moduleId, enable }: { moduleId: number; enable: boolean }) =>
      enable ? tenantApi.enableModule(modulesTenant!.id, moduleId) : tenantApi.disableModule(modulesTenant!.id, moduleId),
    onMutate: ({ moduleId }) => setPendingModuleId(moduleId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenant-modules', modulesTenant?.id] }),
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to update module'),
    onSettled: () => setPendingModuleId(null),
  });

  const createMutation = useMutation({
    mutationFn: (dto: { slug: string; name: string }) => tenantApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      toast.success('Tenant created successfully');
      setShowAddModal(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to create tenant'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: { name: string } }) => tenantApi.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      toast.success('Tenant updated successfully');
      setEditTenant(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to update tenant'),
  });

  const disableMutation = useMutation({
    mutationFn: (id: number) => tenantApi.disable(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      toast.success('Tenant disabled successfully');
      setDisableTenantId(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to disable tenant'),
  });

  const provisionMutation = useMutation({
    mutationFn: ({ id, subscriptionPlanId }: { id: number; subscriptionPlanId: number | null }) =>
      tenantApi.provision(id, subscriptionPlanId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['tenant-modules'] });
      toast.success('Tenant provisioned successfully');
      setProvisionTenant(null);
      setProvisionPlanId('');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to provision tenant'),
  });

  const assignPlanMutation = useMutation({
    mutationFn: ({ id, subscriptionPlanId }: { id: number; subscriptionPlanId: number }) =>
      tenantApi.assignSubscriptionPlan(id, subscriptionPlanId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['tenant-modules'] });
      toast.success('Subscription plan assigned successfully');
      setAssignPlanTenant(null);
      setAssignPlanId('');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to assign subscription plan'),
  });

  const getStatusBadge = (isActive: boolean) => (
    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
      isActive
        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
    }`}>
      {isActive ? 'Active' : 'Disabled'}
    </span>
  );

  const columns: Column<TenantDto>[] = [
    { key: 'id', label: 'ID', width: '80px' },
    { key: 'slug', label: 'Slug', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    {
      key: 'subscriptionPlanId',
      label: 'Plan',
      render: (_, tenant) =>
        tenant.subscriptionPlanId !== null ? (planNameById.get(tenant.subscriptionPlanId) ?? '—') : '—',
    },
    { key: 'isActive', label: 'Status', sortable: true, render: (_, tenant) => getStatusBadge(tenant.isActive) },
  ];

  const rowActions: RowAction<TenantDto>[] = [
    { icon: Pencil, label: 'Edit', onClick: (t) => setEditTenant(t), variant: 'primary' },
    { icon: Blocks, label: 'Modules', onClick: (t) => setModulesTenant(t), variant: 'secondary' },
    {
      icon: Rocket,
      label: 'Provision',
      onClick: (t) => { setProvisionTenant(t); setProvisionPlanId(t.subscriptionPlanId ? String(t.subscriptionPlanId) : ''); },
      variant: 'secondary',
    },
    {
      icon: PackageCheck,
      label: 'Assign Plan',
      onClick: (t) => { setAssignPlanTenant(t); setAssignPlanId(t.subscriptionPlanId ? String(t.subscriptionPlanId) : ''); },
      variant: 'secondary',
    },
    { icon: Ban, label: 'Disable', onClick: (t) => setDisableTenantId(t.id), variant: 'danger', show: (t) => t.isActive },
  ];

  const createFields: FormField[] = [
    { name: 'slug', label: 'Slug', type: 'text', required: true, placeholder: 'e.g. acme-corp' },
    { name: 'name', label: 'Name', type: 'text', required: true, placeholder: 'e.g. Acme Corp' },
  ];

  const editFields: FormField[] = [
    { name: 'name', label: 'Name', type: 'text', required: true, defaultValue: editTenant?.name || '' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tenants</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Manage tenant registrations</p>
      </div>

      <DataTable
        columns={columns}
        data={tenants}
        isLoading={isLoading}
        error={error?.message}
        searchable
        searchPlaceholder="Search tenants..."
        emptyState={{ title: 'No tenants found', description: 'Register a new tenant to get started' }}
        actions={{ add: { label: 'Add Tenant', onClick: () => setShowAddModal(true) } }}
        rowActions={rowActions}
        onRetry={() => refetch()}
      />

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Register New Tenant" size="md">
        <DynamicForm
          fields={createFields}
          onSubmit={(data) => createMutation.mutate({ slug: data.slug, name: data.name })}
          submitLabel="Create Tenant"
          onCancel={() => setShowAddModal(false)}
          isLoading={createMutation.isPending}
        />
      </Modal>

      <Modal isOpen={editTenant !== null} onClose={() => setEditTenant(null)} title="Edit Tenant" size="md">
        {editTenant && (
          <DynamicForm
            key={editTenant.id}
            fields={editFields}
            onSubmit={(data) => updateMutation.mutate({ id: editTenant.id, dto: { name: data.name } })}
            submitLabel="Update Tenant"
            onCancel={() => setEditTenant(null)}
            isLoading={updateMutation.isPending}
          />
        )}
      </Modal>

      <ConfirmDialog
        isOpen={disableTenantId !== null}
        onClose={() => setDisableTenantId(null)}
        onConfirm={() => disableTenantId !== null && disableMutation.mutate(disableTenantId)}
        title="Disable Tenant"
        message="Are you sure you want to disable this tenant? Its users will lose access until it is re-enabled."
        confirmText="Disable"
        variant="danger"
      />

      <Modal
        isOpen={modulesTenant !== null}
        onClose={() => setModulesTenant(null)}
        title={`Modules for "${modulesTenant?.name ?? ''}"`}
        size="md"
      >
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Toggle which modules this tenant has access to. Disabling a module immediately revokes its permissions for this tenant.
        </p>
        {loadingModules ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : modules.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No optional modules are available yet</div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {modules.map((module) => (
              <div key={module.id} className="flex items-center justify-between py-3">
                <div className="min-w-0 pr-4">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{module.name}</p>
                  {module.description && <p className="text-xs text-gray-400 truncate">{module.description}</p>}
                </div>
                <ToggleSwitch
                  checked={module.isEnabled}
                  disabled={moduleToggleMutation.isPending && pendingModuleId === module.id}
                  onChange={() => moduleToggleMutation.mutate({ moduleId: module.id, enable: !module.isEnabled })}
                />
              </div>
            ))}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={provisionTenant !== null}
        onClose={() => setProvisionTenant(null)}
        title={`Provision "${provisionTenant?.name ?? ''}"`}
        size="md"
      >
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Seeds default roles, menus and an admin user for this tenant. Safe to re-run. Optionally pick a
          subscription plan to entitle its modules at the same time; leave blank to entitle only the Core module.
        </p>
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Subscription Plan</label>
            <select
              value={provisionPlanId}
              onChange={(e) => setProvisionPlanId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No plan (Core module only)</option>
              {subscriptionPlans.map((plan) => (
                <option key={plan.id} value={plan.id}>{plan.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setProvisionTenant(null)}
              disabled={provisionMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={provisionMutation.isPending}
              onClick={() =>
                provisionTenant &&
                provisionMutation.mutate({
                  id: provisionTenant.id,
                  subscriptionPlanId: provisionPlanId ? Number(provisionPlanId) : null,
                })
              }
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              Provision
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={assignPlanTenant !== null}
        onClose={() => setAssignPlanTenant(null)}
        title={`Assign Subscription Plan to "${assignPlanTenant?.name ?? ''}"`}
        size="md"
      >
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Resyncs this tenant's modules to exactly match the selected plan (adds and removes as needed; Core is
          always kept) and updates its user limit. For an already-provisioned tenant changing plans.
        </p>
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Subscription Plan<span className="text-red-500 ml-1">*</span>
            </label>
            <select
              value={assignPlanId}
              onChange={(e) => setAssignPlanId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a plan</option>
              {subscriptionPlans.map((plan) => (
                <option key={plan.id} value={plan.id}>{plan.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setAssignPlanTenant(null)}
              disabled={assignPlanMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={assignPlanMutation.isPending || !assignPlanId}
              onClick={() =>
                assignPlanTenant &&
                assignPlanId &&
                assignPlanMutation.mutate({ id: assignPlanTenant.id, subscriptionPlanId: Number(assignPlanId) })
              }
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              Assign Plan
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
