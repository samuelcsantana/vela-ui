import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { Search } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useDebounce } from '../../../hooks/use-debounce';
import { userFiltersSchema, type UserFiltersValues } from '../schema';

const SEARCH_DEBOUNCE_MS = 300;
const SEARCH_INPUT_ID = 'users-search';
const SEARCH_ERROR_ID = 'users-search-error';

export const UserFilters = () => {
  const { t } = useTranslation();
  const navigate = useNavigate({ from: '/users' });
  const { search } = useSearch({ from: '/_protected/users' });

  const {
    register,
    watch,
    formState: { errors },
  } = useForm<UserFiltersValues>({
    resolver: zodResolver(userFiltersSchema),
    mode: 'onChange',
    defaultValues: { search: search ?? '' },
  });

  const searchValue = watch('search');
  const debouncedSearch = useDebounce(searchValue, SEARCH_DEBOUNCE_MS);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    navigate({
      search: (prev) => ({ ...prev, search: debouncedSearch.trim() || undefined, page: 1 }),
      replace: true,
    });
  }, [debouncedSearch, navigate]);

  const hasError = Boolean(errors.search);

  return (
    <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-start">
      <div className="relative w-full sm:max-w-md">
        <label htmlFor={SEARCH_INPUT_ID} className="sr-only">
          {t('users.search.label')}
        </label>
        <Search
          size={16}
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          id={SEARCH_INPUT_ID}
          type="text"
          placeholder={t('users.search.placeholder')}
          aria-invalid={hasError}
          aria-describedby={hasError ? SEARCH_ERROR_ID : undefined}
          className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
          {...register('search')}
        />
      </div>
      <p id={SEARCH_ERROR_ID} aria-live="polite" className="text-sm text-destructive sm:self-center">
        {errors.search?.message ? t(errors.search.message) : ''}
      </p>
    </div>
  );
};
