import type { CSSProperties } from 'react';
import { ArrowUpRight, CalendarPlus, Clock3, MapPin, Star } from 'lucide-react';
import type { Conference, Deadline } from '../types';
import { CATEGORY_MAP, CONFERENCE_MAP } from '../data/conferences';
import {
  countdownFootnote,
  daysUntilDeadline,
  deadlineTimeNote,
  formatBeijingTime,
  formatConferenceRange,
  formatMonthDay,
  getLastSubmission,
  getNextSubmission,
  isDeadlinePassed,
} from '../lib/date';
import { dblpUrl } from '../lib/links';
import { CCF_EDITION, CCF_META, TIER_META, getRating } from '../data/ratings';

interface ConferenceCardProps {
  conference: Conference;
  now: Date;
  isFavorite: boolean;
  index: number;
  onOpen: (conference: Conference) => void;
  onToggleFavorite: (id: string) => void;
  onCalendar: (conference: Conference) => void;
}

function DeadlineBlock({
  conference,
  deadline,
  now,
}: {
  conference: Conference;
  deadline: Deadline;
  now: Date;
}) {
  const estimated = deadline.confidence === 'estimated';
  const passed = isDeadlinePassed(deadline, now);
  const beijing = formatBeijingTime(deadline);
  const headline = deadline.displayDate ?? formatMonthDay(deadline.date);
  const dayPart = deadline.displayDate ? null : headline.split('.')[1];
  const urgent = !passed && daysUntilDeadline(deadline) <= 3;

  return (
    <div
      className={`card-deadline ${passed ? 'is-passed' : ''} ${estimated ? 'is-estimated' : ''} ${
        urgent ? 'is-urgent' : ''
      }`}
    >
      <div className="deadline-label">
        <span>{deadline.label}</span>
        <span className={`tiny-status ${estimated ? 'tiny-status--estimated' : 'tiny-status--confirmed'}`}>
          {estimated ? '预计' : '官方'}
        </span>
      </div>
      <div className="deadline-headline">
        {deadline.displayDate ? (
          <strong className="date-word">{headline}</strong>
        ) : (
          <>
            <span className="date-mm">{headline.split('.')[0]}</span>
            <strong>{dayPart}</strong>
          </>
        )}
        <span className="date-yyyy">{deadline.date.slice(0, 4)}</span>
      </div>
      <div className="deadline-countdown">
        <Clock3 size={12} />
        <span>{countdownFootnote(deadline)}</span>
      </div>
      <div className="deadline-note">
        <span>{deadlineTimeNote(deadline)}</span>
        {beijing && <span>北京 {beijing}</span>}
      </div>
      {!passed && <div className={`deadline-pulse ${estimated ? 'is-estimated' : ''}`} />}
      <span className="visually-hidden">{conference.series} deadline</span>
    </div>
  );
}

