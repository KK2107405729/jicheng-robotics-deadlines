import { CalendarDays, Compass, Library, Radar, Star, Target, X } from 'lucide-react';
import type { Category, CategoryId, View } from '../types';
import { BrandMark } from './BrandMark';
import { DATA_VERSION } from '../data/conferences';
import { nowInShanghai } from '../lib/date';

interface SidebarProps {
  view: View;
  categories: Category[];
  categoryCounts: Record<CategoryId, number>;
  totalConferenceCount: number;
  activeCategories: CategoryId[];
  favoriteCount: number;
  favoritesOnly: boolean;
  mobile?: boolean;
  onClose?: () => void;
  onNavigate: (view: View) => void;
  onToggleCategory: (category: CategoryId) => void;
  onClearCategories: () => void;
  onToggleFavoritesOnly: () => void;
}

const NAV_ITEMS: { view: View; label: string; en: string; icon: typeof Radar; index: string }[] = [
  { view: 'radar', label: '会议雷达', en: 'Radar', icon: Radar, index: '01' },
  { view: 'strategy', label: '投稿策略', en: 'Strategy', icon: Target, index: '02' },
  { view: 'calendar', label: '投稿日历', en: 'Calendar', icon: CalendarDays, index: '03' },
  { view: 'papers', label: '论文索引', en: 'Papers', icon: Library, index: '04' },
  { view: 'about', label: '数据方法', en: 'Notes', icon: Compass, index: '05' },
];

export function Sidebar({
  view,
  categories,
  categoryCounts,
  totalConferenceCount,
  activeCategories,
  favoriteCount,
  favoritesOnly,
  mobile = false,
  onClose,
  onNavigate,
  onToggleCategory,
  onClearCategories,
  onToggleFavoritesOnly,
}: SidebarProps) {
  return (
    <aside className={`sidebar ${mobile ? 'sidebar--mobile' : ''}`} aria-label="主导航">
      <div className="sidebar-top">
        <button className="brand" onClick={() => onNavigate('radar')} aria-label="机程首页">
          <span className="brand-mark">
            <BrandMark size={40} />
          </span>
          <span className="brand-type">
            <strong>机程</strong>
            <span>BOT/CAL</span>
          </span>
        </button>
        {mobile && (
          <button className="icon-button sidebar-close" onClick={onClose} aria-label="关闭菜单">
            <X size={18} />
          </button>
        )}
      </div>

      <div className="sidebar-scroll">
        <div className="sidebar-section-label">
          <span>WORKSPACE</span>
          <span className="micro-line" />
        </div>
        <nav className="primary-nav">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = view === item.view;
            return (
              <button
                key={item.view}
                className={`nav-item ${active ? 'is-active' : ''}`}
                onClick={() => onNavigate(item.view)}
                aria-current={active ? 'page' : undefined}
              >
                <span className="nav-icon">
                  <Icon size={16} strokeWidth={1.7} />
                </span>
                <span className="nav-copy">
                  <strong>{item.label}</strong>
                  <small>{item.en}</small>
                </span>
                <span className="nav-index">{item.index}</span>
              </button>
            );
          })}
        </nav>

        <button
          className={`watch-button ${favoritesOnly ? 'is-active' : ''}`}
          onClick={onToggleFavoritesOnly}
          aria-pressed={favoritesOnly}
        >
          <Star size={15} fill={favoritesOnly ? 'currentColor' : 'none'} />
          <span>我的关注</span>
          <span className="watch-count">{String(favoriteCount).padStart(2, '0')}</span>
        </button>

        <div className="sidebar-section-label category-label">
          <span>RESEARCH FIELDS</span>
          <span className="micro-line" />
        </div>
        <div className="category-nav">
          <button
            className={`category-nav-item ${activeCategories.length === 0 ? 'is-active' : ''}`}
            onClick={onClearCategories}
          >
            <span className="category-all-dot" />
            <span>全部方向</span>
            <span className="category-count">{String(totalConferenceCount).padStart(2, '0')}</span>
          </button>
          {categories.map((category) => {
            const active = activeCategories.includes(category.id);
            return (
              <button
                key={category.id}
                className={`category-nav-item ${active ? 'is-active' : ''}`}
                onClick={() => onToggleCategory(category.id)}
                aria-pressed={active}
              >
                <span className="category-dot" style={{ background: category.color }} />
                <span>{category.label}</span>
                <span className="category-count">{String(categoryCounts[category.id] ?? 0).padStart(2, '0')}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="sidebar-footer">
        <div className="sync-line">
          <span className="live-dot" />
          <span>DATA ONLINE</span>
          <span className="sync-time">{nowInShanghai()} CST</span>
        </div>
        <div className="sync-meta">
          <span>SYNC {DATA_VERSION.replaceAll('-', '.')}</span>
          <span>ASIA/SHANGHAI</span>
        </div>
        <div className="sidebar-credit">
          <span>为机器人研究者而建</span>
          <span className="credit-rule" />
          <span>v0.1</span>
        </div>
      </div>
    </aside>
  );
}
