import { ArrowRight } from 'lucide-react';
import type { Signal } from './Hero';
import { formatMonthDay } from '../lib/date';
import { CATEGORY_MAP } from '../data/conferences';

interface DeadlineRailProps {
  signals: Signal[];
  onOpen: (signal: Signal) => void;
  onShowAll: () => void;
}

export function DeadlineRail({ signals, onOpen, onShowAll }: DeadlineRailProps) {
  return (
    <section className="deadline-rail" aria-label="接下来的截稿节点">
      <div className="rail-heading">
        <div>
          <span className="section-kicker">UPCOMING / 节点</span>
          <h2>接下来的截稿信号</h2>
        </div>
        <button className="text-button" onClick={onShowAll}>
          查看全部会议
          <ArrowRight size={14} />
        </button>
      </div>
      <div className="rail-track">
        {signals.slice(0, 7).map((signal, index) => (
          <button
            key={`${signal.conference.id}-${signal.deadline.kind}`}
            className={`rail-item ${signal.deadline.confidence === 'estimated' ? 'is-estimated' : ''} ${
              index === 0 ? 'is-first' : ''
            }`}
            onClick={() => onOpen(signal)}
          >
            <span className="rail-date">{formatMonthDay(signal.deadline.date)}</span>
            <span className="rail-node">
              <span
                className="rail-dot"
                style={{ background: CATEGORY_MAP[signal.conference.categories[0]]?.color }}
              />
            </span>
            <span className="rail-name">{signal.conference.series}</span>
            <span className="rail-kind">{signal.deadline.label}</span>
            <span className="rail-year">{signal.conference.edition}</span>
          </button>
        ))}
      </div>
      <div className="rail-legend">
        <span>
          <i className="legend-dot legend-dot--confirmed" /> 官方核验
        </span>
        <span>
          <i className="legend-dot legend-dot--estimated" /> 预测窗口
        </span>
        <span className="rail-hint">点击节点进入会议详情</span>
      </div>
    </section>
  );
}
