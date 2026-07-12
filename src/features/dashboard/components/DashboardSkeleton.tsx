import { useTranslation } from 'react-i18next';

const KPI_SKELETON_COUNT = 3;
const SKELETON_BLOCK_CLASSNAME = 'animate-pulse rounded-xl bg-muted';

export const DashboardSkeleton = () => {
  const { t } = useTranslation();

  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-6">
      <span className="sr-only">{t('dashboard.loading')}</span>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {Array.from({ length: KPI_SKELETON_COUNT }, (_, index) => (
          <div key={index} className={`h-24 ${SKELETON_BLOCK_CLASSNAME}`} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className={`h-72 ${SKELETON_BLOCK_CLASSNAME}`} />
        <div className={`h-72 ${SKELETON_BLOCK_CLASSNAME}`} />
      </div>
    </div>
  );
};
