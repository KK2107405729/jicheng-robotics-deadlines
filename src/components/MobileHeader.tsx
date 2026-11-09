import { Menu } from 'lucide-react';
import { BrandMark } from './BrandMark';
import type { View } from '../types';

const TITLES: Record<View, string> = {
  radar: '会议雷达',
  strategy: '投稿策略',
  calendar: '投稿日历',
  papers: '论文索引',
  about: '数据方法',
};

export function MobileHeader({
  view,
  onMenu,
  onHome,
}: {
  view: View;
  onMenu: () => void;
  onHome: () => void;
}) {
  return (
    <header className="mobile-header">
      <button className="brand brand--mobile" onClick={onHome} aria-label="回到会议雷达">
        <span className="brand-mark">
          <BrandMark size={32} />
        </span>
        <span className="brand-type">
          <strong>机程</strong>
          <span>BOT/CAL</span>
        </span>
      </button>
      <span className="mobile-view-label">{TITLES[view]}</span>
      <button className="icon-button menu-button" onClick={onMenu} aria-label="打开菜单">
        <Menu size={20} />
      </button>
    </header>
  );
}
