import {
  ArrowLeft,
  CalendarPlus,
  Database,
  FileJson,
  Keyboard,
  Radio,
  ShieldCheck,
  Table2,
  TriangleAlert,
} from 'lucide-react';
import { CATEGORIES, DATA_UPDATED_AT, DATA_VERSION } from '../data/conferences';
import { CCF_URL } from '../data/ratings';
import type { Conference } from '../types';

interface AboutPageProps {
  conferences: Conference[];
  seriesCount: number;
  categoryCounts: Record<string, number>;
  onBack: () => void;
  onExportCalendar: () => void;
  onExportJSON: () => void;
  onExportCSV: () => void;
}

const SOURCES = [
  {
    name: 'IEEE Robotics & Automation Society',
    description: '会议日历、官方截止日期与系列信息',
    url: 'https://www.ieee-ras.org/events/',
  },
  {
    name: '各会议官方网站',
    description: 'CFP、Key Dates、投稿系统与论文集入口',
    url: 'https://2027.ieee-icra.org/',
  },
  {
    name: 'CCF 推荐国际学术会议目录',
    description: 'CCF 第七版（2026）A / B / C 档位与目录说明',
    url: CCF_URL,
  },
  {
    name: 'DBLP',
    description: '会议论文索引与作者 / 标题检索',
    url: 'https://dblp.org/',
  },
  {
    name: 'RSS / OpenReview / PMLR',
    description: 'RSS 与 CoRL 的开放审稿和论文集路径',
    url: 'https://roboticsconference.org/',
  },
];

