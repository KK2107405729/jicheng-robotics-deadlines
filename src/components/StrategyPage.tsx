import { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Award,
  BarChart3,
  CalendarClock,
  Gauge,
  Layers3,
  Scale,
  Target,
  TriangleAlert,
} from 'lucide-react';
import type { Category, CategoryId, CcfRank, Conference, Deadline, PaperTier, VenueRating } from '../types';
import { CATEGORIES, CATEGORY_MAP } from '../data/conferences';
import {
  CCF_DISCLAIMER,
  CCF_EDITION,
  CCF_META,
  CCF_PDF_URL,
  CCF_URL,
  TIER_META,
  difficultyLabel,
  getRating,
} from '../data/ratings';
import {
  daysUntilDeadline,
  formatDate,
  formatMonthDay,
  getNextSubmission,
} from '../lib/date';

interface StrategyPageProps {
  conferences: Conference[];
  categories?: Category[];
  now: Date;
  onOpen: (conference: Conference) => void;
}

type Goal = 'prestige' | 'ccf' | 'fit' | 'speed';
type Horizon = 90 | 180 | 365 | 730;

interface Candidate {
  conference: Conference;
  deadline: Deadline;
  rating: VenueRating;
  days: number;
}

const GOALS: { value: Goal; label: string; description: string }[] = [
  { value: 'prestige', label: '学术声望', description: '优先看社区影响力与子领域认可' },
  { value: 'ccf', label: 'CCF 指标', description: '优先看 CCF 目录档位' },
  { value: 'fit', label: '方向匹配', description: '优先看研究方向与论文类型' },
  { value: 'speed', label: '最快窗口', description: '优先看最近可投的截稿日' },
];

const HORIZONS: { value: Horizon; label: string }[] = [
  { value: 90, label: '未来 3 个月' },
  { value: 180, label: '未来 6 个月' },
  { value: 365, label: '未来 12 个月' },
  { value: 730, label: '全部节点' },
];

const TIER_ORDER: PaperTier[] = ['flagship', 'first', 'second', 'special'];

const TIER_ROLE: Record<PaperTier, string> = {
  flagship: '冲刺',
  first: '主投',
  second: '稳妥',
  special: '备选',
};

function uniqueBestEditions(conferences: Conference[], now: Date): Conference[] {
  const grouped = new Map<string, Conference[]>();
  for (const conference of conferences) {
    const list = grouped.get(conference.series) ?? [];
    list.push(conference);
    grouped.set(conference.series, list);
  }
  const result: Conference[] = [];
  for (const list of grouped.values()) {
    const upcoming = list
      .map((conference) => ({ conference, deadline: getNextSubmission(conference, now) }))
      .filter((entry): entry is { conference: Conference; deadline: Deadline } => Boolean(entry.deadline))
      .sort((a, b) => a.deadline.date.localeCompare(b.deadline.date));
    if (upcoming.length > 0) {
      result.push(upcoming[0].conference);
    } else {
      result.push([...list].sort((a, b) => b.edition - a.edition)[0]);
    }
  }
  return result;
}

function candidateFor(conference: Conference, now: Date): Candidate | null {
  const deadline = getNextSubmission(conference, now);
  if (!deadline) return null;
  return {
    conference,
    deadline,
    rating: getRating(conference.series),
    days: daysUntilDeadline(deadline),
  };
}

function formatHorizonCount(days: number): string {
  if (days <= 0) return '今天';
  if (days === 1) return '明天';
  return `${days} 天后`;
}

function ccfScore(rank: CcfRank | null): number {
  if (rank === 'A') return 4;
  if (rank === 'B') return 3;
  if (rank === 'C') return 2;
  return 0;
}

