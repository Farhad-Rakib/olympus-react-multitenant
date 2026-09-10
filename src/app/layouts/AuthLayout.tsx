import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AuthService } from '../../core/services/impl/auth.service';
import { useSiteSettingsStore } from '../../core/stores/site-settings.store';

const authService = new AuthService();

export const AuthLayout: React.FC = () => {
  const { siteTitle, logoUrl, tagline, setBranding } = useSiteSettingsStore();

  // Branding comes from login-config, NOT the site-settings list: this screen is pre-auth, and
  // siteSettingsApi.getAll() requires a token, so it always failed here and left the login page
  // showing the generic fallback. login-config is anonymous and resolves the tenant from the host
  // (custom domain / subdomain), which is exactly how a white-labeled login page is reached.
  const { data: loginConfig } = useQuery({
    queryKey: ['login-config'],
    queryFn: () => authService.getLoginConfig(),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  useEffect(() => {
    if (loginConfig?.branding) {
      setBranding(loginConfig.branding);
    }
  }, [loginConfig, setBranding]);

  const title = siteTitle || 'Admin Panel';
  const description = tagline || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            {logoUrl && (
              <img
                src={logoUrl}
                alt={title}
                className="h-12 mx-auto mb-4 object-contain"
                // A tenant-supplied URL that 404s would otherwise leave a broken-image icon on the
                // login screen -- the worst possible first impression for a white-labeled product.
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            )}
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {title}
            </h1>
            {description && (
              <p className="text-gray-600 dark:text-gray-400">{description}</p>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};
