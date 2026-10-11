import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, Download, Upload } from 'lucide-react';
import { useSettingsStore } from '../store/settings.store';
import { toast } from '../../../components/ui/Toast/toast.store';
import { formatDateTime } from '../../../core/i18n/format';

export const GeneralSettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const { general, updateGeneral, exportAsJSON, lastSaved } = useSettingsStore();
  const [form, setForm] = useState(general);

  const handleSave = () => {
    updateGeneral(form);
    toast.success(t('settings.generalSettingsSaved'));
  };

  const handleExport = () => {
    const json = exportAsJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'settings.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t('settings.settingsExported'));
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          if (data.general) {
            setForm(data.general);
            updateGeneral(data.general);
          }
          toast.success(t('settings.settingsImported'));
        } catch {
          toast.error(t('settings.invalidJsonFile'));
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const inputCls = 'w-full px-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow';
  const labelCls = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5';

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('settings.generalSettings')}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {t('settings.manageYourApplicationConfiguration')}
            {lastSaved && (
              <span className="ml-2 text-xs text-gray-400">
                Last saved: {formatDateTime(lastSaved)}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleImport} className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <Upload className="w-4 h-4" /> Import
          </button>
          <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
        <div className="p-6 space-y-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">{t('settings.application')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="site-name" className={labelCls}>{t('settings.siteName')}</label>
              <input id="site-name" value={form.siteName} onChange={(e) => setForm({ ...form, siteName: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label htmlFor="support-email" className={labelCls}>{t('settings.supportEmail')}</label>
              <input id="support-email" type="email" value={form.supportEmail} onChange={(e) => setForm({ ...form, supportEmail: e.target.value })} className={inputCls} />
            </div>
          </div>
          <div>
            <label htmlFor="site-description" className={labelCls}>{t('settings.siteDescription')}</label>
            <textarea id="site-description" rows={3} value={form.siteDescription} onChange={(e) => setForm({ ...form, siteDescription: e.target.value })} className={`${inputCls} resize-none`} />
          </div>
        </div>

        <div className="p-6 space-y-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">{t('settings.localization')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label htmlFor="timezone" className={labelCls}>{t('settings.timezone')}</label>
              <select id="timezone" value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} className={inputCls}>
                <option value="UTC">UTC</option>
                <option value="America/New_York">{t('settings.easternTime')}</option>
                <option value="America/Chicago">{t('settings.centralTime')}</option>
                <option value="America/Denver">{t('settings.mountainTime')}</option>
                <option value="America/Los_Angeles">{t('settings.pacificTime')}</option>
                <option value="Europe/London">{t('settings.london')}</option>
                <option value="Europe/Paris">{t('settings.paris')}</option>
                <option value="Asia/Tokyo">{t('settings.tokyo')}</option>
              </select>
            </div>
            <div>
              <label htmlFor="date-format" className={labelCls}>{t('settings.dateFormat')}</label>
              <select id="date-format" value={form.dateFormat} onChange={(e) => setForm({ ...form, dateFormat: e.target.value })} className={inputCls}>
                <option value="MM/DD/YYYY">{t('settings.mmDdYyyy')}</option>
                <option value="DD/MM/YYYY">{t('settings.ddMmYyyy')}</option>
                <option value="YYYY-MM-DD">{t('settings.yyyyMmDd')}</option>
              </select>
            </div>
            <div>
              <label htmlFor="language" className={labelCls}>{t('settings.language')}</label>
              <select id="language" value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} className={inputCls}>
                <option value="en">{t('settings.english')}</option>
                <option value="es">{t('settings.spanish')}</option>
                <option value="fr">{t('settings.french')}</option>
                <option value="de">{t('settings.german')}</option>
                <option value="ja">{t('settings.japanese')}</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">{t('settings.maintenanceMode')}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t('settings.whenEnabledOnlyAdminsCanAccessTheApplica')}</p>
            </div>
            <button
              onClick={() => setForm({ ...form, maintenanceMode: !form.maintenanceMode })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.maintenanceMode ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.maintenanceMode ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
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
