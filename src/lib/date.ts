import type { Conference, Deadline, MilestoneKind } from '../types';

const DAY_MS = 86_400_000;
export const SHANGHAI_TZ = 'Asia/Shanghai';

// The radar prioritises paper submission windows. Special-session, workshop,
// supplementary and rebuttal dates stay in the detail timeline.
export const SUBMISSION_KINDS: MilestoneKind[] = [
  'abstract',
  'paper',
  'extended-abstract',
  'late-breaking',
];

export const CORE_DEADLINE_KINDS: MilestoneKind[] = [
  'abstract',
  'paper',
  'extended-abstract',
  'late-breaking',
];

export function todayISO(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: SHANGHAI_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function nowInShanghai(): string {
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: SHANGHAI_TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date());
}

export function dateOnlyToUtc(date: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function dateDiffInDays(target: string, from: string): number {
  return Math.round((dateOnlyToUtc(target).getTime() - dateOnlyToUtc(from).getTime()) / DAY_MS);
}

export function deadlineInstant(deadline: Deadline): Date | null {
  if (!deadline.time) return null;
  const offset = deadline.utcOffset ?? '+08:00';
  const parsed = new Date(`${deadline.date}T${deadline.time}:00${offset}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function isDeadlinePassed(deadline: Deadline, now = new Date()): boolean {
  const instant = deadlineInstant(deadline);
  if (instant) return now.getTime() > instant.getTime();
  return deadline.date < todayISO();
}

export function isSubmission(deadline: Deadline): boolean {
  return SUBMISSION_KINDS.includes(deadline.kind);
}

export function isCoreDeadline(deadline: Deadline): boolean {
  return CORE_DEADLINE_KINDS.includes(deadline.kind);
}

export function getUpcomingDeadlines(
  conference: Conference,
  now = new Date(),
  onlySubmissions = true,
): Deadline[] {
  return conference.deadlines
    .filter((deadline) => (!onlySubmissions || isSubmission(deadline)) && !isDeadlinePassed(deadline, now))
    .sort(compareDeadlines);
}

export function getPastDeadlines(
  conference: Conference,
  now = new Date(),
  onlySubmissions = true,
): Deadline[] {
  return conference.deadlines
    .filter((deadline) => (!onlySubmissions || isSubmission(deadline)) && isDeadlinePassed(deadline, now))
    .sort((a, b) => compareDeadlines(b, a));
}

export function getNextSubmission(conference: Conference, now = new Date()): Deadline | null {
  return getUpcomingDeadlines(conference, now, true)[0] ?? null;
}

export function getNextMilestone(conference: Conference, now = new Date()): Deadline | null {
  return getUpcomingDeadlines(conference, now, false)[0] ?? null;
}

export function getLastSubmission(conference: Conference, now = new Date()): Deadline | null {
  return getPastDeadlines(conference, now, true)[0] ?? null;
}

export function compareDeadlines(a: Deadline, b: Deadline): number {
  const dateCompare = a.date.localeCompare(b.date);
  if (dateCompare !== 0) return dateCompare;
  if (!a.time && !b.time) return 0;
  if (!a.time) return 1;
  if (!b.time) return -1;
  return a.time.localeCompare(b.time);
}

export function daysUntilDeadline(deadline: Deadline): number {
  if (deadline.time) {
    const instant = deadlineInstant(deadline);
    if (instant) {
      return Math.ceil((instant.getTime() - Date.now()) / DAY_MS);
    }
  }
  return dateDiffInDays(deadline.date, todayISO());
}

export function countdownLabel(deadline: Deadline): string {
  if (isDeadlinePassed(deadline)) return '已截止';
  const days = daysUntilDeadline(deadline);
  if (days <= 0) return '今天';
  if (days === 1) return '明天';
  return `${days} 天`;
}

export function countdownFootnote(deadline: Deadline): string {
  if (isDeadlinePassed(deadline)) return '本轮已结束';
  const days = daysUntilDeadline(deadline);
  if (days <= 0) return deadline.confidence === 'estimated' ? '预计今天' : '今天截止';
  if (deadline.confidence === 'estimated') return `约 ${days} 天`;
  return `还有 ${days} 天`;
}

export function formatMonthDay(date: string): string {
  const [, month, day] = date.split('-');
  return `${month}.${day}`;
}

export function formatDate(date: string, withYear = true): string {
  const [year, month, day] = date.split('-');
  return withYear ? `${year}.${month}.${day}` : `${month}.${day}`;
}

export function formatChineseDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  return `${year} 年 ${month} 月 ${day} 日`;
}

export function formatConferenceRange(start: string | null, end: string | null): string {
  if (!start) return '会期待公布';
  if (!end || start === end) return formatDate(start);
  const [startYear, startMonth, startDay] = start.split('-');
  const [endYear, endMonth, endDay] = end.split('-');
  if (startYear !== endYear) {
    return `${startYear}.${startMonth}.${startDay}–${endYear}.${endMonth}.${endDay}`;
  }
  if (startMonth !== endMonth) {
    return `${startYear}.${startMonth}.${startDay}–${endMonth}.${endDay}`;
  }
  return `${startYear}.${startMonth}.${startDay}–${endDay}`;
}

export function formatBeijingTime(deadline: Deadline): string | null {
  const instant = deadlineInstant(deadline);
  if (!instant) return null;
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: SHANGHAI_TZ,
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
    .format(instant)
    .replace(/\//g, '.');
}

export function formatDeadlineTime(deadline: Deadline): string {
  const date = deadline.displayDate ?? formatDate(deadline.date);
  if (!deadline.time) return date;
  return `${date} ${deadline.time}`;
}

export function deadlineTimeNote(deadline: Deadline): string {
  if (deadline.confidence === 'estimated') {
    return deadline.time ? `预计 ${deadline.time} · 以官网为准` : '预测窗口 · 以官网为准';
  }
  if (deadline.timezone) return `${deadline.time} ${deadline.timezone}`;
  if (deadline.time) return deadline.time;
  return '日期已核验 · 时刻待定';
}

export function getMonthCells(year: number, monthIndex: number): { date: string; inMonth: boolean }[] {
  const first = new Date(Date.UTC(year, monthIndex, 1));
  const weekday = (first.getUTCDay() + 6) % 7; // Monday-first
  const start = new Date(Date.UTC(year, monthIndex, 1 - weekday));
  return Array.from({ length: 42 }, (_, index) => {
    const current = new Date(start.getTime() + index * DAY_MS);
    return {
      date: `${current.getUTCFullYear()}-${String(current.getUTCMonth() + 1).padStart(2, '0')}-${String(
        current.getUTCDate(),
      ).padStart(2, '0')}`,
      inMonth: current.getUTCMonth() === monthIndex,
    };
  });
}

export function addMonths(year: number, monthIndex: number, delta: number): { year: number; month: number } {
  const date = new Date(Date.UTC(year, monthIndex + delta, 1));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() };
}

export function isSameMonth(date: string, year: number, monthIndex: number): boolean {
  const [y, m] = date.split('-').map(Number);
  return y === year && m === monthIndex + 1;
}

export function getMonthLabel(year: number, monthIndex: number): string {
  return `${year} 年 ${String(monthIndex + 1).padStart(2, '0')} 月`;
}

export function getShortMonth(year: number, monthIndex: number): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(
    new Date(Date.UTC(year, monthIndex, 1)),
  );
}

export function sortConferencesForDeadline<T extends Conference>(items: T[]): T[] {
  const rank = (conference: Conference) => {
    const next = getNextSubmission(conference);
    if (next) return 0;
    const hasPastSubmission = conference.deadlines.some(isSubmission);
    return hasPastSubmission ? 2 : 1;
  };
  return [...items].sort((a, b) => {
    const rankDiff = rank(a) - rank(b);
    if (rankDiff !== 0) return rankDiff;
    const nextA = getNextSubmission(a);
    const nextB = getNextSubmission(b);
    if (nextA && nextB) {
      const diff = compareDeadlines(nextA, nextB);
      if (diff !== 0) return diff;
    }
    if (a.startDate && b.startDate) return a.startDate.localeCompare(b.startDate);
    if (a.startDate) return -1;
    if (b.startDate) return 1;
    return a.series.localeCompare(b.series);
  });
}