export function StrategyPage({ conferences, categories = CATEGORIES, now, onOpen }: StrategyPageProps) {
  const [goal, setGoal] = useState<Goal>('prestige');
  const [category, setCategory] = useState<CategoryId | 'all'>('all');
  const [horizon, setHorizon] = useState<Horizon>(365);

  const unique = useMemo(() => uniqueBestEditions(conferences, now), [conferences, now]);
  const candidates = useMemo(
    () => unique.map((conference) => candidateFor(conference, now)).filter((item): item is Candidate => Boolean(item)),
    [unique, now],
  );

  const tierCounts = useMemo(() => {
    const counts: Record<PaperTier, number> = { flagship: 0, first: 0, second: 0, special: 0 };
    for (const conference of unique) counts[getRating(conference.series).tier] += 1;
    return counts;
  }, [unique]);

  const ccfGroups = useMemo(() => {
    const groups: Record<CcfRank | 'none', Conference[]> = { A: [], B: [], C: [], none: [] };
    for (const conference of unique) {
      groups[getRating(conference.series).ccf ?? 'none'].push(conference);
    }
    return groups;
  }, [unique]);

  const ccfCount = ccfGroups.A.length + ccfGroups.B.length + ccfGroups.C.length;

  const categoryCandidates = useMemo(() => {
    const pool = candidates.filter(
      (candidate) => category === 'all' || candidate.conference.categories.includes(category),
    );
    const inWindow = pool.filter((candidate) => candidate.days <= horizon);
    return inWindow.length > 0 ? inWindow : pool;
  }, [candidates, category, horizon]);

  const recommendations = useMemo(() => {
    const ranked = [...categoryCandidates].sort((a, b) => {
      if (goal === 'speed') {
        if (a.days !== b.days) return a.days - b.days;
        return TIER_META[b.rating.tier].weight - TIER_META[a.rating.tier].weight;
      }
      if (goal === 'ccf') {
        const ccfDiff = ccfScore(b.rating.ccf) - ccfScore(a.rating.ccf);
        if (ccfDiff !== 0) return ccfDiff;
        const tierDiff = TIER_META[b.rating.tier].weight - TIER_META[a.rating.tier].weight;
        if (tierDiff !== 0) return tierDiff;
        return a.days - b.days;
      }
      const tierDiff = TIER_META[b.rating.tier].weight - TIER_META[a.rating.tier].weight;
      if (tierDiff !== 0) return tierDiff;
      return a.days - b.days;
    });
    return ranked.slice(0, 3);
  }, [categoryCandidates, goal]);

  const scopeIsNarrowed = categoryCandidates.length > 0 && categoryCandidates.some((candidate) => candidate.days > horizon);
  const ccfInScope = categoryCandidates.some((candidate) => candidate.rating.ccf);

  const monthPressure = useMemo(() => {
    const map = new Map<string, Candidate[]>();
    for (const candidate of candidates) {
      const key = candidate.deadline.date.slice(0, 7);
      const list = map.get(key) ?? [];
      list.push(candidate);
      map.set(key, list);
    }
    return [...map.entries()]
      .map(([key, items]) => ({
        key,
        items: items.sort((a, b) => a.deadline.date.localeCompare(b.deadline.date)),
      }))
      .sort((a, b) => a.key.localeCompare(b.key));
  }, [candidates]);

  const busiestMonth = useMemo(
    () =>
      monthPressure.reduce(
        (best, current) => (current.items.length > best.items.length ? current : best),
        monthPressure[0] ?? { key: '', items: [] },
      ),
    [monthPressure],
  );

  const portfolio = useMemo(
    () =>
      TIER_ORDER.map((tier) => ({
        tier,
        meta: TIER_META[tier],
        items: candidates
          .filter((candidate) => candidate.rating.tier === tier)
          .sort((a, b) => a.deadline.date.localeCompare(b.deadline.date))
          .slice(0, 3),
      })),
    [candidates],
  );

  const categoryLabel = category === 'all' ? '全部方向' : CATEGORY_MAP[category].label;

  const reasonFor = (candidate: Candidate): string => {
    const { rating } = candidate;
    if (goal === 'ccf') {
      return rating.ccf
        ? `CCF ${rating.ccf} + ${TIER_META[rating.tier].label}；按 CCF 档位优先排序，同时保留社区声望信息。`
        : `CCF 未列入，但属于${TIER_META[rating.tier].label}；如果单位硬性看 CCF，该方向的目录覆盖非常有限。`;
    }
    if (goal === 'fit') {
      return `匹配「${categoryLabel}」；${TIER_META[rating.tier].label}，偏好 ${rating.fit}。`;
    }
    if (goal === 'speed') {
      return `距截稿 ${Math.max(0, candidate.days)} 天；${TIER_META[rating.tier].label}，适合尽快形成完整投稿包。`;
    }
    return `${TIER_META[rating.tier].label}，${rating.fit}；${rating.advice}`;
  };

  return (
    <div className="strategy-page">
      <header className="strategy-hero">
        <div className="strategy-hero-copy">
          <div className="section-kicker">
            <span className="kicker-square" />
            SUBMISSION STRATEGY / 投稿策略
          </div>
          <h1>
            别只问中不中，
            <br />
            <em>先问值不值得投。</em>
          </h1>
          <p>
            CCF 目录、机器人社区声望、论文类型和截稿窗口，是四套不同的坐标。把它们放在同一张桌上，才能决定这一篇投哪里。
          </p>
          <div className="strategy-hero-meta">
            <span>CCF {CCF_EDITION}</span>
            <span>{unique.length} 个会议系列</span>
            <span>梯队为非官方编辑判断</span>
          </div>
        </div>

        <div className="rating-lens">
          <div className="rating-lens-head">
            <span>RATING LENS / 2026</span>
            <span>2 AXES</span>
          </div>
          <div className="rating-lens-title">
            CCF B
            <span>≠</span>
            第二梯队
          </div>
          <p>
            ICRA 是 CCF B，但同时是机器人旗舰。RSS、CoRL、HRI 甚至不在 CCF 第七版目录里。
          </p>
          <div className="rating-lens-compare">
            <div>
              <span>ICRA</span>
              <strong>CCF B</strong>
              <small>旗舰级</small>
            </div>
            <i>VS</i>
            <div>
              <span>RSS</span>
              <strong>未列入</strong>
              <small>旗舰级</small>
            </div>
          </div>
          <div className="rating-lens-stats">
            <div>
              <strong>{ccfCount}</strong>
              <span>CCF 收录</span>
            </div>
            <div>
              <strong>{unique.length - ccfCount}</strong>
              <span>未列入</span>
            </div>
            <div>
              <strong>{tierCounts.flagship + tierCounts.first}</strong>
              <span>冲刺 / 主投池</span>
            </div>
          </div>
        </div>
      </header>

      <section className="strategy-section">
        <div className="strategy-section-head">
          <div>
            <div className="section-kicker">
              <span className="kicker-square" />
              TWO AXES / 两套坐标系
            </div>
            <h2>官方目录是一把尺，社区声望是另一把。</h2>
            <p>评级用于选会，不用于给单篇论文或作者贴标签。两套坐标不一致时，先确认你的评价场景。</p>
          </div>
          <Award size={28} strokeWidth={1.2} className="section-watermark" />
        </div>

        <div className="rating-panels">
          <article className="rating-panel rating-panel--ccf">
            <div className="rating-panel-head">
              <span className="rating-panel-icon">
                <Award size={17} />
              </span>
              <div>
                <strong>CCF 推荐目录</strong>
                <span>{CCF_EDITION} · 官方</span>
              </div>
              <a href={CCF_PDF_URL} target="_blank" rel="noreferrer" className="rating-panel-link">
                目录 PDF
                <ArrowUpRight size={12} />
              </a>
            </div>
            <div className="distribution-list">
              {(['A', 'B', 'C', 'none'] as const).map((key) => {
                const meta = CCF_META[key];
                const count = ccfGroups[key].length;
                return (
                  <div key={key} className="distribution-row">
                    <span className={`ccf-badge ccf-badge--${key.toLowerCase()}`}>{meta.label}</span>
                    <div className="distribution-track">
                      <i style={{ width: `${Math.max(count === 0 ? 0 : 8, (count / unique.length) * 100)}%`, background: meta.color }} />
                    </div>
                    <span className="distribution-count">{String(count).padStart(2, '0')}</span>
                  </div>
                );
              })}
            </div>
            <div className="venue-chip-list">
              {ccfGroups.B.map((conference) => (
                <button key={conference.series} className="venue-chip" onClick={() => onOpen(conference)}>
                  {conference.series}
                  <span>CCF B</span>
                </button>
              ))}
              {ccfGroups.C.map((conference) => (
                <button key={conference.series} className="venue-chip" onClick={() => onOpen(conference)}>
                  {conference.series}
                  <span>CCF C</span>
                </button>
              ))}
              {ccfCount === 0 && <span className="venue-chip-empty">本批次暂无 CCF 收录会议</span>}
            </div>
            <p className="rating-panel-note">
              本数据中 CCF A = 0；B = ICRA；C = IROS、WHC。其余 20 个系列未列入第七版目录。
            </p>
            <div className="ccf-gap-note">
              <strong>为什么没有 CCF A？</strong>
              CCF 的人工智能目录只收录少量机器人综合会议；RSS、CoRL、HRI 等社区顶会均未进入目录，
              因此不能把“未列”直接理解为“低质量”。
            </div>
          </article>

          <article className="rating-panel rating-panel--tier">
            <div className="rating-panel-head">
              <span className="rating-panel-icon">
                <Layers3 size={17} />
              </span>
              <div>
                <strong>机程论文梯队</strong>
                <span>非官方 · 编辑判断</span>
              </div>
              <span className="rating-panel-link rating-panel-link--static">4 TIERS</span>
            </div>
            <div className="distribution-list">
              {TIER_ORDER.map((tier) => {
                const meta = TIER_META[tier];
                return (
                  <div key={tier} className="distribution-row">
                    <span className={`tier-badge tier-badge--${tier}`}>{meta.label}</span>
                    <div className="distribution-track">
                      <i
                        style={{
                          width: `${Math.max(
                            tierCounts[tier] === 0 ? 0 : 8,
                            (tierCounts[tier] / unique.length) * 100,
                          )}%`,
                          background: meta.color,
                        }}
                      />
                    </div>
                    <span className="distribution-count">{String(tierCounts[tier]).padStart(2, '0')}</span>
                  </div>
                );
              })}
            </div>
            <div className="tier-description">
              {TIER_ORDER.map((tier) => (
                <p key={tier}>
                  <span className={`tier-badge tier-badge--${tier}`}>{TIER_META[tier].label}</span>
                  {TIER_META[tier].description}
                </p>
              ))}
            </div>
            <p className="rating-panel-note">
              梯队综合社区能见度、历史口碑、竞争度与子领域代表性，不采用精确量化评分，也不等同于录用率。
            </p>
          </article>
        </div>

        <div className="ccf-callout">
          <TriangleAlert size={17} />
          <p>
            <strong>不要用 CCF 单一指标做决定。</strong>
            {CCF_DISCLAIMER}
          </p>
        </div>
      </section>

      <section className="strategy-section strategy-section--matcher">
        <div className="strategy-section-head">
          <div>
            <div className="section-kicker">
              <span className="kicker-square" />
              MATCHER / 投稿匹配
            </div>
            <h2>你的下一篇，应该投哪里？</h2>
            <p>选择方向、目标和可用时间，得到一个可解释的候选组合。它不是审稿预测，只是帮你缩小选择范围。</p>
          </div>
          <Target size={28} strokeWidth={1.2} className="section-watermark" />
        </div>

        <div className="matcher-shell">
          <div className="matcher-controls">
            <label className="matcher-field">
              <span>研究方向</span>
              <select value={category} onChange={(event) => setCategory(event.target.value as CategoryId | 'all')}>
                <option value="all">全部方向</option>
                {categories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="matcher-field matcher-field--goals">
              <span>你的优先目标</span>
              <div className="goal-pills">
                {GOALS.map((item) => (
                  <button
                    key={item.value}
                    className={`goal-pill ${goal === item.value ? 'is-active' : ''}`}
                    onClick={() => setGoal(item.value)}
                    title={item.description}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <label className="matcher-field">
              <span>可用时间</span>
              <select value={horizon} onChange={(event) => setHorizon(Number(event.target.value) as Horizon)}>
                {HORIZONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {!ccfInScope && goal === 'ccf' && (
            <div className="matcher-warning">
              <TriangleAlert size={15} />
              CCF 第七版在「{categoryLabel}」方向收录很少。下面的结果会优先给出梯队更高的会议，并标出 CCF 缺口。
            </div>
          )}
          {scopeIsNarrowed && (
            <div className="matcher-note">
              当前时间窗口内没有完全匹配的节点，已扩展到该方向最近的候选。
            </div>
          )}

          <div className="recommendation-grid">
            {recommendations.map((candidate, index) => {
              const { conference, deadline, rating, days } = candidate;
              const ccf = CCF_META[rating.ccf ?? 'none'];
              return (
                <button
                  key={conference.id}
                  className={`recommendation-card ${index === 0 ? 'is-top' : ''}`}
                  onClick={() => onOpen(conference)}
                >
                  <div className="recommendation-rank">
                    <span>0{index + 1}</span>
                    <span>{index === 0 ? 'BEST MATCH' : 'ALTERNATIVE'}</span>
                  </div>
                  <div className="recommendation-venue">
                    <div>
                      <small>
                        {conference.series} {conference.edition}
                      </small>
                      <strong>{conference.series}</strong>
                    </div>
                    <ArrowUpRight size={15} />
                  </div>
                  <div className="recommendation-badges">
                    <span className={`ccf-badge ${rating.ccf ? `ccf-badge--${rating.ccf.toLowerCase()}` : 'ccf-badge--none'}`}>
                      {ccf.label}
                    </span>
                    <span className={`tier-badge tier-badge--${rating.tier}`}>{TIER_META[rating.tier].label}</span>
                    <span className="recommendation-difficulty">竞争度 {difficultyLabel(rating.difficulty)}</span>
                  </div>
                  <p className="recommendation-reason">{reasonFor(candidate)}</p>
                  <div className="recommendation-footer">
                    <span>
                      {deadline.label} · {formatDate(deadline.date)}
                    </span>
                    <strong>{formatHorizonCount(days)}</strong>
                  </div>
                </button>
              );
            })}
            {recommendations.length === 0 && (
              <div className="strategy-empty">
                <p>当前条件下没有可投节点。</p>
                <span>尝试放宽时间窗口或切换研究方向。</span>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="strategy-section">
        <div className="strategy-section-head">
          <div>
            <div className="section-kicker">
              <span className="kicker-square" />
              PORTFOLIO / 冲稳保
            </div>
            <h2>不要只准备一篇，准备一个组合。</h2>
            <p>同一篇论文不能一稿多投；但不同成熟度的工作可以形成冲刺、主投、稳妥和备选的节奏。</p>
          </div>
          <Scale size={28} strokeWidth={1.2} className="section-watermark" />
        </div>

        <div className="portfolio-grid">
          {portfolio.map((group) => (
            <div className="portfolio-column" key={group.tier}>
              <div className="portfolio-head">
                <span className={`tier-badge tier-badge--${group.tier}`}>{group.meta.label}</span>
                <strong>{TIER_ROLE[group.tier]}</strong>
                <span>{String(group.items.length).padStart(2, '0')}</span>
              </div>
              {group.items.length === 0 && <p className="portfolio-empty">暂无节点</p>}
              {group.items.map((candidate) => (
                <button
                  key={candidate.conference.id}
                  className="portfolio-item"
                  onClick={() => onOpen(candidate.conference)}
                >
                  <span className="portfolio-name">
                    {candidate.conference.series}
                    <small>{candidate.conference.edition}</small>
                  </span>
                  <span className="portfolio-date">{formatMonthDay(candidate.deadline.date)}</span>
                  <span className="portfolio-arrow">↗</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="strategy-section">
        <div className="strategy-section-head">
          <div>
            <div className="section-kicker">
              <span className="kicker-square" />
              PRESSURE / 截稿压力
            </div>
            <h2>三月会很拥挤。</h2>
            <p>按下一节点统计，当前数据库中 {busiestMonth?.key.replace('-', '.') ?? '—'} 是最密集的月份。提前拆工作，比临近截稿再找会议更可靠。</p>
          </div>
          <BarChart3 size={28} strokeWidth={1.2} className="section-watermark" />
        </div>

        <div className="pressure-panel">
          <div className="pressure-chart">
            {monthPressure.map((month) => {
              const isBusiest = month.key === busiestMonth?.key;
              const max = Math.max(...monthPressure.map((item) => item.items.length), 1);
              return (
                <div className={`pressure-row ${isBusiest ? 'is-busiest' : ''}`} key={month.key}>
                  <span className="pressure-month">{month.key.replace('-', '.')}</span>
                  <div className="pressure-bar">
                    <i style={{ width: `${(month.items.length / max) * 100}%` }} />
                  </div>
                  <span className="pressure-count">{String(month.items.length).padStart(2, '0')}</span>
                  <span className="pressure-names">
                    {month.items.slice(0, 4).map((item) => item.conference.series).join(' · ')}
                  </span>
                </div>
              );
            })}
          </div>
          <aside className="pressure-aside">
            <div className="pressure-aside-icon">
              <CalendarClock size={24} />
            </div>
            <span className="section-kicker">WINDOW ALERT</span>
            <h3>{busiestMonth?.key.replace('-', '.') ?? '—'}</h3>
            <p>
              {busiestMonth?.items.length ?? 0} 个已公布/预测的论文节点集中在这个窗口。若同一篇论文在多个会议之间犹豫，先排除一稿多投；若是不同工作，至少提前两周完成实验冻结。
            </p>
            <div className="pressure-list">
              {busiestMonth?.items.slice(0, 5).map((item) => (
                <button key={item.conference.id} onClick={() => onOpen(item.conference)}>
                  <span>{formatMonthDay(item.deadline.date)}</span>
                  <strong>{item.conference.series}</strong>
                  <small>{TIER_META[item.rating.tier].label}</small>
                </button>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="strategy-section">
        <div className="strategy-section-head">
          <div>
            <div className="section-kicker">
              <span className="kicker-square" />
              DECISION / 决策提醒
            </div>
            <h2>三种场景，三种答案。</h2>
            <p>评级只是输入，不是结论。先确认你所在单位、导师或评价体系究竟看什么。</p>
          </div>
        </div>

        <div className="decision-grid">
          <article className="decision-card">
            <span className="decision-icon">
              <Award size={19} />
            </span>
            <span className="decision-index">01 / 单位硬性看 CCF</span>
            <h3>先把规则问清楚</h3>
            <p>
              当前数据中只有 ICRA（B）与 IROS、WHC（C）进入 CCF 第七版。如果学校或考核只认 CCF，不能把 RSS、CoRL 的社区声望替代成目录档位。
            </p>
            <span className="decision-verdict">优先 ICRA → IROS / WHC</span>
          </article>
          <article className="decision-card">
            <span className="decision-icon">
              <Gauge size={19} />
            </span>
            <span className="decision-index">02 / 海外申请 / 学术声誉</span>
            <h3>按子领域选“代表作”</h3>
            <p>
              机器人学习看 CoRL，HRI 看 HRI / RO-MAN，人形看 Humanoids，软体看 RoboSoft，医疗看 ISMR。RSS 虽然不在 CCF 目录，但在机器人学术圈仍是旗舰。
            </p>
            <span className="decision-verdict">旗舰级 + 子领域顶会</span>
          </article>
          <article className="decision-card">
            <span className="decision-icon">
              <CalendarClock size={19} />
            </span>
            <span className="decision-index">03 / 时间有限 / 首次投稿</span>
            <h3>用专题会和 Late-Breaking 过渡</h3>
            <p>
              距离截稿不足六周时，硬冲旗舰往往只会换来一轮负面审稿。ARSO、ICARA、RoMoCo 或 HRI / RO-MAN 的 Late-Breaking，适合先获得可展示的同行反馈。
            </p>
            <span className="decision-verdict">先形成闭环，再冲高</span>
          </article>
        </div>
      </section>

      <footer className="strategy-footer">
        <p>
          评级方法：CCF 档位来自《CCF 推荐国际学术会议和期刊目录》第七版（2026）；
          论文梯队为机程编辑判断，综合社区能见度、历史口碑、竞争度与子领域代表性，不构成录用率承诺。
        </p>
        <a href={CCF_URL} target="_blank" rel="noreferrer">
          查看 CCF 目录原文
          <ArrowUpRight size={13} />
        </a>
      </footer>
    </div>
  );
}
