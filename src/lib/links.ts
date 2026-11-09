import type { Conference, Deadline } from '../types';
import {
  deadlineInstant,
  formatConferenceRange,
  isDeadlinePassed,
  isSubmission,
  dateDiffInDays,
} from './date';
import { DATA_UPDATED_AT, DATA_VERSION } from '../data/conferences';
import { getRating, TIER_META } from '../data/ratings';

export function dblpUrl(conference: Conference): string {
  if (!conference.dblpKey) {
    return `https://dblp.org/search?q=${encodeURIComponent(conference.series)}`;
  }
  return `https://dblp.org/db/conf/${conference.dblpKey}/index.html`;
}

export function scholarUrl(conference: Conference): string {
  return `https://scholar.google.com/scholar?q=${encodeURIComponent(
    `${conference.series} ${conference.edition} robotics`,
  )}`;
}

export function publisherLink(conference: Conference): { label: string; url: string } {
  if (conference.proceedingsUrl) {
    const labels: Record<Conference['publisher'], string> = {
      ieee: 'IEEE Xplore',
      acm: 'ACM DL',
      openreview: 'OpenReview',
      pmlr: 'PMLR',
      rss: 'RSS Proceedings',
      unknown: '论文集',
    };
    return { label: labels[conference.publisher], url: conference.proceedingsUrl };
  }
  const query = encodeURIComponent(`${conference.series} ${conference.edition}`);
  switch (conference.publisher) {
    case 'acm':
      return {
        label: 'ACM DL',
        url: `https://dl.acm.org/action/doSearch?AllField=${query}`,
      };
    case 'openreview':
    case 'pmlr':
      return {
        label: conference.publisher === 'pmlr' ? 'PMLR' : 'OpenReview',
        url:
          conference.publisher === 'pmlr'
            ? 'https://proceedings.mlr.press/'
            : `https://openreview.net/search?term=${query}&content=all&group=all`,
      };
    case 'rss':
      return { label: 'RSS Proceedings', url: 'https://www.roboticsproceedings.org/' };
    case 'ieee':
      return {
        label: 'IEEE Xplore',
        url: `https://ieeexplore.ieee.org/search/searchresult.jsp?queryText=${encodeURIComponent(
          `"${conference.series}" AND ${conference.edition}`,
        )}`,
      };
    default:
      return {
        label: '学术搜索',
        url: scholarUrl(conference),
      };
  }
}

export function paperLinks(conference: Conference) {
  return {
    dblp: dblpUrl(conference),
    publisher: publisherLink(conference),
    scholar: scholarUrl(conference),
    openreview: conference.openreviewUrl ?? null,
  };
}

function escapeICS(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function formatICSDate(date: Date): string {
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}`;
}

function formatICSDateTime(date: Date): string {
  return `${formatICSDate(date)}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(
    date.getUTCSeconds(),
  )}Z`;
}

function nextDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + 1));
  return `${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}-${pad(next.getUTCDate())}`;
}

function deadlineEvent(conference: Conference, deadline: Deadline): string {
  const eventDate = deadlineInstant(deadline);
  const uid = `${conference.id}-${deadline.kind}-${deadline.date}@jicheng.local`;
  const lines: string[] = [
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatICSDateTime(new Date())}`,
  ];

  if (eventDate) {
    const end = new Date(eventDate.getTime() + 60 * 60 * 1000);
    lines.push(`DTSTART:${formatICSDateTime(eventDate)}`);
    lines.push(`DTEND:${formatICSDateTime(end)}`);
  } else {
    lines.push(`DTSTART;VALUE=DATE:${deadline.date.replace(/-/g, '')}`);
    lines.push(`DTEND;VALUE=DATE:${nextDate(deadline.date).replace(/-/g, '')}`);
  }

  const confidenceLabel = deadline.confidence === 'confirmed' ? '官方核验' : '预测窗口';
  const rating = getRating(conference.series);
  const description = [
    `${conference.fullName} (${conference.series} ${conference.edition})`,
    `${deadline.label}：${deadline.displayDate ?? deadline.date}${deadline.time ? ` ${deadline.time}` : ''}${
      deadline.timezone ? ` ${deadline.timezone}` : ''
    }`,
    `日期状态：${confidenceLabel}`,
    `CCF：${rating.ccf ? `CCF ${rating.ccf}` : '未列入第七版目录'} · 机程梯队：${TIER_META[rating.tier].label}`,
    deadline.note ?? '',
    conference.location
      ? `地点：${conference.location.city}, ${conference.location.countryCn}`
      : '地点：待公布',
    `会议：${formatConferenceRange(conference.startDate, conference.endDate)}`,
    `官网：${conference.website}`,
    `投稿：${conference.submissionUrl}`,
    `数据来源：机程 BOT/CAL · 同步于 ${DATA_VERSION}`,
    deadline.confidence === 'estimated' ? '注意：此日期为预测窗口，请以官网为准。' : '',
  ]
    .filter(Boolean)
    .join('\n');

  lines.push(`SUMMARY:${escapeICS(`[机程] ${conference.series} ${conference.edition} · ${deadline.label}`)}`);
  lines.push(`DESCRIPTION:${escapeICS(description)}`);
  lines.push(`URL:${conference.website}`);
  lines.push(`CATEGORIES:${escapeICS(conference.categories.join(','))}`);
  lines.push(`STATUS:${deadline.confidence === 'confirmed' ? 'CONFIRMED' : 'TENTATIVE'}`);
  lines.push(`TRANSP:TRANSPARENT`);
  if (isSubmission(deadline) && !isDeadlinePassed(deadline)) {
    lines.push('BEGIN:VALARM');
    lines.push('TRIGGER:-P7D');
    lines.push('ACTION:DISPLAY');
    lines.push(`DESCRIPTION:${escapeICS(`${conference.series} ${conference.edition} 截稿还有 7 天`)}`);
    lines.push('END:VALARM');
  }
  lines.push('END:VEVENT');
  return lines.join('\r\n');
}

