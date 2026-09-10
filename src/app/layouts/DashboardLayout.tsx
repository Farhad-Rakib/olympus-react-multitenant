import { useState, useEffect, Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { LicenseStatusBanner } from './components/LicenseStatusBanner';
import { CommandPalette } from '../../components/CommandPalette/CommandPalette';
import { ErrorBoundary } from '../../components/ErrorBoundary/ErrorBoundary';
import { Loader } from '../../components/ui/Loader/Loader';
import { siteSettingsApi } from '../../core/api/services/site-settings.api';
import { useSiteSettingsStore } from '../../core/stores/site-settings.store';

export const DashboardLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { setSettings } = useSiteSettingsStore();
  const location = useLocation();

  const { data: allSettings } = useQuery({
    queryKey: ['site-settings-all'],
    queryFn: () => siteSettingsApi.getAll(),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  useEffect(() => {
    if (allSettings && allSettings.length > 0) {
      setSettings(allSettings);
    }
  }, [allSettings, setSettings]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <CommandPalette />
      <div className="flex h-screen overflow-hidden">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        <div className="flex-1 flex flex-col overflow-hidden">
          <Header onMenuClick={() => setIsSidebarOpen(true)} />
          <LicenseStatusBanner />

          <main className="flex-1 overflow-y-auto">
            <div className="container mx-auto px-4 py-6">
              {/* Boundary sits INSIDE the layout, so a page crash leaves the sidebar and header
                  usable instead of blanking the whole app. Keyed by pathname so navigating away
                  from a broken page clears the error rather than trapping the user on it. */}
              <ErrorBoundary key={location.pathname}>
                <Suspense fallback={<Loader text="Loading..." />}>
                  <Outlet />
                </Suspense>
              </ErrorBoundary>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
