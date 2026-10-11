import type { TFunction } from 'i18next';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings, Shield, Bell } from 'lucide-react';
import { GeneralSettingsPage } from './GeneralSettingsPage';
import { SecuritySettingsPage } from './SecuritySettingsPage';
import { NotificationSettingsPage } from './NotificationSettingsPage';

const tabs = (t: TFunction) => [
  { id: 'general', label: t('settings.general'), icon: Settings },
  { id: 'security', label: t('settings.security'), icon: Shield },
  { id: 'notifications', label: t('settings.notifications'), icon: Bell },
];

export const SettingsLayout: React.FC<{ initialTab?: string }> = ({ initialTab = 'general' }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(initialTab);

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="lg:w-56 shrink-0">
        <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
          {tabs(t).map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
      <div className="flex-1 min-w-0">
        {activeTab === 'general' && <GeneralSettingsPage />}
        {activeTab === 'security' && <SecuritySettingsPage />}
        {activeTab === 'notifications' && <NotificationSettingsPage />}
      </div>
    </div>
  );
};
