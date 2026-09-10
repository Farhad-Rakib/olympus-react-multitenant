import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthLayout } from '../layouts/AuthLayout';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { AuthGuard } from '../../core/guards/auth.guard';
import { PermissionGuard } from '../../core/guards/permission.guard';

const LoginPage = lazy(() => import('../../features/auth/pages/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterTenantPage = lazy(() => import('../../features/auth/pages/RegisterTenantPage').then(m => ({ default: m.RegisterTenantPage })));
const DashboardPage = lazy(() => import('../../features/dashboard/pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const UsersPage = lazy(() => import('../../features/users/pages/UsersPage').then(m => ({ default: m.UsersPage })));
const RolesPage = lazy(() => import('../../features/roles/pages/RolesPage').then(m => ({ default: m.RolesPage })));
const TenantsPage = lazy(() => import('../../features/tenants/pages/TenantsPage').then(m => ({ default: m.TenantsPage })));
const SubscriptionPlansPage = lazy(() => import('../../features/subscription-plans/pages/SubscriptionPlansPage').then(m => ({ default: m.SubscriptionPlansPage })));
const PermissionsPage = lazy(() => import('../../features/permissions/pages/PermissionsPage').then(m => ({ default: m.PermissionsPage })));
const RolePermissionsPage = lazy(() => import('../../features/role-permissions/pages/RolePermissionsPage').then(m => ({ default: m.RolePermissionsPage })));
const UserRolesPage = lazy(() => import('../../features/user-roles/pages/UserRolesPage').then(m => ({ default: m.UserRolesPage })));
const MenuPage = lazy(() => import('../../features/menu/pages/MenuPage').then(m => ({ default: m.MenuPage })));
const ReportsPage = lazy(() => import('../../features/reports/pages/ReportsPage').then(m => ({ default: m.ReportsPage })));
const PreferencesPage = lazy(() => import('../../features/preferences/pages/PreferencesPage').then(m => ({ default: m.PreferencesPage })));
const ProfilePage = lazy(() => import('../../features/profile/pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const SiteSettingsPage = lazy(() => import('../../features/site-settings/pages/SiteSettingsPage').then(m => ({ default: m.SiteSettingsPage })));
const SystemSettingsPage = lazy(() => import('../../features/system-settings/pages/SystemSettingsPage').then(m => ({ default: m.SystemSettingsPage })));
const AuditLogsPage = lazy(() => import('../../features/audit-logs/pages/AuditLogsPage').then(m => ({ default: m.AuditLogsPage })));
const FeatureFlagsPage = lazy(() => import('../../features/feature-flags/pages/FeatureFlagsPage').then(m => ({ default: m.FeatureFlagsPage })));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })));
const ForbiddenPage = lazy(() => import('../pages/ForbiddenPage').then(m => ({ default: m.ForbiddenPage })));

// Every page is a separate chunk. Previously all 23 were imported eagerly into one ~1.7 MB bundle,
// so a tenant user downloaded the platform-admin screens and all of recharts before the login form
// could render. Layouts and guards stay eager -- they are on every route, so deferring them would
// only add a waterfall.
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
      // Dashboard/Preferences/Profile are self-scoped -- every authenticated user can reach them,
      // matching their backend endpoints (no permission policy beyond [Authorize]).
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'preferences', element: <PreferencesPage /> },
      { path: 'profile', element: <ProfilePage /> },
      {
        path: 'users',
        element: <PermissionGuard permissions={['users.read']}><UsersPage /></PermissionGuard>,
      },
      {
        path: 'roles',
        element: <PermissionGuard permissions={['roles.read']}><RolesPage /></PermissionGuard>,
      },
      {
        path: 'tenants',
        element: <PermissionGuard permissions={['tenants.manage']}><TenantsPage /></PermissionGuard>,
      },
      {
        path: 'subscription-plans',
        element: <PermissionGuard permissions={['subscription-plans.manage']}><SubscriptionPlansPage /></PermissionGuard>,
      },
      {
        path: 'permissions',
        element: <PermissionGuard permissions={['permissions.read']}><PermissionsPage /></PermissionGuard>,
      },
      {
        path: 'roles/permissions',
        element: <PermissionGuard permissions={['role-permissions.read']}><RolePermissionsPage /></PermissionGuard>,
      },
      {
        path: 'users/roles',
        element: <PermissionGuard permissions={['user-roles.read']}><UserRolesPage /></PermissionGuard>,
      },
      {
        path: 'menu-management',
        element: <PermissionGuard permissions={['menus.read']}><MenuPage /></PermissionGuard>,
      },
      {
        path: 'reports',
        element: <PermissionGuard permissions={['reports.read']}><ReportsPage /></PermissionGuard>,
      },
      {
        path: 'site-settings',
        element: <PermissionGuard permissions={['site-settings.read']}><SiteSettingsPage /></PermissionGuard>,
      },
      {
        path: 'system-settings',
        element: <PermissionGuard permissions={['system-settings.manage']}><SystemSettingsPage /></PermissionGuard>,
      },
      {
        path: 'audit-logs',
        element: <PermissionGuard permissions={['audit-logs.read']}><AuditLogsPage /></PermissionGuard>,
      },
      {
        path: 'feature-flags',
        element: <PermissionGuard permissions={['feature-flags.read']}><FeatureFlagsPage /></PermissionGuard>,
      },
    ],
  },
  { path: '/403', element: <ForbiddenPage /> },
  { path: '*', element: <NotFoundPage /> },
]);
