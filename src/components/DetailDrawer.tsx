import { useEffect, useRef } from 'react';
import {
  ArrowUpRight,
  BookOpen,
  CalendarPlus,
  Check,
  Clock3,
  ExternalLink,
  MapPin,
  Send,
  ShieldCheck,
  Star,
  X,
} from 'lucide-react';
import type { Conference } from '../types';
import { CATEGORY_MAP, CONFERENCE_MAP } from '../data/conferences';
import {
  compareDeadlines,
  deadlineTimeNote,
  formatBeijingTime,
  formatConferenceRange,
  formatDate,
  isDeadlinePassed,
  isSubmission,
} from '../lib/date';
import { paperLinks } from '../lib/links';
import {
  CCF_DISCLAIMER,
  CCF_EDITION,
  CCF_META,
  CCF_URL,
  TIER_META,
  difficultyLabel,
  getRating,
} from '../data/ratings';
import { useBodyScrollLock } from '../hooks/useAppHooks';

interface DetailDrawerProps {
  conference: Conference | null;
  now: Date;
  isFavorite: boolean;
  onClose: () => void;
  onToggleFavorite: (id: string) => void;
  onCalendar: (conference: Conference) => void;
  onCopyLink: (conference: Conference) => void;
  onOpenConference: (conference: Conference) => void;
}

