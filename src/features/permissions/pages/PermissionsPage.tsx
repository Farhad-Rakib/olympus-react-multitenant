import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2 } from 'lucide-react';
import { DataTable, Column, RowAction } from '../../../components/table/DataTable';
import { ConfirmDialog } from '../../../components/ui/Dialog/ConfirmDialog';
import { Modal } from '../../../components/ui/Modal/Modal';
import { DynamicForm, FormField } from '../../../components/form/DynamicForm';
import { toast } from '../../../components/ui/Toast/toast.store';
import { BaseRepository } from '../../../core/api/base.repository';
import { ApiResponse } from '../../../domain/dto/auth.dto';
import { getApiErrorMessage } from '../../../core/utils/error';

interface PermissionDto {
  id: number;
  name: string;
  description: string;
}

class PermissionApi extends BaseRepository {
  constructor() { super('/permissions'); }
  async getAll(): Promise<PermissionDto[]> {
    const res = await this.get<ApiResponse<PermissionDto[]>>('');
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async create(dto: { name: string; description: string }): Promise<PermissionDto> {
    const res = await this.post<ApiResponse<PermissionDto>>('', dto);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async update(id: number, dto: { name: string; description: string }): Promise<PermissionDto> {
    const res = await this.put<ApiResponse<PermissionDto>>(`/${id}`, dto);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async remove(id: number): Promise<void> {
    await this.delete<void>(`/${id}`);
  }
}

const permissionApi = new PermissionApi();

export const PermissionsPage: React.FC = () => {
  const { t } = useTranslation();

  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editItem, setEditItem] = useState<PermissionDto | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: permissions = [], isLoading, error, refetch } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => permissionApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (dto: { name: string; description: string }) => permissionApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      toast.success(t('permissions.permissionCreatedSuccessfully'));
      setShowAddModal(false);
    },
    onError: (error: unknown) => toast.error(getApiErrorMessage(error, t('permissions.failedToCreatePermission'))),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: { name: string; description: string } }) => permissionApi.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      toast.success(t('permissions.permissionUpdatedSuccessfully'));
      setEditItem(null);
    },
    onError: (error: unknown) => toast.error(getApiErrorMessage(error, t('permissions.failedToUpdatePermission'))),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => permissionApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      toast.success(t('permissions.permissionDeletedSuccessfully'));
      setDeleteId(null);
    },
    onError: (error: unknown) => toast.error(getApiErrorMessage(error, t('permissions.failedToDeletePermission'))),
  });

  const columns: Column<PermissionDto>[] = [
    { key: 'id', label: 'ID', width: '80px' },
    { key: 'name', label: t('permissions.permission'), sortable: true },
    { key: 'description', label: t('common.description'), sortable: false },
  ];

  const rowActions: RowAction<PermissionDto>[] = [
    { icon: Pencil, label: t('common.edit'), onClick: (p) => setEditItem(p), variant: 'primary' },
    { icon: Trash2, label: t('common.delete'), onClick: (p) => setDeleteId(p.id), variant: 'danger' },
  ];

  const createFields: FormField[] = [
    { name: 'name', label: t('permissions.permissionName'), type: 'text', required: true, placeholder: 'e.g. users.read' },
    { name: 'description', label: t('common.description'), type: 'textarea', placeholder: t('permissions.permissionDescription') },
  ];

  const editFields: FormField[] = [
    { name: 'name', label: t('permissions.permissionName'), type: 'text', required: true, defaultValue: editItem?.name || '' },
    { name: 'description', label: t('common.description'), type: 'textarea', defaultValue: editItem?.description || '' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('common.permissions')}</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">{t('permissions.manageSystemPermissions')}</p>
      </div>

      <DataTable
        columns={columns}
        data={permissions}
        isLoading={isLoading}
        error={error?.message}
        searchable
        searchPlaceholder={t('permissions.searchPermissions')}
        emptyState={{ title: t('permissions.noPermissionsFound'), description: t('permissions.createANewPermissionToGetStarted') }}
        actions={{ add: { label: t('permissions.addPermission'), onClick: () => setShowAddModal(true) } }}
        rowActions={rowActions}
        onRetry={() => refetch()}
      />

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title={t('permissions.addNewPermission')} size="md">
        <DynamicForm
          fields={createFields}
          onSubmit={(data) => createMutation.mutate({ name: String(data.name), description: String(data.description ?? '') })}
          submitLabel={t('permissions.createPermission')}
          onCancel={() => setShowAddModal(false)}
          isLoading={createMutation.isPending}
        />
      </Modal>

      <Modal isOpen={editItem !== null} onClose={() => setEditItem(null)} title={t('permissions.editPermission')} size="md">
        {editItem && (
          <DynamicForm
            key={editItem.id}
            fields={editFields}
            onSubmit={(data) => updateMutation.mutate({ id: editItem.id, dto: { name: String(data.name), description: String(data.description ?? '') } })}
            submitLabel={t('permissions.updatePermission')}
            onCancel={() => setEditItem(null)}
            isLoading={updateMutation.isPending}
          />
        )}
      </Modal>

      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId !== null && deleteMutation.mutate(deleteId)}
        title={t('permissions.deletePermission')}
        message={t('permissions.areYouSureYouWantToDeleteThisPermissionT')}
        confirmText={t('common.delete')}
        variant="danger"
      />
    </div>
  );
};
