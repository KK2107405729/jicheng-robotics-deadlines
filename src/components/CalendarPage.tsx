import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { ArrowLeft, ArrowRight, CalendarDays, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import type { Conference } from '../types';
import { CATEGORY_MAP } from '../data/conferences';
import {
  addMonths,
  formatConferenceRange,
  formatMonthDay,
  getMonthCells,
  getMonthLabel,
  getShortMonth,
  isSubmission,
  todayISO,
} from '../lib/date';

interface CalendarPageProps {
  conferences: Conference[];
  onOpen: (conference: Conference) => void;
}

type CalendarItem =
  | { id: string; date: string; type: 'deadline'; conference: Conference; label: string; confidence: 'confirmed' | 'estimated'; kind: string }
  | { id: string; date: string; type: 'conference'; conference: Conference; label: string };

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'];

function buildCalendarItems(conferences: Conference[], showEstimated: boolean): CalendarItem[] {
  const items: CalendarItem[] = [];
  for (const conference of conferences) {
    for (const deadline of conference.deadlines) {
      if (!isSubmission(deadline)) continue;
      if (!showEstimated && deadline.confidence === 'estimated') continue;
      items.push({
        id: `${conference.id}-${deadline.kind}-${deadline.date}`,
        date: deadline.date,
        type: 'deadline',
        conference,
        label: deadline.label,
        confidence: deadline.confidence,
        kind: deadline.kind,
      });
    }
    if (conference.startDate) {
      items.push({
        id: `${conference.id}-conference`,
        date: conference.startDate,
        type: 'conference',
        conference,
        label: '会议开幕',
      });
    }
  }
  return items.sort((a, b) => a.date.localeCompare(b.date));
}

export function CalendarPage({ conferences, onOpen }: CalendarPageProps) {
  const today = todayISO();
  const initial = useMemo(() => {
    const [year, month] = today.split('-').map(Number);
    return { year, month: month - 1 };
  }, [today]);
  const [cursor, setCursor] = useState(initial);
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [showEstimated, setShowEstimated] = useState(true);
  const [showConferences, setShowConferences] = useState(true);

  const allItems = useMemo(
    () => buildCalendarItems(conferences, showEstimated),
    [conferences, showEstimated],
  );
  const visibleItems = useMemo(
    () => (showConferences ? allItems : allItems.filter((item) => item.type === 'deadline')),
    [allItems, showConferences],
  );
  const itemsByDate = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    for (const item of visibleItems) {
      const list = map.get(item.date) ?? [];
      list.push(item);
      map.set(item.date, list);
    }
    return map;
  }, [visibleItems]);

  const cells = useMemo(() => getMonthCells(cursor.year, cursor.month), [cursor]);
  const monthItems = useMemo(
    () =>
      visibleItems.filter((item) => {
        const [year, month] = item.date.split('-').map(Number);
        return year === cursor.year && month === cursor.month + 1;
      }),
    [visibleItems, cursor],
  );
  const monthDeadlines = monthItems.filter((item) => item.type === 'deadline');
  const monthConferences = monthItems.filter((item) => item.type === 'conference');
  const selectedItems = itemsByDate.get(selectedDate) ?? [];
  const selectedDayLabel = selectedDate
    ? `${Number(selectedDate.slice(5, 7))} 月 ${Number(selectedDate.slice(8, 10))} 日`
    : '';

  const changeMonth = (delta: number) => {
    const next = addMonths(cursor.year, cursor.month, delta);
    setCursor(next);
    setSelectedDate(`${next.year}-${String(next.month + 1).padStart(2, '0')}-01`);
  };

  const goToday = () => {
    setCursor(initial);
    setSelectedDate(today);
  };

  const groupedMonth = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    for (const item of monthItems) {
      const list = map.get(item.date) ?? [];
      list.push(item);
      map.set(item.date, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [monthItems]);

  return (
    <div className="calendar-page">
      <header className="page-hero page-hero--calendar">
        <div className="page-hero-copy">
          <div className="section-kicker">
            <span className="kicker-square" />
            DEADLINE CALENDAR / 截稿日历
          </div>
          <h1>
            把 deadline，
            <br />
            放进月份里。
          </h1>
          <p>
            以月为单位查看投稿节点与会议开幕。预测日期使用虚线标记，导出前请回到官网复核。
          </p>
        </div>
        <div className="calendar-summary">
          <span className="calendar-summary-label">THIS MONTH</span>
          <strong>{String(monthDeadlines.length).padStart(2, '0')}</strong>
          <span>个投稿节点</span>
          <span className="calendar-summary-sub">{monthConferences.length} 场会议开幕</span>
          <button className="text-button" onClick={goToday}>
            <CalendarDays size={14} />
            回到今天
          </button>
        </div>
      </header>

      <div className="calendar-layout">
        <section className="calendar-main">
          <div className="calendar-toolbar">
            <div className="month-switcher">
              <button className="round-button" onClick={() => changeMonth(-1)} aria-label="上个月">
                <ChevronLeft size={17} />
              </button>
              <div>
                <h2>{getMonthLabel(cursor.year, cursor.month)}</h2>
                <span>{getShortMonth(cursor.year, cursor.month)}</span>
              </div>
              <button className="round-button" onClick={() => changeMonth(1)} aria-label="下个月">
                <ChevronRight size={17} />
              </button>
            </div>
            <div className="calendar-controls">
              <button
                className={`toggle-chip ${showEstimated ? 'is-active' : ''}`}
                onClick={() => setShowEstimated((value) => !value)}
                aria-pressed={showEstimated}
              >
                <span className="legend-dot legend-dot--estimated" />
                预测节点
              </button>
              <button
                className={`toggle-chip ${showConferences ? 'is-active' : ''}`}
                onClick={() => setShowConferences((value) => !value)}
                aria-pressed={showConferences}
              >
                <span className="legend-dot legend-dot--conference" />
                会议开幕
              </button>
            </div>
          </div>

          <div className="calendar-weekdays">
            {WEEKDAYS.map((day, index) => (
              <span key={day} className={index >= 5 ? 'is-weekend' : ''}>
                周{day}
              </span>
            ))}
          </div>

          <div className="calendar-grid">
            {cells.map((cell) => {
              const items = itemsByDate.get(cell.date) ?? [];
              const isToday = cell.date === today;
              const isSelected = cell.date === selectedDate;
              return (
                <div
                  key={cell.date}
                  className={`calendar-cell ${cell.inMonth ? '' : 'is-outside'} ${isToday ? 'is-today' : ''} ${
                    isSelected ? 'is-selected' : ''
                  }`}
                  onClick={() => setSelectedDate(cell.date)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelectedDate(cell.date);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`${cell.date}，${items.length} 个节点`}
                >
                  <div className="calendar-day-number">
                    <span>{Number(cell.date.slice(8, 10))}</span>
                    {isToday && <i>今天</i>}
                  </div>
                  <div className="calendar-cell-items">
                    {items.slice(0, 2).map((item) => {
                      const category = CATEGORY_MAP[item.conference.categories[0]];
                      return (
                        <span
                          key={item.id}
                          className={`calendar-chip ${
                            item.type === 'conference'
                              ? 'is-conference'
                              : item.confidence === 'estimated'
                                ? 'is-estimated'
                                : ''
                          }`}
                          style={{ '--event-color': item.type === 'conference' ? '#0d1712' : category.color } as CSSProperties}
                        >
                          <i />
                          <b>{item.conference.series}</b>
                        </span>
                      );
                    })}
                    {items.length > 2 && <span className="calendar-more">+{items.length - 2}</span>}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="calendar-legend">
            <span>
              <i className="legend-dot legend-dot--confirmed" />
              官方核验
            </span>
            <span>
              <i className="legend-dot legend-dot--estimated" />
              预测窗口
            </span>
            <span>
              <i className="legend-dot legend-dot--conference" />
              会议开幕
            </span>
            <span className="calendar-legend-note">所有日期按官网所在时区标注</span>
          </div>
        </section>

        <aside className="calendar-side">
          <div className="calendar-side-head">
            <div>
              <span className="section-kicker">SELECTED / 选中</span>
              <h3>{selectedDayLabel}</h3>
            </div>
            <span className="side-count">{String(selectedItems.length).padStart(2, '0')}</span>
          </div>

          {selectedItems.length > 0 ? (
            <div className="day-events">
              {selectedItems.map((item) => {
                const category = CATEGORY_MAP[item.conference.categories[0]];
                return (
                  <button key={item.id} className="day-event" onClick={() => onOpen(item.conference)}>
                    <span className="day-event-color" style={{ background: category.color }} />
                    <span className="day-event-main">
                      <strong>
                        {item.conference.series} {item.conference.edition}
                      </strong>
                      <span>{item.type === 'conference' ? '会议开幕' : item.label}</span>
                      <small>
                        <MapPin size={11} />
                        {item.conference.location
                          ? `${item.conference.location.city} · ${formatConferenceRange(
                              item.conference.startDate,
                              item.conference.endDate,
                            )}`
                          : '地点待公布'}
                      </small>
                    </span>
                    <ArrowRight size={14} />
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="day-empty">
              <CalendarDays size={22} strokeWidth={1.4} />
              <p>这一天没有投稿节点。</p>
              <span>选择其他日期，或查看本月全部节点。</span>
            </div>
          )}

          <div className="month-list">
            <div className="month-list-head">
              <span>本月全部节点</span>
              <span>{monthItems.length}</span>
            </div>
            {groupedMonth.length === 0 && <p className="month-list-empty">本月暂无节点。</p>}
            {groupedMonth.map(([date, items]) => (
              <div key={date} className="month-list-group">
                <span className="month-list-date">{formatMonthDay(date)}</span>
                <div className="month-list-items">
                  {items.map((item) => (
                    <button key={item.id} onClick={() => onOpen(item.conference)}>
                      <b>{item.conference.series}</b>
                      <span>{item.type === 'conference' ? '开幕' : item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="calendar-nav-foot">
            <button onClick={() => changeMonth(-1)}>
              <ArrowLeft size={13} />
              上一月
            </button>
            <button onClick={() => changeMonth(1)}>
              下一月
              <ArrowRight size={13} />
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