export function DetailDrawer({
  conference,
  now,
  isFavorite,
  onClose,
  onToggleFavorite,
  onCalendar,
  onCopyLink,
  onOpenConference,
}: DetailDrawerProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  useBodyScrollLock(Boolean(conference));

  useEffect(() => {
    if (!conference) return;
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !drawerRef.current) return;
      const focusable = Array.from(
        drawerRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.offsetParent !== null);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      previous?.focus();
    };
  }, [conference, onClose]);

  useEffect(() => {
    if (conference && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [conference]);

  if (!conference) return null;

  const categories = conference.categories.map((id) => CATEGORY_MAP[id]);
  const nextSubmission = conference.deadlines
    .filter((deadline) => isSubmission(deadline) && !isDeadlinePassed(deadline, now))
    .sort(compareDeadlines)[0];
  const pastSubmission = conference.deadlines
    .filter((deadline) => isSubmission(deadline) && isDeadlinePassed(deadline, now))
    .sort((a, b) => compareDeadlines(b, a))[0];
  const sources = [...conference.sources];
  const successor = conference.successorId ? CONFERENCE_MAP[conference.successorId] : null;
  const links = paperLinks(conference);
  const rating = getRating(conference.series);
  const tier = TIER_META[rating.tier];
  const ccf = CCF_META[rating.ccf ?? 'none'];
  const statusLabel =
    conference.dateStatus === 'confirmed'
      ? '会议信息已核验'
      : conference.dateStatus === 'partial'
        ? '会期已核验 · 投稿待定'
        : `${conference.edition} 信息待公布`;

  return (
    <div className="drawer-layer">
      <button className="drawer-scrim" onClick={onClose} aria-label="关闭详情" tabIndex={-1} />
      <aside
        ref={drawerRef}
        className="detail-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-title"
      >
        <div className="drawer-scroll" ref={scrollRef}>
          <div className="drawer-head">
            <span className="drawer-head-label">CONFERENCE FILE / {conference.series}</span>
            <div className="drawer-head-actions">
              <button
                className={`favorite-button drawer-favorite ${isFavorite ? 'is-favorite' : ''}`}
                onClick={() => onToggleFavorite(conference.id)}
                aria-label={isFavorite ? '取消关注' : '加入关注'}
                aria-pressed={isFavorite}
              >
                <Star size={16} fill={isFavorite ? 'currentColor' : 'none'} />
              </button>
              <button ref={closeRef} className="drawer-close" onClick={onClose} aria-label="关闭详情">
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="drawer-hero">
            <div className="drawer-edition">{conference.edition} EDITION</div>
            <h2 id="detail-title">{conference.series}</h2>
            <p className="drawer-fullname">{conference.fullName}</p>
            <p className="drawer-chinese">{conference.chineseName}</p>

            <div className="drawer-tags">
              {categories.map((category) => (
                <span key={category.id} className="drawer-tag" style={{ color: category.color }}>
                  <i style={{ background: category.color }} />
                  {category.label}
                </span>
              ))}
            </div>

            <div className="drawer-rating-row">
              <span
                className={`ccf-badge ${rating.ccf ? `ccf-badge--${rating.ccf.toLowerCase()}` : 'ccf-badge--none'}`}
              >
                {ccf.label}
              </span>
              <span className={`tier-badge tier-badge--${rating.tier}`}>{tier.label}</span>
              <span className="drawer-rating-note">
                CCF {CCF_EDITION} · 机程梯队为非官方编辑判断
              </span>
            </div>

            <div className="drawer-status-row">
              <span className={`drawer-status drawer-status--${conference.dateStatus}`}>
                {conference.dateStatus === 'confirmed' ? <Check size={12} /> : <ShieldCheck size={12} />}
                {statusLabel}
              </span>
              {nextSubmission && (
                <span className="drawer-next">
                  最近节点：{nextSubmission.label} · {formatDate(nextSubmission.date)}
                </span>
              )}
              {!nextSubmission && pastSubmission && (
                <span className="drawer-status drawer-status--closed">
                  论文投稿已截止 · {formatDate(pastSubmission.date)}
                </span>
              )}
            </div>
          </div>

          <div className="drawer-body">
            <div className="drawer-meta-grid">
              <div>
                <span>地点 / VENUE</span>
                <strong>
                  {conference.location
                    ? `${conference.location.flag} ${conference.location.city}`
                    : '待公布'}
                </strong>
                <small>
                  {conference.location
                    ? `${conference.location.countryCn}${conference.location.venue ? ` · ${conference.location.venue}` : ''}`
                    : '等待主办方公布'}
                </small>
              </div>
              <div>
                <span>会期 / DATES</span>
                <strong>{formatConferenceRange(conference.startDate, conference.endDate)}</strong>
                <small>{conference.format}</small>
              </div>
              <div>
                <span>区域 / REGION</span>
                <strong>{conference.location?.region ?? '待公布'}</strong>
                <small>{conference.categories.length} 个研究方向</small>
              </div>
            </div>

            <div className="drawer-strategy">
              <div className="drawer-section-head">
                <div>
                  <span className="section-kicker">SUBMISSION NOTES / 投稿建议</span>
                  <h3>这篇工作适合投吗？</h3>
                </div>
                <span className="drawer-section-count">EDITORIAL VIEW</span>
              </div>
              <div className="rating-detail-grid">
                <div>
                  <span>CCF 评级</span>
                  <strong>{rating.ccf ? `CCF ${rating.ccf}` : '未列入'}</strong>
                  <small>{rating.ccfDomain ?? '第七版目录未收录'}</small>
                </div>
                <div>
                  <span>论文梯队</span>
                  <strong>{tier.label}</strong>
                  <small>{tier.role}</small>
                </div>
                <div>
                  <span>竞争度</span>
                  <strong>{difficultyLabel(rating.difficulty)}</strong>
                  <small>主观估计，非录用率</small>
                </div>
              </div>
              <div className="fit-line">
                <span>适合</span>
                <strong>{rating.fit}</strong>
              </div>
              <p className="drawer-advice">{rating.advice}</p>
              {!rating.ccf && (
                <p className="drawer-ccf-note">
                  CCF 未列入 ≠ 低质量。机器人社区的 RSS、CoRL、HRI 等核心会议同样不在第七版目录中。
                </p>
              )}
              <a className="drawer-ccf-link" href={CCF_URL} target="_blank" rel="noreferrer">
                查看 CCF 第七版目录与说明
                <ArrowUpRight size={12} />
              </a>
              <p className="drawer-ccf-disclaimer">{CCF_DISCLAIMER}</p>
            </div>

            <div className="drawer-section">
              <div className="drawer-section-head">
                <div>
                  <span className="section-kicker">TIMELINE / 时间线</span>
                  <h3>关键节点</h3>
                </div>
                <span className="drawer-section-count">{conference.deadlines.length + 1} MILESTONES</span>
              </div>

              <div className="milestone-list">
                {[...conference.deadlines].sort(compareDeadlines).map((deadline) => {
                  const passed = isDeadlinePassed(deadline, now);
                  const beijing = formatBeijingTime(deadline);
                  return (
                    <div
                      key={`${deadline.kind}-${deadline.date}`}
                      className={`milestone ${passed ? 'is-passed' : ''} ${
                        deadline.confidence === 'estimated' ? 'is-estimated' : ''
                      }`}
                    >
                      <div className="milestone-date">
                        <strong>{deadline.date.slice(5).replace('-', '.')}</strong>
                        <span>{deadline.date.slice(0, 4)}</span>
                      </div>
                      <div className="milestone-axis">
                        <span className="milestone-dot" />
                      </div>
                      <div className="milestone-content">
                        <div className="milestone-title">
                          <h4>{deadline.label}</h4>
                          <span
                            className={`tiny-status ${
                              deadline.confidence === 'estimated'
                                ? 'tiny-status--estimated'
                                : passed
                                  ? 'tiny-status--closed'
                                  : 'tiny-status--confirmed'
                            }`}
                          >
                            {deadline.confidence === 'estimated' ? '预计' : passed ? '已截止' : '官方'}
                          </span>
                        </div>
                        <p className="milestone-time">
                          <Clock3 size={12} />
                          {deadlineTimeNote(deadline)}
                          {beijing && <span> · 北京时间 {beijing}</span>}
                        </p>
                        {deadline.note && <p className="milestone-note">{deadline.note}</p>}
                      </div>
                    </div>
                  );
                })}

                <div className={`milestone milestone--conference ${!conference.startDate ? 'is-passed' : ''}`}>
                  <div className="milestone-date">
                    <strong>{conference.startDate ? conference.startDate.slice(5).replace('-', '.') : 'TBA'}</strong>
                    <span>{conference.startDate?.slice(0, 4) ?? '2027'}</span>
                  </div>
                  <div className="milestone-axis">
                    <span className="milestone-dot milestone-dot--conference" />
                  </div>
                  <div className="milestone-content">
                    <div className="milestone-title">
                      <h4>会议举行</h4>
                      <span className="tiny-status tiny-status--conference">
                        {conference.startDate ? '会期' : '待公布'}
                      </span>
                    </div>
                    <p className="milestone-time">
                      <MapPin size={12} />
                      {conference.location
                        ? `${conference.location.city}, ${conference.location.countryCn}`
                        : '地点待公布'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="drawer-section">
              <div className="drawer-section-head">
                <div>
                  <span className="section-kicker">ACCESS / 入口</span>
                  <h3>快速入口</h3>
                </div>
              </div>
              <div className="access-grid">
                <a href={conference.website} target="_blank" rel="noreferrer" className="access-card">
                  <span className="access-icon">
                    <ExternalLink size={17} />
                  </span>
                  <span>
                    <strong>{conference.websiteLabel ?? '会议官网'}</strong>
                    <small>{conference.websiteLabel ? '查看官方会议页' : '查看最新 CFP 与日程'}</small>
                  </span>
                  <ArrowUpRight size={14} />
                </a>
                <a href={conference.submissionUrl} target="_blank" rel="noreferrer" className="access-card">
                  <span className="access-icon">
                    <Send size={17} />
                  </span>
                  <span>
                    <strong>{conference.submissionLabel ?? '投稿入口'}</strong>
                    <small>进入投稿系统</small>
                  </span>
                  <ArrowUpRight size={14} />
                </a>
                {links.dblp && (
                  <a href={links.dblp} target="_blank" rel="noreferrer" className="access-card">
                    <span className="access-icon">
                      <BookOpen size={17} />
                    </span>
                    <span>
                      <strong>论文索引 · DBLP</strong>
                      <small>浏览历届论文与作者</small>
                    </span>
                    <ArrowUpRight size={14} />
                  </a>
                )}
                <a href={links.publisher.url} target="_blank" rel="noreferrer" className="access-card">
                  <span className="access-icon">
                    <BookOpen size={17} />
                  </span>
                  <span>
                    <strong>{links.publisher.label}</strong>
                    <small>前往出版方页面</small>
                  </span>
                  <ArrowUpRight size={14} />
                </a>
              </div>
            </div>

            <div className="drawer-note-block">
              <span className="section-kicker">ABSTRACT / 简介</span>
              <p>{conference.summary}</p>
              {conference.note && <p className="drawer-alert">{conference.note}</p>}
            </div>

            {successor && (
              <button className="successor-card" onClick={() => onOpenConference(successor)}>
                <span>
                  <small>NEXT EDITION / 下一届</small>
                  <strong>
                    {successor.series} {successor.edition}
                  </strong>
                  <span>{formatConferenceRange(successor.startDate, successor.endDate)}</span>
                </span>
                <ArrowUpRight size={16} />
              </button>
            )}

            <div className="drawer-sources">
              <div className="drawer-section-head">
                <div>
                  <span className="section-kicker">SOURCES / 来源</span>
                  <h3>核验记录</h3>
                </div>
                <span className="drawer-section-count">LAST CHECKED {conference.lastVerified}</span>
              </div>
              <div className="source-links">
                {sources.map((source) => (
                  <a key={source.url} href={source.url} target="_blank" rel="noreferrer">
                    {source.label}
                    <ArrowUpRight size={12} />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="drawer-footer">
          <button className="button button--primary button--small" onClick={() => onCalendar(conference)}>
            <CalendarPlus size={15} />
            加入日历
          </button>
          <button className="button button--ghost button--small" onClick={() => onCopyLink(conference)}>
            复制链接
          </button>
          <button
            className={`favorite-text ${isFavorite ? 'is-favorite' : ''}`}
            onClick={() => onToggleFavorite(conference.id)}
          >
            <Star size={14} fill={isFavorite ? 'currentColor' : 'none'} />
            {isFavorite ? '已关注' : '关注'}
          </button>
        </div>
      </aside>
    </div>
  );
}
