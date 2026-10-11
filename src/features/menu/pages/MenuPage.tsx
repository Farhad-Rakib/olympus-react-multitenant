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
import { asText, asOptionalText, asOptionalNumber } from '../../../core/utils/form';

interface MenuDto {
  id: number;
  title: string;
  url: string | null;
  icon: string | null;
  requiredPermission: string | null;
  parentMenuId: number | null;
  children: MenuDto[] | null;
}

interface CreateMenuDto {
  title: string;
  url: string | null;
  icon: string | null;
  requiredPermission: string | null;
  parentMenuId: number | null;
}

class MenuCrudApi extends BaseRepository {
  constructor() { super('/Menu'); }
  async getAll(): Promise<MenuDto[]> {
    const res = await this.get<ApiResponse<MenuDto[]>>('/all');
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async create(dto: CreateMenuDto): Promise<MenuDto> {
    const res = await this.post<ApiResponse<MenuDto>>('', dto);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async update(id: number, dto: CreateMenuDto): Promise<void> {
    const res = await this.put<ApiResponse<unknown>>(`/${id}`, dto);
    if (!res.success) throw new Error(res.message);
  }
  async remove(id: number): Promise<void> {
    await this.delete<void>(`/${id}`);
  }
}

const menuCrudApi = new MenuCrudApi();

// Flatten nested menu structure for table display
function flattenMenuItems(items: MenuDto[]): MenuDto[] {
    
  
  const result: MenuDto[] = [];
  for (const item of items) {
    result.push(item);
    if (item.children && item.children.length > 0) {
      for (const child of item.children) {
        if (!result.find(r => r.id === child.id)) {
          result.push(child);
        }
      }
    }
  }
  return result;
}

export const MenuPage: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editItem, setEditItem] = useState<MenuDto | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: rawMenuItems = [], isLoading, error, refetch } = useQuery({
    queryKey: ['menu-crud'],
    queryFn: () => menuCrudApi.getAll(),
  });

  const menuItems = flattenMenuItems(rawMenuItems);
  // Deduplicate by id
  const seen = new Set<number>();
  const uniqueItems = menuItems.filter(item => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });

  const createMutation = useMutation({
    mutationFn: (dto: CreateMenuDto) => menuCrudApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-crud'] });
      queryClient.invalidateQueries({ queryKey: ['menu'] });
      toast.success(t('menu.menuItemCreatedSuccessfully'));
      setShowAddModal(false);
    },
    onError: (error: unknown) => toast.error(getApiErrorMessage(error, t('menu.failedToCreateMenuItem'))),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: CreateMenuDto }) => menuCrudApi.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-crud'] });
      queryClient.invalidateQueries({ queryKey: ['menu'] });
      toast.success(t('menu.menuItemUpdatedSuccessfully'));
      setEditItem(null);
    },
    onError: (error: unknown) => toast.error(getApiErrorMessage(error, t('menu.failedToUpdateMenuItem'))),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => menuCrudApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-crud'] });
      queryClient.invalidateQueries({ queryKey: ['menu'] });
      toast.success(t('menu.menuItemDeletedSuccessfully'));
      setDeleteId(null);
    },
    onError: (error: unknown) => toast.error(getApiErrorMessage(error, t('menu.failedToDeleteMenuItem'))),
  });

  const columns: Column<MenuDto>[] = [
    { key: 'id', label: 'ID', width: '60px' },
    { key: 'title', label: t('menu.title'), sortable: true },
    { key: 'url', label: 'URL', sortable: true, render: (val) => val ? (
      <code className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-300">{String(val)}</code>
    ) : <span className="text-xs text-gray-400">-</span> },
    { key: 'icon', label: t('menu.icon'), render: (val) => (
      <span className="text-xs text-gray-500 dark:text-gray-400">{val ? String(val) : '-'}</span>
    )},
    { key: 'requiredPermission', label: t('menu.permission'), render: (val) => val ? (
      <span className="px-2 py-0.5 text-xs font-medium rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">{String(val)}</span>
    ) : <span className="text-xs text-gray-400">{t('menu.public')}</span>},
    { key: 'parentMenuId', label: t('menu.parent'), width: '80px', render: (val) => {
      if (!val) return <span className="text-xs text-gray-400">{t('menu.root')}</span>;
      const parent = uniqueItems.find(m => m.id === val);
      return <span className="text-xs text-gray-500">{parent?.title || `#${val}`}</span>;
    }},
  ];

  const rowActions: RowAction<MenuDto>[] = [
    { icon: Pencil, label: t('common.edit'), onClick: (m) => setEditItem(m), variant: 'primary' },
    { icon: Trash2, label: t('common.delete'), onClick: (m) => setDeleteId(m.id), variant: 'danger' },
  ];

  const parentOptions = [
    { label: t('menu.noneRoot'), value: 0 },
    ...uniqueItems.filter(m => !m.parentMenuId).map((m) => ({ label: m.title, value: m.id })),
  ];

  const createFields: FormField[] = [
    { name: 'title', label: t('menu.title'), type: 'text', required: true, placeholder: 'e.g. Dashboard' },
    { name: 'url', label: 'URL', type: 'text', placeholder: 'e.g. /dashboard (leave blank for parent-only)' },
    { name: 'icon', label: t('menu.icon'), type: 'text', placeholder: 'e.g. dashboard, users, settings' },
    { name: 'requiredPermission', label: t('menu.requiredPermission'), type: 'text', placeholder: 'e.g. users.read (blank for public)' },
    { name: 'parentMenuId', label: t('menu.parentMenu'), type: 'select', options: parentOptions, defaultValue: 0 },
  ];

  const editFields: FormField[] = [
    { name: 'title', label: t('menu.title'), type: 'text', required: true, defaultValue: editItem?.title || '' },
    { name: 'url', label: 'URL', type: 'text', defaultValue: editItem?.url || '' },
    { name: 'icon', label: t('menu.icon'), type: 'text', defaultValue: editItem?.icon || '' },
    { name: 'requiredPermission', label: t('menu.requiredPermission'), type: 'text', defaultValue: editItem?.requiredPermission || '' },
    { name: 'parentMenuId', label: t('menu.parentMenu'), type: 'select', options: parentOptions, defaultValue: editItem?.parentMenuId || 0 },
  ];

  const handleCreate = (data: Record<string, unknown>) => {
    createMutation.mutate({
      title: asText(data.title),
      url: asOptionalText(data.url),
      icon: asOptionalText(data.icon),
      requiredPermission: asOptionalText(data.requiredPermission),
      parentMenuId: asOptionalNumber(data.parentMenuId),
    });
  };

  const handleUpdate = (data: Record<string, unknown>) => {
    if (!editItem) return;
    updateMutation.mutate({
      id: editItem.id,
      dto: {
        title: asText(data.title),
        url: asOptionalText(data.url),
        icon: asOptionalText(data.icon),
        requiredPermission: asOptionalText(data.requiredPermission),
        parentMenuId: asOptionalNumber(data.parentMenuId),
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('menu.menuManagement')}</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">{t('menu.manageNavigationMenuItems')}</p>
      </div>

      <DataTable
        columns={columns}
        data={uniqueItems}
        isLoading={isLoading}
        error={error?.message}
        searchable
        searchPlaceholder={t('menu.searchMenuItems')}
        emptyState={{ title: t('menu.noMenuItemsFound'), description: t('menu.createANewMenuItemToGetStarted') }}
        actions={{ add: { label: t('menu.addMenuItem'), onClick: () => setShowAddModal(true) } }}
        rowActions={rowActions}
        onRetry={() => refetch()}
      />

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title={t('menu.addMenuItem')} size="md">
        <DynamicForm
          fields={createFields}
          onSubmit={handleCreate}
          submitLabel={t('common.create')}
          onCancel={() => setShowAddModal(false)}
          isLoading={createMutation.isPending}
        />
      </Modal>

      <Modal isOpen={editItem !== null} onClose={() => setEditItem(null)} title={t('menu.editMenuItem')} size="md">
        {editItem && (
          <DynamicForm
            key={editItem.id}
            fields={editFields}
            onSubmit={handleUpdate}
            submitLabel={t('common.update')}
            onCancel={() => setEditItem(null)}
            isLoading={updateMutation.isPending}
          />
        )}
      </Modal>

      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId !== null && deleteMutation.mutate(deleteId)}
        title={t('menu.deleteMenuItem')}
        message={t('menu.areYouSureYouWantToDeleteThisMenuItemThi')}
        confirmText={t('common.delete')}
        variant="danger"
      />
    </div>
  );
};
