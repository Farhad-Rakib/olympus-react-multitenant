import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, Bell } from 'lucide-react';
import { useSettingsStore } from '../store/settings.store';
import { toast } from '../../../components/ui/Toast/toast.store';

export const NotificationSettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const { notifications, updateNotifications } = useSettingsStore();
  const [form, setForm] = useState(notifications);

  const handleSave = () => {
    updateNotifications(form);
    toast.success(t('settings.notificationSettingsSaved'));
  };

  const Toggle: React.FC<{ checked: boolean; onChange: () => void; label: string; desc: string }> = ({ checked, onChange, label, desc }) => (
    <div className="flex items-center justify-between py-3">
      <div>
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">{label}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{desc}</p>
      </div>
      <button
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Bell className="w-6 h-6 text-blue-600" /> Notification Settings
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{t('settings.controlHowAndWhenYouReceiveNotifications')}</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
        <div className="p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">{t('settings.channels')}</h2>
          <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
            <Toggle checked={form.emailNotifications} onChange={() => setForm({ ...form, emailNotifications: !form.emailNotifications })} label={t('settings.emailNotifications')} desc="Receive notifications via email" />
            <Toggle checked={form.pushNotifications} onChange={() => setForm({ ...form, pushNotifications: !form.pushNotifications })} label={t('settings.pushNotifications')} desc="Receive browser push notifications" />
          </div>
        </div>

        <div className="p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">{t('settings.alerts')}</h2>
          <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
            <Toggle checked={form.newUserAlert} onChange={() => setForm({ ...form, newUserAlert: !form.newUserAlert })} label={t('settings.newUserRegistrations')} desc="Get notified when new users sign up" />
            <Toggle checked={form.securityAlert} onChange={() => setForm({ ...form, securityAlert: !form.securityAlert })} label={t('settings.securityAlerts')} desc="Failed logins, suspicious activity, etc." />
            <Toggle checked={form.systemUpdateAlert} onChange={() => setForm({ ...form, systemUpdateAlert: !form.systemUpdateAlert })} label={t('settings.systemUpdates')} desc="System maintenance and update notifications" />
          </div>
        </div>

        <div className="p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">{t('settings.reports')}</h2>
          <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
            <Toggle checked={form.weeklyReport} onChange={() => setForm({ ...form, weeklyReport: !form.weeklyReport })} label={t('settings.weeklySummary')} desc="Receive a weekly activity summary via email" />
            <Toggle checked={form.monthlyReport} onChange={() => setForm({ ...form, monthlyReport: !form.monthlyReport })} label={t('settings.monthlyReport')} desc="Detailed monthly analytics and metrics report" />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm">
          <Save className="w-4 h-4" /> Save Changes
        </button>
      </div>
    </div>
  );
};
