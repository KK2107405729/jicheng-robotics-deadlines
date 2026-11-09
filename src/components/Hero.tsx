import { ArrowRight, ArrowUpRight, CalendarPlus, MapPin, ShieldCheck } from 'lucide-react';
import type { Conference, Deadline } from '../types';
import {
  countdownFootnote,
  daysUntilDeadline,
  deadlineTimeNote,
  formatBeijingTime,
  formatMonthDay,
} from '../lib/date';

export interface Signal {
  conference: Conference;
  deadline: Deadline;
}

interface HeroProps {
  next: Signal | null;
  queue: Signal[];
  onOpen: (conference: Conference) => void;
  onExport: () => void;
  onExplore: () => void;
  onStrategy: () => void;
  stats: { conferences: number; series: number; categories: number; confirmed: number };
}

function RadarDial({ days, estimated }: { days: number; estimated: boolean }) {
  const ticks = Array.from({ length: 60 }, (_, index) => index);
  return (
    <div className={`radar-dial ${estimated ? 'is-estimated' : ''}`}>
      <div className="radar-aura" />
      <div className="radar-sweep" />
      <svg className="radar-svg" viewBox="0 0 240 240" aria-hidden="true">
        <circle cx="120" cy="120" r="108" className="radar-ring radar-ring--outer" />
        <circle cx="120" cy="120" r="80" className="radar-ring" />
        <circle cx="120" cy="120" r="52" className="radar-ring" />
        <circle cx="120" cy="120" r="24" className="radar-ring radar-ring--inner" />
        <path d="M120 8v16M120 216v16M8 120h16M216 120h16" className="radar-cross" />
        <path d="M120 12v216M12 120h216" className="radar-axis" />
        {ticks.map((tick) => {
          const major = tick % 5 === 0;
          return (
            <line
              key={tick}
              x1="120"
              y1={major ? 14 : 17}
              x2="120"
              y2="22"
              className={major ? 'radar-tick radar-tick--major' : 'radar-tick'}
              transform={`rotate(${tick * 6} 120 120)`}
            />
          );
        })}
        <circle cx="160" cy="82" r="3.2" className="radar-blip radar-blip--one" />
        <circle cx="76" cy="150" r="2.4" className="radar-blip radar-blip--two" />
        <circle cx="148" cy="172" r="2" className="radar-blip radar-blip--three" />
      </svg>
      <div className="radar-core">
        {days > 0 ? <strong>{String(days).padStart(2, '0')}</strong> : <strong className="radar-today">TODAY</strong>}
        <span>{days > 0 ? 'DAYS' : 'DEADLINE'}</span>
      </div>
    </div>
  );
}