function ClosedBlock({ conference, now }: { conference: Conference; now: Date }) {
  const last = getLastSubmission(conference, now);
  const successor = conference.successorId ? CONFERENCE_MAP[conference.successorId] : null;
  const nextDeadline = successor ? getNextSubmission(successor, now) : null;

  return (
    <div className="card-deadline is-passed is-closed">
      <div className="deadline-label">
        <span>{last ? '本轮投稿' : '投稿日期'}</span>
        <span className="tiny-status tiny-status--closed">{last ? '已截止' : '待公布'}</span>
      </div>
      {last ? (
        <>
          <div className="deadline-headline">
            <span className="date-mm">{formatMonthDay(last.date).split('.')[0]}</span>
            <strong>{formatMonthDay(last.date).split('.')[1]}</strong>
            <span className="date-yyyy">{last.date.slice(0, 4)}</span>
          </div>
          <div className="deadline-countdown">
            <Clock3 size={12} />
            <span>本轮已结束</span>
          </div>
          {successor && nextDeadline && (
            <div className="closed-next">
              下一届 {successor.series} {successor.edition}
              <span>{formatMonthDay(nextDeadline.date)}</span>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="deadline-tba">TBA</div>
          <p className="tba-copy">CFP 尚未发布</p>
        </>
      )}
    </div>
  );
}

export function ConferenceCard({
  conference,
  now,
  isFavorite,
  index,
  onOpen,
  onToggleFavorite,
  onCalendar,
}: ConferenceCardProps) {
  const next = getNextSubmission(conference, now);
  const primaryCategory = CATEGORY_MAP[conference.categories[0]];
  const rating = getRating(conference.series);
  const tier = TIER_META[rating.tier];
  const ccf = CCF_META[rating.ccf ?? 'none'];
  const paperUrl = dblpUrl(conference);

  return (
    <article
      className={`conference-card ${!next ? 'conference-card--quiet' : ''}`}
      style={{ '--category-color': primaryCategory.color } as CSSProperties}
      onClick={() => onOpen(conference)}
    >
      <div className="card-top">
        <div className="card-category-line">
          <span className="card-index">{String(index + 1).padStart(2, '0')}</span>
          {conference.categories.slice(0, 2).map((categoryId) => {
            const category = CATEGORY_MAP[categoryId];
            return (
              <span key={categoryId} className="category-tag" style={{ color: category.color }}>
                <i style={{ background: category.color }} />
                {category.label}
              </span>
            );
          })}
          {conference.categories.length > 2 && (
            <span className="category-more">+{conference.categories.length - 2}</span>
          )}
        </div>
        <button
          className={`favorite-button ${isFavorite ? 'is-favorite' : ''}`}
          onClick={(event) => {
            event.stopPropagation();
            onToggleFavorite(conference.id);
          }}
          aria-label={isFavorite ? `取消关注 ${conference.series}` : `关注 ${conference.series}`}
          aria-pressed={isFavorite}
        >
          <Star size={16} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="card-body">
        <div className="card-main">
          <div className="venue-lockup">
            <span className="venue-edition">
              {conference.edition} <i>/</i> EDITION
            </span>
            <h3>
              <button
                className="venue-title-button"
                onClick={(event) => {
                  event.stopPropagation();
                  onOpen(conference);
                }}
                aria-label={`查看 ${conference.series} ${conference.edition} 详情`}
              >
                {conference.series}
              </button>
            </h3>
          </div>
          <p className="venue-fullname">{conference.fullName}</p>
          <p className="venue-chinese">{conference.chineseName}</p>

          <div className="rating-badges">
            <span
              className={`ccf-badge ${rating.ccf ? `ccf-badge--${rating.ccf.toLowerCase()}` : 'ccf-badge--none'}`}
              title={`${ccf.description} · CCF ${CCF_EDITION}`}
            >
              {ccf.label}
            </span>
            <span
              className={`tier-badge tier-badge--${rating.tier}`}
              style={{ '--tier-color': tier.color } as CSSProperties}
              title={tier.description}
            >
              {tier.label}
            </span>
          </div>

          <div className="venue-meta">
            <span>
              <MapPin size={13} />
              {conference.location
                ? `${conference.location.flag} ${conference.location.city} · ${conference.location.countryCn}`
                : '地点待公布'}
            </span>
            <span className="meta-separator" />
            <span>{formatConferenceRange(conference.startDate, conference.endDate)}</span>
          </div>

          <div className="card-tags">
            {conference.tags.slice(0, 3).map((tag) => (
              <span key={tag}>#{tag}</span>
            ))}
          </div>
        </div>

        {next ? (
          <DeadlineBlock conference={conference} deadline={next} now={now} />
        ) : (
          <ClosedBlock conference={conference} now={now} />
        )}
      </div>

      <div className="card-footer">
        <div className="card-links">
          <a
            href={conference.website}
            target="_blank"
            rel="noreferrer"
            onClick={(event) => event.stopPropagation()}
            title="打开会议官网"
          >
            官网
            <ArrowUpRight size={12} />
          </a>
          <a
            href={conference.submissionUrl}
            target="_blank"
            rel="noreferrer"
            onClick={(event) => event.stopPropagation()}
            title="打开投稿系统"
          >
            投稿
            <ArrowUpRight size={12} />
          </a>
          {paperUrl && (
            <a
              href={paperUrl}
              target="_blank"
              rel="noreferrer"
              onClick={(event) => event.stopPropagation()}
              title="在 DBLP 查看论文"
            >
              论文
              <ArrowUpRight size={12} />
            </a>
          )}
        </div>
        <div className="card-actions">
          <button
            className="calendar-mini"
            onClick={(event) => {
              event.stopPropagation();
              onCalendar(conference);
            }}
            aria-label={`把 ${conference.series} 加入日历`}
            title="加入日历"
          >
            <CalendarPlus size={15} />
          </button>
        </div>
      </div>
    </article>
  );
}
