import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Mail, Eye, UserCog } from 'lucide-react';
import { useAuthStore } from '../../auth/store/auth.store';
import { DataTable, Column, RowAction } from '../../../components/table/DataTable';
import { Modal } from '../../../components/ui/Modal/Modal';
import { DynamicForm, FormField } from '../../../components/form/DynamicForm';
import { toast } from '../../../components/ui/Toast/toast.store';
import { BaseRepository } from '../../../core/api/base.repository';
import { ApiResponse } from '../../../domain/dto/auth.dto';
import { getApiErrorMessage } from '../../../core/utils/error';
import { asText, asOptionalText } from '../../../core/utils/form';

interface UserDto {
  id: number;
  fullName: string;
  email: string;
  isActive: boolean;
  roles: string[];
}

interface RoleDto {
  id: number;
  name: string;
}

class UsersApi extends BaseRepository {
  constructor() { super('/Users'); }
  async getAll(): Promise<UserDto[]> {
    const res = await this.get<ApiResponse<UserDto[]>>('');
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async getById(id: number): Promise<UserDto> {
    const res = await this.get<ApiResponse<UserDto>>(`/${id}`);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async impersonate(userId: number): Promise<{ accessToken: string; accessTokenExpiresAtUtc: string; userId: number; fullName: string; email: string }> {
    const res = await this.post<ApiResponse<{ accessToken: string; accessTokenExpiresAtUtc: string; userId: number; fullName: string; email: string }>>(`/${userId}/impersonate`, {});
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async updateRoles(userId: number, roleIds: number[]): Promise<UserDto> {
    const res = await this.put<ApiResponse<UserDto>>(`/${userId}/roles`, { roleIds });
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
}

class AuthRegisterApi extends BaseRepository {
  constructor() { super('/Auth'); }
  async register(dto: { fullName: string; email: string; password: string; roles: string[] }): Promise<unknown> {
    const res = await this.post<ApiResponse<unknown>>('/register', dto);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
}

class RolesListApi extends BaseRepository {
  constructor() { super('/roles'); }
  async getAll(): Promise<RoleDto[]> {
    const res = await this.get<ApiResponse<RoleDto[]>>('');
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
}

const usersApi = new UsersApi();
const authRegisterApi = new AuthRegisterApi();
const rolesListApi = new RolesListApi();

export const UsersPage: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const canImpersonate = useAuthStore((s) => s.hasPermission('users.impersonate') || s.isPlatformAdmin());
  const impersonation = useAuthStore((s) => s.impersonation);
  const currentUserId = useAuthStore((s) => s.tokenPayload?.sub);
  const startImpersonation = useAuthStore((s) => s.startImpersonation);

  const impersonateMutation = useMutation({
    mutationFn: (userId: number) => usersApi.impersonate(userId),
    onSuccess: (result) => {
      startImpersonation(result);
      // Full navigation, not router navigate(): the swap re-renders this users.read-guarded page
      // with the target's permissions before an async router transition lands, bouncing to /403.
      // A reload also guarantees nothing from the support user's identity lingers in memory.
      window.location.assign('/dashboard');
    },
    onError: (error: unknown) => toast.error(getApiErrorMessage(error, t('users.couldNotStartImpersonation'))),
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [editUser, setEditUser] = useState<UserDto | null>(null);
  const [viewUser, setViewUser] = useState<UserDto | null>(null);

  const { data: users = [], isLoading, error, refetch } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getAll(),
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['roles-list'],
    queryFn: () => rolesListApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (dto: { fullName: string; email: string; password: string; roles: string[] }) =>
      authRegisterApi.register(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(t('users.userCreatedSuccessfully'));
      setShowAddModal(false);
    },
    onError: (error: unknown) => toast.error(getApiErrorMessage(error, t('users.failedToCreateUser'))),
  });

  const updateRolesMutation = useMutation({
    mutationFn: ({ userId, roleIds }: { userId: number; roleIds: number[] }) =>
      usersApi.updateRoles(userId, roleIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(t('users.userRolesUpdated'));
      setEditUser(null);
    },
    onError: (error: unknown) => toast.error(getApiErrorMessage(error, t('users.failedToUpdateRoles'))),
  });

  const getStatusBadge = (isActive: boolean) => (
    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
      isActive
        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
    }`}>
      {isActive ? t('common.active') : t('common.inactive')}
    </span>
  );

  const getRoleBadges = (userRoles: string[]) => (
    <div className="flex flex-wrap gap-1">
      {userRoles.map((role) => (
        <span key={role} className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
          {role}
        </span>
      ))}
      {userRoles.length === 0 && <span className="text-xs text-gray-400">{t('users.noRoles')}</span>}
    </div>
  );

  const columns: Column<UserDto>[] = [
    {
      key: 'fullName',
      label: t('common.name'),
      sortable: true,
      render: (_, user) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {user.fullName.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{user.fullName}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <Mail className="w-3 h-3" />{user.email}
            </p>
          </div>
        </div>
      ),
    },
    { key: 'roles', label: t('common.roles'), sortable: false, render: (_, user) => getRoleBadges(user.roles || []) },
    { key: 'isActive', label: t('common.status'), sortable: true, render: (_, user) => getStatusBadge(user.isActive) },
  ];

  const rowActions: RowAction<UserDto>[] = [
    { icon: Eye, label: t('users.view'), onClick: (user) => setViewUser(user), variant: 'secondary' },
    { icon: Pencil, label: t('users.editRoles'), onClick: (user) => setEditUser(user), variant: 'primary' },
    {
      icon: UserCog,
      label: t('users.viewAs'),
      variant: 'warning',
      // Hidden unless granted (users.impersonate is not in the Admin role by default), while
      // already impersonating (the server refuses chaining anyway), and for yourself.
      show: (user) => canImpersonate && !impersonation && String(user.id) !== currentUserId && user.isActive,
      onClick: (user) => impersonateMutation.mutate(user.id),
    },
  ];

  const createFields: FormField[] = [
    { name: 'fullName', label: t('users.fullName'), type: 'text', required: true, placeholder: t('users.johnDoe') },
    { name: 'email', label: t('common.email'), type: 'email', required: true, placeholder: 'john@example.com' },
    { name: 'password', label: t('common.password'), type: 'password', required: true, placeholder: t('users.enterPassword') },
    {
      name: 'role',
      label: t('common.role'),
      type: 'select',
      required: true,
      options: roles.map(r => ({ label: r.name, value: r.name })),
    },
  ];

  const editRoleFields: FormField[] = roles.length > 0 ? [
    {
      name: 'roleIds',
      label: t('users.assignRoles'),
      type: 'select',
      required: true,
      options: roles.map(r => ({ label: r.name, value: r.id })),
      defaultValue: roles.find(r => editUser?.roles?.includes(r.name))?.id || '',
    },
  ] : [];

  const handleCreate = (data: Record<string, unknown>) => {
    createMutation.mutate({
      fullName: asText(data.fullName),
      email: asText(data.email),
      password: asText(data.password),
      roles: asOptionalText(data.role) ? [asText(data.role)] : [],
    });
  };

  const handleUpdateRoles = (data: Record<string, unknown>) => {
    if (!editUser) return;
    const roleIds = data.roleIds ? [Number(data.roleIds)] : [];
    updateRolesMutation.mutate({ userId: editUser.id, roleIds });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('common.users')}</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">{t('users.manageUserAccountsAndAccess')}</p>
      </div>

      <DataTable
        columns={columns}
        data={users}
        isLoading={isLoading}
        error={error?.message}
        searchable
        searchPlaceholder={t('users.searchUsersByNameOrEmail')}
        emptyState={{ title: t('users.noUsersFound'), description: t('users.createANewUserToGetStarted') }}
        actions={{ add: { label: t('users.addUser'), onClick: () => setShowAddModal(true) } }}
        rowActions={rowActions}
        onRetry={() => refetch()}
      />

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title={t('users.addNewUser')} size="md">
        <DynamicForm
          fields={createFields}
          onSubmit={handleCreate}
          submitLabel={t('users.createUser')}
          onCancel={() => setShowAddModal(false)}
          isLoading={createMutation.isPending}
        />
      </Modal>

      <Modal isOpen={editUser !== null} onClose={() => setEditUser(null)} title={t('users.editUserRoles')} size="md">
        {editUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {editUser.fullName.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{editUser.fullName}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{editUser.email}</p>
              </div>
            </div>
            <DynamicForm
              key={editUser.id}
              fields={editRoleFields}
              onSubmit={handleUpdateRoles}
              submitLabel={t('users.updateRoles')}
              onCancel={() => setEditUser(null)}
              isLoading={updateRolesMutation.isPending}
            />
          </div>
        )}
      </Modal>

      <Modal isOpen={viewUser !== null} onClose={() => setViewUser(null)} title={t('users.userDetails')} size="md">
        {viewUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-white text-xl font-medium">
                  {viewUser.fullName.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{viewUser.fullName}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{viewUser.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('common.status')}</p>
                <div className="mt-1">{getStatusBadge(viewUser.isActive)}</div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('common.roles')}</p>
                <div className="mt-1">{getRoleBadges(viewUser.roles || [])}</div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
