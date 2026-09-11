import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, ChevronDown, ChevronUp, ChevronsUpDown, Plus } from 'lucide-react';
import { Loader } from '../ui/Loader/Loader';
import { EmptyState } from '../ui/EmptyState/EmptyState';
import { ErrorState } from '../ui/ErrorState/ErrorState';
import { Autocomplete, AutocompleteOption } from '../ui/Autocomplete/Autocomplete';

export interface RowAction<T> {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: (row: T) => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
  show?: (row: T) => boolean;
}

export interface Column<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  error?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  onSearch?: (term: string) => void;
  searchOptions?: AutocompleteOption[];
  sortable?: boolean;
  onSort?: (key: keyof T, order: 'asc' | 'desc') => void;
  pagination?: {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
  };
  emptyState?: {
    title: string;
    description?: string;
  };
  actions?: {
    add?: {
      label: string;
      onClick: () => void;
    };
  };
  rowActions?: RowAction<T>[];
  onRetry?: () => void;
  // Bulk selection: pass a key selector to show a checkbox column; bulkActions render in a bar
  // above the table while at least one row is selected.
  rowKey?: (row: T) => string | number;
  bulkActions?: BulkAction<T>[];
}

export interface BulkAction<T> {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: (rows: T[]) => void | Promise<void>;
  variant?: 'primary' | 'secondary' | 'danger';
}

