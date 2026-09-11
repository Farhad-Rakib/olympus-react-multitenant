import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-blue-600 dark:text-blue-400">404</h1>
          <div className="h-1 w-32 bg-blue-600 dark:bg-blue-400 mx-auto mt-4 rounded-full"></div>
        </div>

        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{t('errors.pageNotFound')}</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md">
          {t('errors.thePageYouAreLookingForMightHaveBeenRemo')}
          temporarily unavailable.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('errors.goBack')}
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Home className="w-4 h-4" />
            {t('errors.goToDashboard')}
          </button>
        </div>
      </div>
    </div>
  );
};
