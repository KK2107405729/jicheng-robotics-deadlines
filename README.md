# 机程 BOT/CAL

> 机器人学术会议的投稿雷达。把下一个截稿日，变成坐标。

**在线站点：** [https://kk2107405729.github.io/jicheng-robotics-deadlines/](https://kk2107405729.github.io/jicheng-robotics-deadlines/)

机程是一个面向机器人研究者的会议截止日期数据库与 Web 应用。它把 ICRA、IROS、RSS、CoRL、HRI、CASE、RO-MAN、Humanoids 等会议的**投稿日期、会期、地点、投稿入口、论文索引、数据来源**收进同一张可筛选的时间地图。

参考了 [ccfddl](https://ccfddl.com/) 对截止日的组织方式，但界面、研究方向分类、论文索引与导出结构为独立实现，数据事实回到会议官网 / IEEE RAS 逐条核验。

## 关键结论

- 按 CCF 第七版（2026），本数据集**没有 CCF A**；ICRA 为 CCF B，IROS 与 WHC 为 CCF C，其余系列未列入。
- RSS、CoRL、HRI 在机器人社区是一线会议，但均未进入 CCF 第七版目录。因此机程把“CCF 档位”和“论文梯队”分开显示，避免把目录缺席误读为质量不足。
- 投稿策略页提供“学术声望 / CCF 指标 / 方向匹配 / 最快窗口”四种目标下的候选组合，以及冲 / 稳 / 保和截稿压力分析。

## 当前内容

- **26 场会议 / 23 个系列**：2027 年为主，含 ICRA 2028、CASE 2028、RoboSoft 2028 等下一届节点。
- **11 个研究方向**：旗舰综合、具身智能、感知导航、操作抓取、人形足式、人机交互、多机系统、医疗康复、工业自动化、野外作业、软体机构。
- **三种日期状态**：官方核验、预测窗口、等待公布。
- **完整节点时间线**：摘要、论文、Late-Breaking、录用通知、Camera-ready、会议举行等。
- **论文入口**：DBLP 全系列索引、出版方（IEEE Xplore / ACM DL / PMLR / RSS Proceedings / OpenReview）、Google Scholar。
- **CCF 评级**：按 CCF 第七版（2026）标注 A/B/C/未列入；机器人领域在目录中的覆盖非常有限。
- **论文梯队**：机程编辑维护的旗舰级 / 第一梯队 / 第二梯队 / 专题级，非官方指标。
- **投稿策略**：按研究方向、目标与可用时间生成候选组合，并提供冲 / 稳 / 保与截稿压力分析。
- **导出**：`.ics` 日历、`.csv`、`.json`；预测节点写入 `TENTATIVE`，导出中包含 CCF 与梯队字段。

## 运行

需要 Node.js 20+ 与 pnpm。

```bash
pnpm install
pnpm dev
```

打开终端输出的本地地址。生产构建：

```bash
pnpm check
pnpm build
pnpm preview
```

`dist/` 是纯静态产物（`vite.config.ts` 使用 `base: './'`），可部署到任意静态托管。

## 数据更新

会议数据在 [`src/data/conferences.ts`](src/data/conferences.ts)；CCF 档位、论文梯队、竞争度与投稿建议在 [`src/data/ratings.ts`](src/data/ratings.ts)。

新增一场会议时，至少填写：

```ts
{
  id: 'icra-2027',
  series: 'ICRA',
  edition: 2027,
  fullName: '...',
  chineseName: '...',
  categories: ['flagship', 'manipulation'],
  location: { city: 'Seoul', country: 'South Korea', countryCn: '韩国', flag: '🇰🇷', region: '亚洲' },
  startDate: '2027-05-24',
  endDate: '2027-05-28',
  format: '线下',
  website: 'https://...',
  submissionUrl: 'https://...',
  dblpKey: 'icra',
  publisher: 'ieee',
  deadlines: [
    {
      kind: 'paper',
      label: '论文截稿',
      date: '2026-09-16',
      time: '23:59',
      timezone: 'PST (UTC−8)',
      utcOffset: '-08:00',
      confidence: 'confirmed',
    },
  ],
  summary: '...',
  tags: ['SLAM', '操作'],
  sources: [{ label: '官方 CFP', url: 'https://...' }],
  lastVerified: '2026-11-10',
  dateStatus: 'confirmed',
}
```

约定：

1. **只写官网明确给出的日期。** 官网只有日期没有时刻时，不补 `time`。
2. **预测必须标 `estimated`**，并用 `displayDate` 表示窗口（例如“5 月下旬”），同时写清楚推断依据。
3. 每条记录保留 `sources` 与 `lastVerified`。
4. 修改后运行 `pnpm check` 与 `pnpm links`。`pnpm links` 会检查数据文件中的所有外链；Cloudflare 拦截可能显示 403，需要人工确认。

评级约定：

- `ratings.ts` 的 `ccf` 只填写 CCF 官方目录中明确出现的档位；未出现时写 `null`，界面显示“CCF 未列”。
- `tier` 是机程编辑判断，不是 CCF 档位、录用率或单篇论文质量。
- `difficulty` 是 2–5 的主观竞争度估计，必须与 `fit`、`advice` 一起阅读。
- CCF 第七版中本数据集的收录情况：ICRA = B（人工智能），IROS = C（人工智能），WHC = C（人机交互与普适计算）；其余系列未列入。

## 目录

```text
src/
  data/conferences.ts     会议数据、分类、数据版本
  data/ratings.ts         CCF 档位、论文梯队、竞争度与投稿建议
  lib/date.ts             日期、时区、排序、日历计算
  lib/links.ts            DBLP / 出版方 / Scholar / ICS / CSV / JSON
  components/             各页面与抽屉
  styles.css              设计系统与响应式样式
scripts/
  check-links.mjs         外链检查
  publish-pages.sh        构建并发布到 gh-pages
preview/
  home.png                首页预览
  ratings.png             评级筛选与会议卡片
  strategy.png            投稿策略与 CCF / 梯队对照
  calendar.png            日历预览
  papers.png              论文索引预览
  mobile.png              移动端预览
```

## 数据边界

- CoRL 2027 与 Humanoids 2027 的 CFP 尚未发布，截止日为**推断窗口**。
- WHC 2027 与 ICDL 2027 的会期来自 IEEE RAS，投稿日为**推断窗口**。
- IEEE RAS 页面只给日期、不给出具体时刻时，卡片会显示“时刻待定”。
- 会议日期可能被主办方延期或修改。投稿前请以官网为准。
- CCF 目录明确说明其目的是推荐，不宜简单作为学术评价依据；机程不把 CCF 未列入等同于低质量。
- 论文梯队来自编辑判断，会随社区变化调整。

## 评级来源

- CCF 目录页面：[CCF 推荐国际学术会议和期刊目录](https://www.ccf.org.cn/Academic_Evaluation/By_category/)
- 官方 PDF：第七版《中国计算机学会推荐国际学术会议和期刊目录》（2026）
- 论文梯队：机程编辑部基于社区能见度、历史口碑、竞争度与子领域代表性判断，非官方排名。

## 部署到 GitHub Pages

当前站点通过 **`gh-pages` 分支**发布，构建产物在 [`preview`](preview) 之外的 `dist/` 中生成，不提交到 `main`。

更新线上站点：

```bash
pnpm build
./scripts/publish-pages.sh
```

脚本会重新构建、把 `dist/` 复制到临时目录，并强制推送到 `gh-pages` 分支。GitHub Pages 已配置为从 `gh-pages` 的根目录发布。

站点地址：

`https://kk2107405729.github.io/jicheng-robotics-deadlines/`

## 设计

- 深绿控制台 + 酸性黄绿信号色 + 暖纸色内容区。
- 左侧固定导航、雷达式下一节点卡、可横向滚动的截稿信号带。
- 桌面双列卡片、移动端单列；抽屉式会议详情。
- 不依赖远程字体或 CDN，字体与图标均打包在本地。
