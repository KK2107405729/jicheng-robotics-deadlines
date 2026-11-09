import { useEffect, useRef } from 'react';
import { Award, ChevronDown, Layers3, Search, ShieldCheck, SlidersHorizontal, Star, X } from 'lucide-react';
import type { CcfRank, Category, CategoryId, PaperTier, SortMode, TimeFilter } from '../types';
import { CCF_EDITION } from '../data/ratings';

interface FilterBarProps {
  query: string;
  categories: Category[];
  activeCategories: CategoryId[];
  timeFilter: TimeFilter;
  sort: SortMode;
  tierFilter: PaperTier | 'all';
  ccfFilter: CcfRank | 'none' | 'all';
  verifiedOnly: boolean;
  favoritesOnly: boolean;
  resultCount: number;
  onQueryChange: (query: string) => void;
  onToggleCategory: (category: CategoryId) => void;
  onClearCategories: () => void;
  onTimeFilterChange: (value: TimeFilter) => void;
  onSortChange: (value: SortMode) => void;
  onTierFilterChange: (value: PaperTier | 'all') => void;
  onCcfFilterChange: (value: CcfRank | 'none' | 'all') => void;
  onVerifiedOnlyChange: (value: boolean) => void;
  onFavoritesOnlyChange: (value: boolean) => void;
  onReset: () => void;
}

const TIME_OPTIONS: { value: TimeFilter; label: string }[] = [
  { value: 'all', label: '全部时间' },
  { value: 'next30', label: '未来 30 天' },
  { value: 'next90', label: '未来 90 天' },
  { value: 'next180', label: '未来 6 个月' },
  { value: 'closed', label: '本轮已截止' },
  { value: 'tba', label: '日期待公布' },
];

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: 'deadline', label: '按截稿日' },
  { value: 'conference', label: '按会议日期' },
  { value: 'name', label: '按名称' },
];

export function FilterBar({
  query,
  categories,
  activeCategories,
  timeFilter,
  sort,
  tierFilter,
  ccfFilter,
  verifiedOnly,
  favoritesOnly,
  resultCount,
  onQueryChange,
  onToggleCategory,
  onClearCategories,
  onTimeFilterChange,
  onSortChange,
  onTierFilterChange,
  onCcfFilterChange,
  onVerifiedOnlyChange,
  onFavoritesOnlyChange,
  onReset,
}: FilterBarProps) {
  const searchRef = useRef<HTMLInputElement>(null);
  const hasFilters =
    query.length > 0 ||
    activeCategories.length > 0 ||
    timeFilter !== 'all' ||
    tierFilter !== 'all' ||
    ccfFilter !== 'all' ||
    verifiedOnly ||
    favoritesOnly;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.tagName === 'SELECT';
      if (event.key === '/' && !typing) {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key === 'Escape' && document.activeElement === searchRef.current) {
        onQueryChange('');
        searchRef.current?.blur();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onQueryChange]);

  return (
    <div className="filter-panel">
      <div className="filter-toolbar">
        <label className="search-box">
          <Search size={17} strokeWidth={1.8} />
          <input
            ref={searchRef}
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="搜索会议、城市或关键词…"
            aria-label="搜索会议"
          />
          {query ? (
            <button className="search-clear" onClick={() => onQueryChange('')} aria-label="清除搜索">
              <X size={14} />
            </button>
          ) : (
            <kbd>/</kbd>
          )}
        </label>

        <div className="filter-selects">
          <label className="select-wrap">
            <SlidersHorizontal size={14} />
            <select
              value={timeFilter}
              onChange={(event) => onTimeFilterChange(event.target.value as TimeFilter)}
              aria-label="按截稿时间过滤"
            >
              {TIME_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown size={13} className="select-chevron" />
          </label>

          <label className="select-wrap select-wrap--sort">
            <select
              value={sort}
              onChange={(event) => onSortChange(event.target.value as SortMode)}
              aria-label="排序方式"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown size={13} className="select-chevron" />
          </label>

          <button
            className={`toggle-chip ${verifiedOnly ? 'is-active' : ''}`}
            onClick={() => onVerifiedOnlyChange(!verifiedOnly)}
            aria-pressed={verifiedOnly}
          >
            <ShieldCheck size={14} />
            仅官方
          </button>
          <button
            className={`toggle-chip ${favoritesOnly ? 'is-active' : ''}`}
            onClick={() => onFavoritesOnlyChange(!favoritesOnly)}
            aria-pressed={favoritesOnly}
          >
            <Star size={14} fill={favoritesOnly ? 'currentColor' : 'none'} />
            关注
          </button>
        </div>
      </div>

      <div className="rating-filter-row">
        <span className="rating-filter-title">
          <Award size={13} />
          评级筛选
        </span>
        <label className="select-wrap select-wrap--rating">
          <span className="rating-select-label">CCF</span>
          <select
            value={ccfFilter}
            onChange={(event) => onCcfFilterChange(event.target.value as CcfRank | 'none' | 'all')}
            aria-label="按 CCF 评级过滤"
          >
            <option value="all">全部</option>
            <option value="A">A 类</option>
            <option value="B">B 类</option>
            <option value="C">C 类</option>
            <option value="none">未列入</option>
          </select>
          <ChevronDown size={13} className="select-chevron" />
        </label>
        <span className="ccf-edition-note">CCF {CCF_EDITION}</span>
        <label className="select-wrap select-wrap--rating">
          <Layers3 size={13} />
          <select
            value={tierFilter}
            onChange={(event) => onTierFilterChange(event.target.value as PaperTier | 'all')}
            aria-label="按机程论文梯队过滤"
          >
            <option value="all">全部梯队</option>
            <option value="flagship">旗舰级</option>
            <option value="first">第一梯队</option>
            <option value="second">第二梯队</option>
            <option value="special">专题级</option>
          </select>
          <ChevronDown size={13} className="select-chevron" />
        </label>
        <span className="rating-filter-note">机程梯队为非官方编辑判断</span>
      </div>

      <div className="filter-bottom">
        <div className="category-chips" role="group" aria-label="按研究方向过滤">
          <button
            className={`category-chip ${activeCategories.length === 0 ? 'is-active' : ''}`}
            onClick={onClearCategories}
          >
            全部方向
          </button>
          {categories.map((category) => {
            const active = activeCategories.includes(category.id);
            return (
              <button
                key={category.id}
                className={`category-chip ${active ? 'is-active' : ''}`}
                onClick={() => onToggleCategory(category.id)}
                aria-pressed={active}
                style={active ? { borderColor: category.color } : undefined}
              >
                <span className="chip-dot" style={{ background: category.color }} />
                {category.label}
              </button>
            );
          })}
        </div>
        <div className="filter-result" aria-live="polite">
          <span>
            <strong>{String(resultCount).padStart(2, '0')}</strong> 个结果
          </span>
          {hasFilters && (
            <button className="reset-button" onClick={onReset}>
              重置筛选
              <X size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