export function AboutPage({
  conferences,
  seriesCount,
  categoryCounts,
  onBack,
  onExportCalendar,
  onExportJSON,
  onExportCSV,
}: AboutPageProps) {
  const countryCount = new Set(
    conferences.map((conference) => conference.location?.countryCn).filter(Boolean),
  ).size;
  const confirmedConferences = conferences.filter((conference) =>
    conference.deadlines.some((deadline) => deadline.confidence === 'confirmed'),
  ).length;
  const estimatedConferences = conferences.filter((conference) =>
    conference.deadlines.some((deadline) => deadline.confidence === 'estimated'),
  ).length;
  const updated = new Date(DATA_UPDATED_AT).toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  return (
    <div className="about-page">
      <header className="about-hero">
        <div className="section-kicker">
          <span className="kicker-square" />
          METHODOLOGY / 数据方法
        </div>
        <h1>
          这不是一张
          <br />
          <em>“猜日期”</em>的榜单。
        </h1>
        <p>
          机程把“官方已确认”和“根据历史窗口推断”分开呈现。你可以快速扫描，但每一个关键决定，都应该回到官网完成最后一次确认。
        </p>
        <div className="about-meta">
          <span>VERSION {DATA_VERSION}</span>
          <span>LAST SYNC {updated}</span>
          <span>{seriesCount} SERIES</span>
        </div>
      </header>

      <section className="about-status-grid" aria-label="数据状态说明">
        <article className="status-card status-card--confirmed">
          <div className="status-card-top">
            <span className="status-icon">
              <ShieldCheck size={20} />
            </span>
            <span className="status-code">CONFIRMED</span>
          </div>
          <h2>官方核验</h2>
          <p>
            会议官网、官方 CFP 或 IEEE RAS 会议页明确写出的日期。若官网只给出日期而未给出具体时刻，我们不会补写时间。
          </p>
          <span className="status-stat">{confirmedConferences} 场会议含官方节点</span>
        </article>
        <article className="status-card status-card--estimated">
          <div className="status-card-top">
            <span className="status-icon">
              <Radio size={20} />
            </span>
            <span className="status-code">ESTIMATED</span>
          </div>
          <h2>预测窗口</h2>
          <p>
            2027 CFP 尚未发布，或官网只给出月份时，依据近三届投稿窗口推算。预测节点在界面和 ICS 中都会显式标记。
          </p>
          <span className="status-stat">{estimatedConferences} 场会议含预测节点</span>
        </article>
        <article className="status-card status-card--tba">
          <div className="status-card-top">
            <span className="status-icon">
              <TriangleAlert size={20} />
            </span>
            <span className="status-code">TBA</span>
          </div>
          <h2>等待公布</h2>
          <p>
            举办地、会期或 CFP 尚未公开。我们保留会议条目与官网入口，但不填入看似精确的占位日期。
          </p>
          <span className="status-stat">以官网与 IEEE RAS 为准</span>
        </article>
      </section>

      <section className="about-ledger">
        <div className="about-ledger-copy">
          <div className="section-kicker">
            <span className="kicker-square" />
            COVERAGE / 覆盖
          </div>
          <h2>一个可被审阅的数据库</h2>
          <p>
            首版聚焦机器人核心会议谱系，覆盖旗舰综合、具身智能、感知导航、操作抓取、人形足式、人机交互、医疗、工业与野外作业。每个会议都保留来源链接与核验日期。
          </p>
          <div className="coverage-stats">
            <div>
              <strong>{conferences.length}</strong>
              <span>场会议</span>
            </div>
            <div>
              <strong>{seriesCount}</strong>
              <span>个系列</span>
            </div>
            <div>
              <strong>{CATEGORIES.length}</strong>
              <span>个方向</span>
            </div>
            <div>
              <strong>{countryCount}</strong>
              <span>个国家 / 地区</span>
            </div>
          </div>
        </div>
        <div className="coverage-list">
          {CATEGORIES.map((category) => (
            <div key={category.id} className="coverage-row">
              <span className="coverage-dot" style={{ background: category.color }} />
              <span>{category.label}</span>
              <span className="coverage-line" />
              <span className="coverage-number">{String(categoryCounts[category.id] ?? 0).padStart(2, '0')}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="about-process">
        <div className="section-kicker">
          <span className="kicker-square" />
          WORKFLOW / 更新流程
        </div>
        <div className="process-grid">
          <article>
            <span className="process-index">01</span>
            <h3>从官方来源采集</h3>
            <p>优先会议官网与 CFP；其次 IEEE RAS 会议页。第三方聚合页只用于发现线索，不作为最终依据。</p>
          </article>
          <article>
            <span className="process-index">02</span>
            <h3>区分日期级别</h3>
            <p>日期、时刻、时区分别记录。官网只给日期时，时刻保持空白并标注“待定”。</p>
          </article>
          <article>
            <span className="process-index">03</span>
            <h3>保留来源与核验日</h3>
            <p>每条会议记录都附带来源链接与最后核验日期，方便你判断信息是否仍然有效。</p>
          </article>
          <article>
            <span className="process-index">04</span>
            <h3>导出前再次提醒</h3>
            <p>ICS 中的预测节点使用 TENTATIVE 状态，并在描述中写明“请以官网为准”。</p>
          </article>
        </div>
      </section>

      <section className="about-download" id="download">
        <div className="download-copy">
          <div className="section-kicker section-kicker--light">
            <span className="kicker-square kicker-square--light" />
            OPEN DATA / 导出
          </div>
          <h2>把这张雷达带走。</h2>
          <p>下载完整数据集，或用 ICS 把节点放进你常用的日历。预测节点会被明确标记。</p>
          <div className="download-actions">
            <button className="button button--acid" onClick={onExportCalendar}>
              <CalendarPlus size={16} />
              导出 ICS 日历
            </button>
            <button className="button button--outline-light" onClick={onExportJSON}>
              <FileJson size={16} />
              JSON
            </button>
            <button className="button button--outline-light" onClick={onExportCSV}>
              <Table2 size={16} />
              CSV
            </button>
          </div>
        </div>
        <div className="download-figure">
          <span>DATASET</span>
          <strong>{String(conferences.length).padStart(2, '0')}</strong>
          <span>CONFERENCE EDITIONS</span>
          <div className="download-bars" aria-hidden="true">
            {Array.from({ length: 20 }, (_, index) => (
              <i key={index} style={{ height: `${20 + ((index * 13) % 62)}%` }} />
            ))}
          </div>
        </div>
      </section>

      <section className="about-sources">
        <div className="sources-head">
          <div>
            <div className="section-kicker">
              <span className="kicker-square" />
              SOURCES / 来源
            </div>
            <h2>数据从哪里来</h2>
          </div>
          <span className="sources-note">打开新标签页查看原始来源</span>
        </div>
        <div className="source-list">
          {SOURCES.map((source, index) => (
            <a key={source.name} href={source.url} target="_blank" rel="noreferrer" className="source-row">
              <span className="source-index">{String(index + 1).padStart(2, '0')}</span>
              <span className="source-main">
                <strong>{source.name}</strong>
                <span>{source.description}</span>
              </span>
              <span className="source-arrow">↗</span>
            </a>
          ))}
        </div>
      </section>

      <section className="about-boundary">
        <div className="boundary-icon">
          <TriangleAlert size={20} />
        </div>
        <div>
          <span className="section-kicker">BOUNDARY / 边界</span>
          <h2>已知的缺口，也说清楚</h2>
          <p>
            CoRL 2027 与 Humanoids 2027 的 CFP 尚未发布；WHC 2027 与 ICDL 2027 的投稿日期为预测窗口；部分会议官网只公布日期未公布时刻。我们不会为了让表格完整而填入虚构的精确值。
          </p>
          <p>
            这份数据库参考了{' '}
            <a href="https://ccfddl.com/" target="_blank" rel="noreferrer">
              ccfddl
            </a>{' '}
            对截止日的组织方式，但界面、分类、论文索引与导出结构为独立实现；事实性数据均回到官方来源核验。
            CCF 档位来自第七版目录；“机程论文梯队”是非官方编辑判断，不等同于 CCF 档位、录用率或单篇论文质量。
          </p>
        </div>
        <button className="button button--ghost" onClick={onBack}>
          <ArrowLeft size={15} />
          回到雷达
        </button>
      </section>

      <section className="about-shortcuts">
        <div className="section-kicker">
          <span className="kicker-square" />
          SHORTCUTS / 快捷键
        </div>
        <div className="shortcut-row">
          <span>
            <kbd>/</kbd> 聚焦搜索
          </span>
          <span>
            <kbd>Esc</kbd> 关闭详情 / 清除搜索
          </span>
          <span>
            <kbd>Enter</kbd> 打开选中卡片
          </span>
        </div>
      </section>

      <footer className="about-footer">
        <span>
          <Database size={13} /> 机程 BOT/CAL
        </span>
        <span>
          <Keyboard size={13} /> Made for robotics researchers
        </span>
        <span>DATA SYNC {DATA_VERSION}</span>
      </footer>
    </div>
  );
}