function conferenceEvent(conference: Conference): string | null {
  if (!conference.startDate) return null;
  const start = conference.startDate.replace(/-/g, '');
  const endDate = conference.endDate ?? conference.startDate;
  const [year, month, day] = endDate.split('-').map(Number);
  const end = new Date(Date.UTC(year, month - 1, day + 1));
  return [
    'BEGIN:VEVENT',
    `UID:${conference.id}-conference@jicheng.local`,
    `DTSTAMP:${formatICSDateTime(new Date())}`,
    `DTSTART;VALUE=DATE:${start}`,
    `DTEND;VALUE=DATE:${formatICSDate(end)}`,
    `SUMMARY:${escapeICS(`[机程] ${conference.series} ${conference.edition} · 会议举行`)}`,
    `DESCRIPTION:${escapeICS(
      `${conference.fullName}\n${formatConferenceRange(conference.startDate, conference.endDate)}\n地点：${
        conference.location ? `${conference.location.city}, ${conference.location.countryCn}` : '待公布'
      }\n官网：${conference.website}`,
    )}`,
    `URL:${conference.website}`,
    'CATEGORIES:CONFERENCE',
    'TRANSP:TRANSPARENT',
    'END:VEVENT',
  ].join('\r\n');
}

export function generateICS(conferences: Conference[], options: { includeConference?: boolean } = {}): string {
  const header = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//JICHENG BOT CAL//Robotics Conference Radar//CN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:机程 · 机器人会议截稿雷达',
    'X-WR-CALDESC:机器人会议投稿日期、会期与官方入口。预测节点以 TENTATIVE 标记。',
    'X-WR-TIMEZONE:Asia/Shanghai',
    `X-JICHENG-VERSION:${DATA_VERSION}`,
  ];
  const events: string[] = [];
  for (const conference of conferences) {
    for (const deadline of conference.deadlines) {
      events.push(deadlineEvent(conference, deadline));
    }
    if (options.includeConference !== false) {
      const event = conferenceEvent(conference);
      if (event) events.push(event);
    }
  }
  return [...header, ...events, 'END:VCALENDAR'].join('\r\n');
}

function escapeCSV(value: string | number | null | undefined): string {
  const text = value == null ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export function generateCSV(conferences: Conference[]): string {
  const headers = [
    '会议简称',
    '会议全称',
    '中文名',
    '届次',
    '研究方向',
    '城市',
    '国家',
    '会议开始',
    '会议结束',
    '节点类型',
    '节点名称',
    '日期',
    '时间',
    '时区',
    '置信度',
    'CCF评级',
    'CCF领域',
    '论文梯队',
    '竞争度',
    '备注',
    '官网',
    '投稿入口',
    '论文索引',
    '数据来源',
    '核验日期',
  ];
  const rows: string[][] = [];
  for (const conference of conferences) {
    const categoryLabels = conference.categories.join(' / ');
    const dblp = dblpUrl(conference) ?? '';
    for (const deadline of conference.deadlines) {
      rows.push([
        conference.series,
        conference.fullName,
        conference.chineseName,
        String(conference.edition),
        categoryLabels,
        conference.location?.city ?? '待公布',
        conference.location?.countryCn ?? '待公布',
        conference.startDate ?? '待公布',
        conference.endDate ?? '待公布',
        deadline.kind,
        deadline.label,
        deadline.date,
        deadline.time ?? '',
        deadline.timezone ?? '',
        deadline.confidence === 'confirmed' ? '官方核验' : '预测窗口',
        getRating(conference.series).ccf ?? '未列入',
        getRating(conference.series).ccfDomain ?? '',
        TIER_META[getRating(conference.series).tier].label,
        String(getRating(conference.series).difficulty),
        deadline.note ?? '',
        conference.website,
        conference.submissionUrl,
        dblp,
        conference.sources.map((source) => source.url).join(' | '),
        conference.lastVerified,
      ]);
    }
  }
  const body = rows.map((row) => row.map(escapeCSV).join(',')).join('\r\n');
  return `\uFEFF${headers.map(escapeCSV).join(',')}\r\n${body}`;
}

export function generateJSON(conferences: Conference[]): string {
  return JSON.stringify(
    {
      name: '机程 BOT/CAL',
      version: DATA_VERSION,
      updatedAt: DATA_UPDATED_AT,
      timezone: 'Asia/Shanghai',
      count: conferences.length,
      conferences: conferences.map((conference) => ({
        ...conference,
        rating: getRating(conference.series),
      })),
    },
    null,
    2,
  );
}

export function downloadTextFile(filename: string, content: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadCalendar(conferences: Conference[], filename = 'jicheng-robotics-deadlines.ics'): void {
  downloadTextFile(filename, generateICS(conferences), 'text/calendar;charset=utf-8');
}

export function downloadCSV(conferences: Conference[]): void {
  downloadTextFile('jicheng-robotics-deadlines.csv', generateCSV(conferences), 'text/csv;charset=utf-8');
}

export function downloadJSON(conferences: Conference[]): void {
  downloadTextFile('jicheng-robotics-deadlines.json', generateJSON(conferences), 'application/json;charset=utf-8');
}

export function daysLabel(date: string): string {
  const diff = dateDiffInDays(date, new Date().toISOString().slice(0, 10));
  if (diff === 0) return '今天';
  if (diff === 1) return '明天';
  return `${diff} 天`;
}