// `object` rather than Record<string, unknown>: a TypeScript interface has no implicit index
// signature, so every DTO in this codebase would fail a Record constraint. Cell values are read
// through an explicit `keyof T` cast at the indexing site below.
export function DataTable<T extends object>({
  columns,
  data,
  isLoading,
  error,
  searchable = true,
  searchPlaceholder = 'Search...',
  onSearch,
  searchOptions,
  sortable = true,
  onSort,
  pagination,
  emptyState,
  actions,
  rowActions,
  onRetry,
  rowKey,
  bulkActions,
}: DataTableProps<T>) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState<Set<string | number>>(new Set());
  const selectable = !!rowKey && !!bulkActions && bulkActions.length > 0;
  const keys = selectable ? data.map((r) => rowKey!(r)) : [];
  const allSelected = selectable && keys.length > 0 && keys.every((k) => selected.has(k));
  const selectedRows = selectable ? data.filter((r) => selected.has(rowKey!(r))) : [];
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(keys));
  const toggleOne = (k: string | number) => setSelected((prev) => { const next = new Set(prev); if (next.has(k)) next.delete(k); else next.add(k); return next; });
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T | null;
    order: 'asc' | 'desc';
  }>({ key: null, order: 'asc' });

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    onSearch?.(term);
  };

  const handleSort = (key: keyof T) => {
    if (!sortable) return;

    const newOrder =
      sortConfig.key === key && sortConfig.order === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key, order: newOrder });
    onSort?.(key, newOrder);
  };

  const getSortIcon = (columnKey: keyof T | string) => {
    if (sortConfig.key !== columnKey) {
      return <ChevronsUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortConfig.order === 'asc' ? (
      <ChevronUp className="w-4 h-4 text-blue-600" />
    ) : (
      <ChevronDown className="w-4 h-4 text-blue-600" />
    );
  };

  if (error) {
    return <ErrorState message={error} retry={onRetry} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        {searchable && (
          <div className="flex-1 max-w-md">
            {searchOptions ? (
              <Autocomplete
                options={searchOptions}
                value={searchTerm}
                onChange={(val) => handleSearch(val)}
                placeholder={searchPlaceholder}
                onSearch={(q) => handleSearch(q)}
                clearable
              />
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>
        )}

        {actions?.add && (
          <button
            onClick={actions.add.onClick}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {actions.add.label}
          </button>
        )}
      </div>

      {selectable && selectedRows.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-4 py-2 text-sm">
          <span className="font-medium text-blue-800 dark:text-blue-200">{selectedRows.length} selected</span>
          {bulkActions!.map((action) => {
            const Icon = action.icon;
            const cls = action.variant === 'danger' ? 'text-red-700 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300' : action.variant === 'primary' ? 'text-white bg-blue-600 hover:bg-blue-700' : 'text-gray-700 bg-white hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600';
            return (
              <button key={action.label} type="button" onClick={() => void Promise.resolve(action.onClick(selectedRows)).then(() => setSelected(new Set()))} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${cls}`}>
                {Icon && <Icon className="w-3.5 h-3.5" />}{action.label}
              </button>
            );
          })}
          <button type="button" onClick={() => setSelected(new Set())} className="ml-auto text-xs text-blue-700 dark:text-blue-300 hover:underline">{t('table.clear')}</button>
        </div>
      )}

      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                {selectable && (
                  <th className="px-4 py-3 w-10">
                    <input type="checkbox" aria-label={t('table.selectAllRows')} checked={allSelected} onChange={toggleAll} className="rounded border-gray-300 dark:border-gray-600" />
                  </th>
                )}
                {columns.map((column) => (
                  <th
                    key={String(column.key)}
                    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${
                      column.sortable !== false && sortable
                        ? 'cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700'
                        : ''
                    }`}
                    style={{ width: column.width }}
                    onClick={() =>
                      column.sortable !== false && sortable && handleSort(column.key as keyof T)
                    }
                  >
                    <div className="flex items-center gap-2">
                      {column.label}
                      {column.sortable !== false && sortable && getSortIcon(column.key)}
                    </div>
                  </th>
                ))}
                {rowActions && rowActions.length > 0 && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('common.actions')}
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={columns.length + (rowActions && rowActions.length > 0 ? 1 : 0)}>
                    <Loader />
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (rowActions && rowActions.length > 0 ? 1 : 0)}>
                    <EmptyState
                      title={emptyState?.title || 'No data found'}
                      description={emptyState?.description}
                    />
                  </td>
                </tr>
              ) : (
                data.map((row, rowIndex) => (
                  <tr
                    key={rowKey ? String(rowKey(row)) : rowIndex}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${selectable && selected.has(rowKey!(row)) ? 'bg-blue-50/60 dark:bg-blue-900/10' : ''}`}
                  >
                    {selectable && (
                      <td className="px-4 py-4 w-10">
                        <input type="checkbox" aria-label={t('table.selectRow')} checked={selected.has(rowKey!(row))} onChange={() => toggleOne(rowKey!(row))} className="rounded border-gray-300 dark:border-gray-600" />
                      </td>
                    )}
                    {columns.map((column) => (
                      <td
                        key={String(column.key)}
                        className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100"
                      >
                        {column.render
                          ? column.render(row[column.key as keyof T], row)
                          : String(row[column.key as keyof T] || '')}
                      </td>
                    ))}
                    {rowActions && rowActions.length > 0 && (
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          {rowActions
                            .filter((action) => !action.show || action.show(row))
                            .map((action, idx) => {
                              const Icon = action.icon;
                              const variantStyles = {
                                primary: 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20',
                                secondary: 'text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800',
                                danger: 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20',
                                success: 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20',
                                warning: 'text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20',
                              };
                              return (
                                <button
                                  key={idx}
                                  onClick={() => action.onClick(row)}
                                  className={`p-2 rounded transition-colors ${
                                    variantStyles[action.variant || 'secondary']
                                  }`}
                                  title={action.label}
                                  aria-label={action.label}
                                >
                                  <Icon className="w-4 h-4" aria-hidden />
                                </button>
                              );
                            })}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pagination && data.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700 dark:text-gray-300">{t('table.rowsPerPage')}</span>
            <select
              value={pagination.pageSize}
              onChange={(e) => pagination.onPageSizeChange(Number(e.target.value))}
              className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Page {pagination.currentPage} of {pagination.totalPages} ({pagination.total} total)
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {t('common.previous')}
              </button>
              <button
                onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {t('common.next')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
