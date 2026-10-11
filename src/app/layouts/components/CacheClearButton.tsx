import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../../features/auth/store/auth.store';
import { useNotificationStore } from '../../../core/stores/notification.store';
import { systemCacheApi } from '../../../core/api/services/system-cache.api';

// Header action that flushes the server caches (permissions, menus, roles, …) and the client's
// React Query cache in one click. Only rendered for users holding system.cache.flush.
export const CacheClearButton: React.FC = () => {
  const { t } = useTranslation();
  const { hasPermission } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);

  if (!hasPermission('system.cache.flush')) return null;

  const handleClick = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await systemCacheApi.flushAll();
      queryClient.clear();
      await queryClient.invalidateQueries();
      const redisPart = result.redisDeleted === null ? '' : `, ${result.redisDeleted} Redis`;
      addNotification({
        title: t('header.cacheCleared'),
        message: `Removed ${result.distributedDeleted} server entries${redisPart}; client cache reset.`,
        type: 'success',
      });
    } catch (err) {
      addNotification({
        title: t('header.cacheClearFailed'),
        message: err instanceof Error ? err.message : 'Unknown error',
        type: 'error',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      aria-label={t('header.clearCache')}
      title={t('header.clearCacheTitle')}
      className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
    >
      <RefreshCw className={`w-5 h-5 ${busy ? 'animate-spin' : ''}`} />
    </button>
  );
};
