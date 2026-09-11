import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LoginRequestDto } from '../../../domain/dto/auth.dto';
import { authApi } from '../../../core/api/services/auth.api';
import { menuApi } from '../../../core/api/services/menu.api';
import { AppConfig } from '../../../core/config/app.config';
import { queryClient } from '../../../app/providers/AppProviders';
import { useSiteSettingsStore } from '../../../core/stores/site-settings.store';
import { getApiErrorMessage } from '../../../core/utils/error';

interface TokenPayload {
  sub?: string;
  email?: string;
  name?: string;
  role?: string;
  permissions?: string[];
  tenant_id?: string;
  platform_admin?: string;
  // Present only on an impersonation token: id of the support user acting as this one.
  act_by?: string;
  [key: string]: unknown;
}

export interface ImpersonationSession {
  // The real session, restored on exit or when the short-lived token expires.
  original: { accessToken: string | null; refreshToken: string | null; tokenPayload: TokenPayload | null };
  userId: number;
  fullName: string;
  email: string;
  expiresAtUtc: string;
}

// Claims are attacker-influenced data from a decoded token, so the shape is checked rather than
// asserted. The backend has emitted both "permissions" and "permission" over time; both are read.
const readPermissions = (payload: TokenPayload): string[] => {
  const raw = payload.permissions ?? payload.permission;
  return Array.isArray(raw) ? raw.filter((p): p is string => typeof p === 'string') : [];
};

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  tokenPayload: TokenPayload | null;
  tenantSlug: string | null;
  // Platform admins only: the tenant they are currently administering. Sent as X-Tenant-Id in
  // place of their home tenant; the backend ignores that header for anyone else, so this can
  // never widen a regular user's access. null = act as yourself.
  actingTenantSlug: string | null;
  impersonation: ImpersonationSession | null;
  login: (dto: LoginRequestDto) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  isPlatformAdmin: () => boolean;
  setActingTenant: (slug: string | null) => void;
  startImpersonation: (result: { accessToken: string; accessTokenExpiresAtUtc: string; userId: number; fullName: string; email: string }) => void;
  endImpersonation: () => void;
}

function decodeJwtPayload(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      tokenPayload: null,
      tenantSlug: null,
      actingTenantSlug: null,
      impersonation: null,

      login: async (dto: LoginRequestDto) => {
        set({ isLoading: true, error: null, tenantSlug: dto.tenantSlug });
        try {
          const response = await authApi.login(dto);
          const payload = decodeJwtPayload(response.tokens.accessToken);

          set({
            accessToken: response.tokens.accessToken,
            refreshToken: response.tokens.refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            tokenPayload: payload,
          });

          useSiteSettingsStore.getState().setBranding(response.branding);

          queryClient.prefetchQuery({
            queryKey: ['menu'],
            queryFn: () => menuApi.getMenuItems(),
          });
        } catch (error: unknown) {
          const message = getApiErrorMessage(error, 'Login failed');
          set({
            error: message,
            isLoading: false,
            isAuthenticated: false,
          });
          throw new Error(message);
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await authApi.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          queryClient.clear();

          set({
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            tokenPayload: null,
            tenantSlug: null,
            actingTenantSlug: null,
            impersonation: null,
          });

          const storage = AppConfig.auth.storageType === 'localStorage' ? localStorage : sessionStorage;
          storage.removeItem(AppConfig.auth.tokenKey);
        }
      },

      clearError: () => set({ error: null }),

      hasPermission: (permission: string): boolean => {
        const { tokenPayload } = get();
        if (!tokenPayload) return false;
        const perms = tokenPayload.permissions || tokenPayload.permission || [];
        if (Array.isArray(perms)) return perms.includes(permission);
        return false;
      },

      hasAnyPermission: (permissions: string[]): boolean => {
        const { tokenPayload } = get();
        if (!tokenPayload) return false;
        const perms = readPermissions(tokenPayload);
        return permissions.some(p => perms.includes(p));
      },

      hasAllPermissions: (permissions: string[]): boolean => {
        const { tokenPayload } = get();
        if (!tokenPayload) return false;
        const perms = readPermissions(tokenPayload);
        return permissions.every(p => perms.includes(p));
      },

      // Mirrors the claim TenantResolutionMiddleware checks. Purely cosmetic on the client (shows
      // the switcher); the server re-checks the claim on every overridden request.
      isPlatformAdmin: (): boolean => get().tokenPayload?.platform_admin === 'true',

      // Swap the session to the impersonation token. No refresh token: when it expires the
      // interceptor's auth-error path restores the original session instead of logging out.
      startImpersonation: (result) => {
        const { accessToken, refreshToken, tokenPayload, impersonation } = get();
        if (impersonation) return; // no chaining client-side either
        set({
          impersonation: {
            original: { accessToken, refreshToken, tokenPayload },
            userId: result.userId,
            fullName: result.fullName,
            email: result.email,
            expiresAtUtc: result.accessTokenExpiresAtUtc,
          },
          accessToken: result.accessToken,
          refreshToken: null,
          tokenPayload: decodeJwtPayload(result.accessToken),
        });
        queryClient.clear();
      },

      endImpersonation: () => {
        const { impersonation } = get();
        if (!impersonation) return;
        set({
          impersonation: null,
          accessToken: impersonation.original.accessToken,
          refreshToken: impersonation.original.refreshToken,
          tokenPayload: impersonation.original.tokenPayload,
          isAuthenticated: !!impersonation.original.accessToken,
        });
        queryClient.clear();
      },

      setActingTenant: (slug: string | null) => {
        const next = slug && slug !== get().tenantSlug ? slug : null;
        if (next === get().actingTenantSlug) return;
        set({ actingTenantSlug: next });
        // Everything cached so far belongs to the previous tenant: menus, users, settings, the
        // licence banner. Drop it all rather than trying to enumerate the tenant-scoped keys.
        queryClient.clear();
      },
    }),
    {
      name: AppConfig.auth.tokenKey,
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        tokenPayload: state.tokenPayload,
        tenantSlug: state.tenantSlug,
        actingTenantSlug: state.actingTenantSlug,
        impersonation: state.impersonation,
      }),
    }
  )
);