export function Hero({ next, queue, onOpen, onExport, onExplore, onStrategy, stats }: HeroProps) {
  const days = next ? Math.max(0, daysUntilDeadline(next.deadline)) : 0;
  const beijingTime = next ? formatBeijingTime(next.deadline) : null;
  const deadlineMonth = next
    ? new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'Asia/Shanghai' })
        .format(new Date(`${next.deadline.date}T12:00:00+08:00`))
        .toUpperCase()
    : 'TBA';
  const queueItems = queue.slice(0, 3);

  return (
    <section className="hero" id="top">
      <div className="hero-copy">
        <div className="eyebrow">
          <span className="eyebrow-dot" />
          <span>ROBOTICS CONFERENCE INTELLIGENCE</span>
          <span className="eyebrow-rule" />
          <span>2027 / 2028</span>
        </div>
        <h1>
          把下一个截稿日，
          <br />
          <em>变成坐标。</em>
        </h1>
        <p className="hero-lead">
          从 ICRA、IROS 到 RSS、CoRL，一张为机器人研究者准备的投稿时间地图。
          官方日期、预测窗口、投稿入口与论文索引，都在这里。
        </p>
        <div className="hero-actions">
          <button className="button button--primary" onClick={onExplore}>
            开始扫描
            <ArrowRight size={16} />
          </button>
          <button className="button button--ghost" onClick={onExport}>
            <CalendarPlus size={16} />
            导出日历
          </button>
        </div>
        <div className="hero-ledger">
          <div>
            <strong>{stats.conferences}</strong>
            <span>场会议</span>
          </div>
          <div>
            <strong>{stats.series}</strong>
            <span>个系列</span>
          </div>
          <div>
            <strong>{stats.categories}</strong>
            <span>个方向</span>
          </div>
          <div>
            <strong>{stats.confirmed}</strong>
            <span>个官方节点</span>
          </div>
        </div>
        <p className="hero-verdict">
          <ShieldCheck size={14} />
          官方日期与预测窗口分开标注，不把猜测写成事实。
          <button className="hero-strategy-link" onClick={onStrategy}>
            CCF 与梯队怎么看
            <ArrowRight size={12} />
          </button>
        </p>
      </div>

      <div className="hero-signal">
        <div className="signal-card">
          <div className="signal-topline">
            <span className="signal-label">
              <span className="live-dot" />
              NEXT SIGNAL
            </span>
            {next ? (
              <span className={`status-tag ${next.deadline.confidence === 'confirmed' ? 'status-tag--confirmed' : 'status-tag--estimated'}`}>
                {next.deadline.confidence === 'confirmed' ? '已核验' : '预测窗口'}
              </span>
            ) : (
              <span className="status-tag">待更新</span>
            )}
          </div>

          {next ? (
            <>
              <div className="signal-venue">
                <div>
                  <span className="signal-edition">{next.conference.edition} / EDITION</span>
                  <h2>{next.conference.series}</h2>
                  <p>{next.conference.chineseName}</p>
                </div>
                <div className="signal-location">
                  <MapPin size={13} />
                  <span>
                    {next.conference.location
                      ? `${next.conference.location.city}, ${next.conference.location.countryCn}`
                      : '地点待公布'}
                  </span>
                </div>
              </div>

              <div className="signal-visual">
                <RadarDial days={days} estimated={next.deadline.confidence === 'estimated'} />
                <div className="signal-date">
                  <span className="signal-month">{deadlineMonth}</span>
                  <strong>{formatMonthDay(next.deadline.date).split('.')[1]}</strong>
                  <span className="signal-year">{next.deadline.date.slice(0, 4)}</span>
                  <span className="signal-time">{deadlineTimeNote(next.deadline)}</span>
                </div>
              </div>

              <div className="signal-deadline-copy">
                <span className="signal-kind">{next.deadline.label}</span>
                <p>{next.deadline.note ?? '按官方公布日期记录。'}</p>
              </div>

              <div className="signal-bottom">
                <div className="signal-facts">
                  <span>{countdownFootnote(next.deadline)}</span>
                  {beijingTime && <span>北京时间 {beijingTime}</span>}
                </div>
                <button className="signal-open" onClick={() => onOpen(next.conference)}>
                  查看节点
                  <ArrowUpRight size={14} />
                </button>
              </div>
            </>
          ) : (
            <div className="signal-empty">
              <RadarDial days={0} estimated={false} />
              <p>当前没有可展示的投稿节点。</p>
            </div>
          )}
        </div>

        <div className="signal-queue">
          <div className="queue-heading">
            <span>接下来的节点</span>
            <span>UP NEXT</span>
          </div>
          {queueItems.length === 0 && <p className="queue-empty">暂无更多节点</p>}
          {queueItems.map((item, index) => (
            <button key={`${item.conference.id}-${item.deadline.kind}`} className="queue-row" onClick={() => onOpen(item.conference)}>
              <span className="queue-index">{String(index + 2).padStart(2, '0')}</span>
              <span className="queue-main">
                <strong>{item.conference.series}</strong>
                <small>{item.deadline.label}</small>
              </span>
              <span className="queue-date">{formatMonthDay(item.deadline.date)}</span>
              <ArrowUpRight size={13} />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
