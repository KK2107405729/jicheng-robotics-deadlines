import { ArrowDown, RotateCcw, ScanSearch } from 'lucide-react';
import type { CcfRank, Category, CategoryId, Conference, PaperTier, SortMode, TimeFilter } from '../types';
import type { Signal } from './Hero';
import { Hero } from './Hero';
import { DeadlineRail } from './DeadlineRail';
import { FilterBar } from './FilterBar';
import { ConferenceCard } from './ConferenceCard';

interface RadarPageProps {
  nextSignal: Signal | null;
  queue: Signal[];
  railSignals: Signal[];
  stats: { conferences: number; series: number; categories: number; confirmed: number };
  results: Conference[];
  categories: Category[];
  activeCategories: CategoryId[];
  query: string;
  timeFilter: TimeFilter;
  sort: SortMode;
  tierFilter: PaperTier | 'all';
  ccfFilter: CcfRank | 'none' | 'all';
  verifiedOnly: boolean;
  favoritesOnly: boolean;
  favorites: string[];
  now: Date;
  onOpen: (conference: Conference) => void;
  onToggleFavorite: (id: string) => void;
  onCalendar: (conference: Conference) => void;
  onExport: () => void;
  onStrategy: () => void;
  onQueryChange: (value: string) => void;
  onToggleCategory: (id: CategoryId) => void;
  onClearCategories: () => void;
  onTimeFilterChange: (value: TimeFilter) => void;
  onSortChange: (value: SortMode) => void;
  onTierFilterChange: (value: PaperTier | 'all') => void;
  onCcfFilterChange: (value: CcfRank | 'none' | 'all') => void;
  onVerifiedOnlyChange: (value: boolean) => void;
  onFavoritesOnlyChange: (value: boolean) => void;
  onResetFilters: () => void;
}

export function RadarPage({
  nextSignal,
  queue,
  railSignals,
  stats,
  results,
  categories,
  activeCategories,
  query,
  timeFilter,
  sort,
  tierFilter,
  ccfFilter,
  verifiedOnly,
  favoritesOnly,
  favorites,
  now,
  onOpen,
  onToggleFavorite,
  onCalendar,
  onExport,
  onStrategy,
  onQueryChange,
  onToggleCategory,
  onClearCategories,
  onTimeFilterChange,
  onSortChange,
  onTierFilterChange,
  onCcfFilterChange,
  onVerifiedOnlyChange,
  onFavoritesOnlyChange,
  onResetFilters,
}: RadarPageProps) {
  const scrollToIndex = () => {
    document.getElementById('conference-index')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <Hero
        next={nextSignal}
        queue={queue}
        onOpen={onOpen}
        onExport={onExport}
        onExplore={scrollToIndex}
        onStrategy={onStrategy}
        stats={stats}
      />

      <DeadlineRail
        signals={railSignals}
        onOpen={(signal) => onOpen(signal.conference)}
        onShowAll={scrollToIndex}
      />

      <section className="conference-section" id="conference-index">
        <div className="section-head">
          <div>
            <div className="section-kicker">
              <span className="kicker-square" />
              CONFERENCE INDEX / 2027—2028
            </div>
            <h2>会议信号库</h2>
            <p>按研究方向、截稿窗口与核验状态筛选。点击卡片查看完整节点与论文入口。</p>
          </div>
          <div className="section-head-right">
            <span className="section-count">{String(results.length).padStart(2, '0')}</span>
            <span className="section-count-label">VISIBLE SIGNALS</span>
          </div>
        </div>

        <FilterBar
          query={query}
          categories={categories}
          activeCategories={activeCategories}
          timeFilter={timeFilter}
          sort={sort}
          tierFilter={tierFilter}
          ccfFilter={ccfFilter}
          verifiedOnly={verifiedOnly}
          favoritesOnly={favoritesOnly}
          resultCount={results.length}
          onQueryChange={onQueryChange}
          onToggleCategory={onToggleCategory}
          onClearCategories={onClearCategories}
          onTimeFilterChange={onTimeFilterChange}
          onSortChange={onSortChange}
          onTierFilterChange={onTierFilterChange}
          onCcfFilterChange={onCcfFilterChange}
          onVerifiedOnlyChange={onVerifiedOnlyChange}
          onFavoritesOnlyChange={onFavoritesOnlyChange}
          onReset={onResetFilters}
        />

        {results.length > 0 ? (
          <div className="conference-grid">
            {results.map((conference, index) => (
              <ConferenceCard
                key={conference.id}
                conference={conference}
                now={now}
                isFavorite={favorites.includes(conference.id)}
                index={index}
                onOpen={onOpen}
                onToggleFavorite={onToggleFavorite}
                onCalendar={onCalendar}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-radar">
              <ScanSearch size={34} strokeWidth={1.3} />
              <span className="empty-ring empty-ring--one" />
              <span className="empty-ring empty-ring--two" />
            </div>
            <h3>没有捕获到匹配的信号</h3>
            <p>试试清除搜索、切换研究方向，或关闭“仅官方”过滤。</p>
            <button className="button button--primary button--small" onClick={onResetFilters}>
              <RotateCcw size={14} />
              重置筛选
            </button>
          </div>
        )}

        {results.length > 0 && (
          <div className="index-footer">
            <span>
              <ArrowDown size={14} />
              已显示 {results.length} 场会议
            </span>
            <span>DATA SYNC 2026.11.10 / ASIA-SHANGHAI</span>
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>回到顶部 ↑</button>
          </div>
        )}
      </section>
    </>
  );
}
