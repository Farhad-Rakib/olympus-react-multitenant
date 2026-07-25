import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthLayout } from '../layouts/AuthLayout';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { AuthGuard } from '../../core/guards/auth.guard';
import { LoginPage } from '../../features/auth/pages/LoginPage';
import { RegisterTenantPage } from '../../features/auth/pages/RegisterTenantPage';
import { DashboardPage } from '../../features/dashboard/pages/DashboardPage';
import { UsersPage } from '../../features/users/pages/UsersPage';
import { RolesPage } from '../../features/roles/pages/RolesPage';
import { TenantsPage } from '../../features/tenants/pages/TenantsPage';
import { SubscriptionPlansPage } from '../../features/subscription-plans/pages/SubscriptionPlansPage';
import { PermissionsPage } from '../../features/permissions/pages/PermissionsPage';
import { RolePermissionsPage } from '../../features/role-permissions/pages/RolePermissionsPage';
import { UserRolesPage } from '../../features/user-roles/pages/UserRolesPage';
import { MenuPage } from '../../features/menu/pages/MenuPage';
import { ReportsPage } from '../../features/reports/pages/ReportsPage';
import { PreferencesPage } from '../../features/preferences/pages/PreferencesPage';
import { ProfilePage } from '../../features/profile/pages/ProfilePage';
import { SiteSettingsPage } from '../../features/site-settings/pages/SiteSettingsPage';
import { SystemSettingsPage } from '../../features/system-settings/pages/SystemSettingsPage';
import { AuditLogsPage } from '../../features/audit-logs/pages/AuditLogsPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { ForbiddenPage } from '../pages/ForbiddenPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/',
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'register-tenant', element: <RegisterTenantPage /> },
    ],
  },
  {
    path: '/',
    element: (
      <AuthGuard>
        <DashboardLayout />
      </AuthGuard>
    ),
    children: [
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'users', element: <UsersPage /> },
      { path: 'roles', element: <RolesPage /> },
      { path: 'tenants', element: <TenantsPage /> },
      { path: 'subscription-plans', element: <SubscriptionPlansPage /> },
      { path: 'permissions', element: <PermissionsPage /> },
      { path: 'roles/permissions', element: <RolePermissionsPage /> },
      { path: 'users/roles', element: <UserRolesPage /> },
      { path: 'menu-management', element: <MenuPage /> },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'preferences', element: <PreferencesPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'site-settings', element: <SiteSettingsPage /> },
      { path: 'system-settings', element: <SystemSettingsPage /> },
      { path: 'audit-logs', element: <AuditLogsPage /> },
    ],
  },
  { path: '/403', element: <ForbiddenPage /> },
  { path: '*', element: <NotFoundPage /> },
]);
