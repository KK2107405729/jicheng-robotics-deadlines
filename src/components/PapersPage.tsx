import { useMemo, useState } from 'react';
import { ArrowUpRight, BookOpen, ExternalLink, Search, X } from 'lucide-react';
import type { Category, CategoryId, Conference } from '../types';
import { CATEGORY_MAP } from '../data/conferences';
import { paperLinks } from '../lib/links';
import { formatConferenceRange } from '../lib/date';
import { CCF_META, TIER_META, getRating } from '../data/ratings';

interface PapersPageProps {
  conferences: Conference[];
  categories: Category[];
  onOpen: (conference: Conference) => void;
}

function uniqueSeries(conferences: Conference[]): Conference[] {
  const map = new Map<string, Conference>();
  for (const conference of conferences) {
    const key = conference.dblpKey ?? conference.series;
    const existing = map.get(key);
    if (!existing || conference.edition > existing.edition) {
      map.set(key, conference);
    }
  }
  return [...map.values()].sort((a, b) => a.series.localeCompare(b.series));
}

export function PapersPage({ conferences, categories, onOpen }: PapersPageProps) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryId | 'all'>('all');
  const series = useMemo(() => uniqueSeries(conferences), [conferences]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return series.filter((conference) => {
      if (activeCategory !== 'all' && !conference.categories.includes(activeCategory)) return false;
      if (!normalized) return true;
      return [conference.series, conference.fullName, conference.chineseName, ...conference.tags]
        .join(' ')
        .toLowerCase()
        .includes(normalized);
    });
  }, [series, query, activeCategory]);

  return (
    <div className="papers-page">
      <header className="page-hero page-hero--papers">
        <div className="page-hero-copy">
          <div className="section-kicker">
            <span className="kicker-square" />
            PAPER INDEX / 论文索引
          </div>
          <h1>
            从会议，
            <br />
            到论文集。
          </h1>
          <p>
            每场会议都保留三个入口：DBLP 全系列索引、出版方页面、学术搜索。读论文，也读审稿趋势。
          </p>
        </div>
        <div className="paper-stack" aria-hidden="true">
          <div className="paper-sheet paper-sheet--back">
            <span>03</span>
            <b>SCHOLAR</b>
          </div>
          <div className="paper-sheet paper-sheet--mid">
            <span>02</span>
            <b>PUBLISHER</b>
          </div>
          <div className="paper-sheet paper-sheet--front">
            <span>01</span>
            <b>DBLP</b>
            <i>INDEX</i>
            <p>conf / robotics</p>
          </div>
        </div>
      </header>

      <div className="paper-toolbar">
        <label className="search-box paper-search">
          <Search size={17} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索会议、关键词…"
            aria-label="搜索论文索引"
          />
          {query && (
            <button className="search-clear" onClick={() => setQuery('')} aria-label="清除搜索">
              <X size={14} />
            </button>
          )}
        </label>
        <div className="paper-category-filter">
          <button
            className={`category-chip ${activeCategory === 'all' ? 'is-active' : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            全部方向
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              className={`category-chip ${activeCategory === category.id ? 'is-active' : ''}`}
              onClick={() => setActiveCategory(category.id)}
              style={activeCategory === category.id ? { borderColor: category.color } : undefined}
            >
              <span className="chip-dot" style={{ background: category.color }} />
              {category.label}
            </button>
          ))}
        </div>
        <span className="paper-count">
          <strong>{String(filtered.length).padStart(2, '0')}</strong> / {series.length} 个系列
        </span>
      </div>

      <div className="paper-table" role="table" aria-label="机器人会议论文索引">
        <div className="paper-table-head" role="row">
          <span>会议 / VENUE</span>
          <span>研究方向 / FIELD</span>
          <span>下一届 / EDITION</span>
          <span>论文入口 / LINKS</span>
        </div>
        {filtered.map((conference) => {
          const links = paperLinks(conference);
          const category = CATEGORY_MAP[conference.categories[0]];
          return (
            <div className="paper-row" key={conference.series} role="row">
              <div className="paper-venue" role="cell">
                <span className="paper-monogram" style={{ background: category.color }}>
                  {conference.series.slice(0, 1)}
                </span>
                <div>
                  <button className="paper-venue-name" onClick={() => onOpen(conference)}>
                    {conference.series}
                    <ArrowUpRight size={13} />
                  </button>
                  <p>{conference.fullName}</p>
                  {(() => {
                    const rating = getRating(conference.series);
                    return (
                      <div className="paper-venue-rating">
                        <span className={`ccf-badge ${rating.ccf ? `ccf-badge--${rating.ccf.toLowerCase()}` : 'ccf-badge--none'}`}>
                          {CCF_META[rating.ccf ?? 'none'].label}
                        </span>
                        <span className={`tier-badge tier-badge--${rating.tier}`}>
                          {TIER_META[rating.tier].label}
                        </span>
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="paper-cats" role="cell">
                {conference.categories.slice(0, 2).map((categoryId) => {
                  const cat = CATEGORY_MAP[categoryId];
                  return (
                    <span key={categoryId} className="mini-cat" style={{ color: cat.color }}>
                      <i style={{ background: cat.color }} />
                      {cat.label}
                    </span>
                  );
                })}
              </div>

              <div className="paper-edition" role="cell">
                <strong>
                  {conference.series} {conference.edition}
                </strong>
                <span>
                  {conference.location ? `${conference.location.city} · ` : ''}
                  {formatConferenceRange(conference.startDate, conference.endDate)}
                </span>
              </div>

              <div className="paper-links" role="cell">
                {links.dblp && (
                  <a href={links.dblp} target="_blank" rel="noreferrer" className="paper-link paper-link--primary">
                    <BookOpen size={13} />
                    DBLP
                  </a>
                )}
                <a href={links.publisher.url} target="_blank" rel="noreferrer" className="paper-link">
                  <ExternalLink size={13} />
                  {links.publisher.label}
                </a>
                <a
                  href={links.scholar}
                  target="_blank"
                  rel="noreferrer"
                  className="paper-link paper-link--icon"
                  aria-label={`在 Google Scholar 搜索 ${conference.series}`}
                  title="Google Scholar"
                >
                  GS
                </a>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="paper-empty">
            <p>没有匹配的会议系列。</p>
            <button className="text-button" onClick={() => { setQuery(''); setActiveCategory('all'); }}>
              重置搜索
            </button>
          </div>
        )}
      </div>

      <div className="paper-notes">
        <div>
          <span className="note-index">NOTE / 01</span>
          <h3>DBLP 是索引，不是出版方</h3>
          <p>正式引用请以论文 DOI 或出版方页面为准。DBLP 适合快速浏览某届会议的全部论文与作者。</p>
        </div>
        <div>
          <span className="note-index">NOTE / 02</span>
          <h3>不同社区的出版路径不同</h3>
          <p>IEEE 会议通常进入 IEEE Xplore；HRI 进入 ACM DL；RSS 使用 RSS Proceedings；CoRL 使用 PMLR / OpenReview。</p>
        </div>
        <div>
          <span className="note-index">NOTE / 03</span>
          <h3>下一届 ≠ 最新论文集</h3>
          <p>右侧显示的是下一届会议信息。想读最近一届论文，请从 DBLP 或出版方页面进入对应年份。</p>
        </div>
      </div>
    </div>
  );
}
