import { useEffect, useMemo, useState } from 'react';
import type { CcfRank, CategoryId, Conference, PaperTier, SortMode, TimeFilter, View } from './types';
import { CATEGORIES, CONFERENCES, CONFERENCE_MAP } from './data/conferences';
import {
  daysUntilDeadline,
  getNextSubmission,
  isDeadlinePassed,
  isSubmission,
  sortConferencesForDeadline,
} from './lib/date';
import {
  downloadCSV,
  downloadCalendar,
  downloadJSON,
} from './lib/links';
import { useBodyScrollLock, useLocalStorage, useNow } from './hooks/useAppHooks';
import { getRating } from './data/ratings';
import { Sidebar } from './components/Sidebar';
import { MobileHeader } from './components/MobileHeader';
import { RadarPage } from './components/RadarPage';
import { CalendarPage } from './components/CalendarPage';
import { StrategyPage } from './components/StrategyPage';
import { PapersPage } from './components/PapersPage';
import { AboutPage } from './components/AboutPage';
import { DetailDrawer } from './components/DetailDrawer';
import type { Signal } from './components/Hero';

const FAVORITES_KEY = 'jicheng:favorites';

export default function App() {
  const now = useNow(30_000);
  const [view, setView] = useState<View>('radar');
  const [query, setQuery] = useState('');
  const [activeCategories, setActiveCategories] = useState<CategoryId[]>([]);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [sort, setSort] = useState<SortMode>('deadline');
  const [tierFilter, setTierFilter] = useState<PaperTier | 'all'>('all');
  const [ccfFilter, setCcfFilter] = useState<CcfRank | 'none' | 'all'>('all');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useLocalStorage<string[]>(FAVORITES_KEY, []);
  const [mobileNav, setMobileNav] = useState(false);
  const [selected, setSelected] = useState<Conference | null>(null);
  const [toast, setToast] = useState('');
  useBodyScrollLock(mobileNav);

  useEffect(() => {
    const match = window.location.hash.match(/^#\/c\/(.+)$/);
    if (match && CONFERENCE_MAP[match[1]]) {
      setSelected(CONFERENCE_MAP[match[1]]);
    }
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const seriesCount = useMemo(() => new Set(CONFERENCES.map((conference) => conference.series)).size, []);

  const categoryCounts = useMemo(
    () =>
      Object.fromEntries(
        CATEGORIES.map((category) => [
          category.id,
          CONFERENCES.filter((conference) => conference.categories.includes(category.id)).length,
        ]),
      ) as Record<CategoryId, number>,
    [],
  );

  const resultConferences = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    let results = CONFERENCES.filter((conference) => {
      if (activeCategories.length > 0 && !activeCategories.some((id) => conference.categories.includes(id))) {
        return false;
      }
      if (favoritesOnly && !favorites.includes(conference.id)) return false;
      const rating = getRating(conference.series);
      if (tierFilter !== 'all' && rating.tier !== tierFilter) return false;
      if (ccfFilter !== 'all') {
        if (ccfFilter === 'none' && rating.ccf) return false;
        if (ccfFilter !== 'none' && rating.ccf !== ccfFilter) return false;
      }
      if (normalized) {
        const haystack = [
          conference.series,
          `${conference.series} ${conference.edition}`,
          String(conference.edition),
          conference.fullName,
          conference.chineseName,
          conference.location?.city ?? '',
          conference.location?.countryCn ?? '',
          ...conference.tags,
          ...conference.categories.map((id) => CATEGORIES.find((category) => category.id === id)?.label ?? ''),
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(normalized)) return false;
      }

      const next = getNextSubmission(conference, now);
      if (verifiedOnly && (!next || next.confidence !== 'confirmed')) return false;
      switch (timeFilter) {
        case 'next30':
          return Boolean(next && daysUntilDeadline(next) <= 30);
        case 'next90':
          return Boolean(next && daysUntilDeadline(next) <= 90);
        case 'next180':
          return Boolean(next && daysUntilDeadline(next) <= 180);
        case 'closed':
          return Boolean(!next && conference.deadlines.some(isSubmission));
        case 'tba':
          return conference.dateStatus !== 'confirmed';
        case 'all':
        default:
          return true;
      }
    });

    if (sort === 'name') {
      results = [...results].sort((a, b) => a.series.localeCompare(b.series));
    } else if (sort === 'conference') {
      results = [...results].sort((a, b) => {
        if (a.startDate && b.startDate) return a.startDate.localeCompare(b.startDate);
        if (a.startDate) return -1;
        if (b.startDate) return 1;
        return a.series.localeCompare(b.series);
      });
    } else {
      results = sortConferencesForDeadline(results);
    }
    return results;
  }, [activeCategories, ccfFilter, favorites, favoritesOnly, now, query, sort, tierFilter, timeFilter, verifiedOnly]);

  const signals = useMemo(() => {
    return CONFERENCES.map((conference) => {
      const deadline = getNextSubmission(conference, now);
      return deadline ? { conference, deadline } : null;
    })
      .filter((signal): signal is Signal => Boolean(signal))
      .sort((a, b) => {
        const dateCompare = a.deadline.date.localeCompare(b.deadline.date);
        if (dateCompare !== 0) return dateCompare;
        if (a.deadline.confidence === b.deadline.confidence) return 0;
        return a.deadline.confidence === 'confirmed' ? -1 : 1;
      });
  }, [now]);

  const nextSignal = useMemo(() => {
    return signals.find((signal) => signal.deadline.confidence === 'confirmed') ?? signals[0] ?? null;
  }, [signals]);

  const queue = useMemo(
    () => signals.filter((signal) => signal.conference.id !== nextSignal?.conference.id).slice(0, 3),
    [signals, nextSignal],
  );

  const confirmedNodeCount = useMemo(
    () =>
      CONFERENCES.flatMap((conference) => conference.deadlines).filter(
        (deadline) => deadline.confidence === 'confirmed' && !isDeadlinePassed(deadline, now),
      ).length,
    [now],
  );

  const stats = {
    conferences: CONFERENCES.length,
    series: seriesCount,
    categories: CATEGORIES.length,
    confirmed: confirmedNodeCount,
  };

  const scrollToIndex = () => {
    window.setTimeout(() => {
      document.getElementById('conference-index')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const navigate = (nextView: View) => {
    setView(nextView);
    setMobileNav(false);
    setSelected(null);
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openConference = (conference: Conference) => {
    setSelected(conference);
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#/c/${conference.id}`);
  };

  const closeConference = () => {
    setSelected(null);
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  };

  const toggleFavorite = (id: string) => {
    const exists = favorites.includes(id);
    setFavorites(exists ? favorites.filter((item) => item !== id) : [...favorites, id]);
    setToast(exists ? '已移出关注' : '已加入关注');
  };

  const toggleCategory = (id: CategoryId) => {
    setView('radar');
    setActiveCategories((current) =>
      current.includes(id) ? current.filter((categoryId) => categoryId !== id) : [...current, id],
    );
    setMobileNav(false);
    scrollToIndex();
  };

  const clearCategories = () => {
    setView('radar');
    setActiveCategories([]);
    setMobileNav(false);
    scrollToIndex();
  };

  const handleFavoritesOnly = (value: boolean) => {
    setFavoritesOnly(value);
    if (value) {
      setView('radar');
      scrollToIndex();
    }
  };

  const resetFilters = () => {
    setQuery('');
    setActiveCategories([]);
    setTimeFilter('all');
    setTierFilter('all');
    setCcfFilter('all');
    setVerifiedOnly(false);
    setFavoritesOnly(false);
  };

  const exportAllCalendar = () => {
    downloadCalendar(CONFERENCES, 'jicheng-robotics-2027-2028.ics');
    setToast('日历已导出 · 预测节点标记为 TENTATIVE');
  };

  const exportConferenceCalendar = (conference: Conference) => {
    downloadCalendar([conference], `jicheng-${conference.series}-${conference.edition}.ics`);
    setToast(`${conference.series} ${conference.edition} 已加入下载`);
  };

  const copyLink = async (conference: Conference) => {
    const url = `${window.location.origin}${window.location.pathname}#/c/${conference.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setToast('详情链接已复制');
    } catch {
      setToast('复制失败，请从地址栏复制');
    }
  };

  const exportJSON = () => {
    downloadJSON(CONFERENCES);
    setToast('JSON 数据已导出');
  };

  const exportCSV = () => {
    downloadCSV(CONFERENCES);
    setToast('CSV 数据已导出');
  };

  return (
    <div className="app-shell">
      <Sidebar
        view={view}
        categories={CATEGORIES}
        categoryCounts={categoryCounts}
        totalConferenceCount={CONFERENCES.length}
        activeCategories={activeCategories}
        favoriteCount={favorites.length}
        favoritesOnly={favoritesOnly}
        onNavigate={navigate}
        onToggleCategory={toggleCategory}
        onClearCategories={clearCategories}
        onToggleFavoritesOnly={() => handleFavoritesOnly(!favoritesOnly)}
      />

      <MobileHeader view={view} onMenu={() => setMobileNav(true)} onHome={() => navigate('radar')} />

      {mobileNav && (
        <div className="mobile-nav-layer">
          <button className="mobile-nav-scrim" onClick={() => setMobileNav(false)} aria-label="关闭菜单" />
          <Sidebar
            mobile
            view={view}
            categories={CATEGORIES}
            categoryCounts={categoryCounts}
            totalConferenceCount={CONFERENCES.length}
            activeCategories={activeCategories}
            favoriteCount={favorites.length}
            favoritesOnly={favoritesOnly}
            onClose={() => setMobileNav(false)}
            onNavigate={navigate}
            onToggleCategory={toggleCategory}
            onClearCategories={clearCategories}
            onToggleFavoritesOnly={() => handleFavoritesOnly(!favoritesOnly)}
          />
        </div>
      )}

      <main className="app-main">
        {view === 'radar' && (
          <RadarPage
            nextSignal={nextSignal}
            queue={queue}
            railSignals={signals.slice(0, 7)}
            stats={stats}
            results={resultConferences}
            categories={CATEGORIES}
            activeCategories={activeCategories}
            query={query}
            timeFilter={timeFilter}
            sort={sort}
            tierFilter={tierFilter}
            ccfFilter={ccfFilter}
            verifiedOnly={verifiedOnly}
            favoritesOnly={favoritesOnly}
            favorites={favorites}
            now={now}
            onOpen={openConference}
            onToggleFavorite={toggleFavorite}
            onCalendar={exportConferenceCalendar}
            onExport={exportAllCalendar}
            onStrategy={() => navigate('strategy')}
            onQueryChange={setQuery}
            onToggleCategory={toggleCategory}
            onClearCategories={clearCategories}
            onTimeFilterChange={setTimeFilter}
            onSortChange={setSort}
            onTierFilterChange={setTierFilter}
            onCcfFilterChange={setCcfFilter}
            onVerifiedOnlyChange={setVerifiedOnly}
            onFavoritesOnlyChange={handleFavoritesOnly}
            onResetFilters={resetFilters}
          />
        )}
        {view === 'strategy' && <StrategyPage conferences={CONFERENCES} now={now} onOpen={openConference} />}
        {view === 'calendar' && <CalendarPage conferences={CONFERENCES} onOpen={openConference} />}
        {view === 'papers' && (
          <PapersPage conferences={CONFERENCES} categories={CATEGORIES} onOpen={openConference} />
        )}
        {view === 'about' && (
          <AboutPage
            conferences={CONFERENCES}
            seriesCount={seriesCount}
            categoryCounts={categoryCounts}
            onBack={() => navigate('radar')}
            onExportCalendar={exportAllCalendar}
            onExportJSON={exportJSON}
            onExportCSV={exportCSV}
          />
        )}
      </main>

      <DetailDrawer
        conference={selected}
        now={now}
        isFavorite={selected ? favorites.includes(selected.id) : false}
        onClose={closeConference}
        onToggleFavorite={toggleFavorite}
        onCalendar={exportConferenceCalendar}
        onCopyLink={copyLink}
        onOpenConference={openConference}
      />

      {toast && (
        <div className="toast" role="status">
          <span className="toast-dot" />
          {toast}
        </div>
      )}
    </div>
  );
}
