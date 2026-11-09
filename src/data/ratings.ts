import type { CcfRank, PaperTier, VenueRating } from '../types';

export const CCF_EDITION = '第七版（2026）';
export const CCF_URL = 'https://www.ccf.org.cn/Academic_Evaluation/By_category/';
export const CCF_PDF_URL =
  'https://www.ccf.org.cn/ccf/contentcore/resource/download?ID=112CF3BF7E1140ACEB271ADAED12A67ADFABB8FF099E40C2759502A85C8A281F';
export const CCF_DISCLAIMER =
  'CCF 明确说明：该目录是推荐列表，目的不是作为学术评价依据，不建议任何单位将其简单用于成果评价。';

export const CCF_META: Record<CcfRank | 'none', { label: string; short: string; color: string; description: string }> = {
  A: {
    label: 'CCF A',
    short: 'A',
    color: '#d7ff3f',
    description: 'CCF 第七版推荐目录 A 类。本数据集收录的机器人会议中没有 A 类。',
  },
  B: {
    label: 'CCF B',
    short: 'B',
    color: '#39c6e5',
    description: 'CCF 第七版推荐目录 B 类。本数据集中仅 ICRA 入选（人工智能方向）。',
  },
  C: {
    label: 'CCF C',
    short: 'C',
    color: '#f2b544',
    description: 'CCF 第七版推荐目录 C 类。本数据集中 IROS（人工智能）与 WHC（人机交互）入选。',
  },
  none: {
    label: 'CCF 未列',
    short: '—',
    color: '#9ba398',
    description: '未出现在 CCF 第七版推荐目录中。未列入不等于低质量，RSS、CoRL、HRI 等均为机器人社区核心会议。',
  },
};

export const TIER_META: Record<
  PaperTier,
  {
    label: string;
    short: string;
    color: string;
    weight: number;
    role: string;
    description: string;
  }
> = {
  flagship: {
    label: '旗舰级',
    short: '旗舰',
    color: '#c9ef3b',
    weight: 4,
    role: '冲刺',
    description: '机器人领域综合影响力最高、跨子领域认可度最强的会议，通常作为主投或冲刺目标。',
  },
  first: {
    label: '第一梯队',
    short: '一梯队',
    color: '#39c6e5',
    weight: 3,
    role: '冲刺 / 主投',
    description: '子领域内公认的顶级专门会议，或综合旗舰的高竞争替代。',
  },
  second: {
    label: '第二梯队',
    short: '二梯队',
    color: '#f2b544',
    weight: 2,
    role: '主投 / 稳妥',
    description: '成熟的子领域核心会议，适合作为稳健主投或综合旗舰的备选。',
  },
  special: {
    label: '专题级',
    short: '专题',
    color: '#9ba398',
    weight: 1,
    role: '备选 / 快速交流',
    description: '专题、区域或应用导向会议，适合早期工作、工程论文、学生首篇与快速交流。',
  },
};

export const RATING_MAP: Record<string, VenueRating> = {
  ICRA: {
    ccf: 'B',
    ccfDomain: '人工智能',
    tier: 'flagship',
    difficulty: 5,
    fit: '完整系统 / 强实验 / 机器人平台',
    advice: '适合问题完整、实验链条闭合的工作。若只有单点算法提升，优先考虑子领域专门会议。',
  },
  IROS: {
    ccf: 'C',
    ccfDomain: '人工智能',
    tier: 'flagship',
    difficulty: 5,
    fit: '系统集成 / 应用验证 / 智能系统',
    advice: '与 ICRA 同档，但更看重系统完整性与应用场景；3 月截稿，适合作为春季主投。',
  },
  RSS: {
    ccf: null,
    tier: 'flagship',
    difficulty: 5,
    fit: '科学问题 / 理论洞察 / 可复现系统',
    advice: '两阶段流程要求 Stage 1 就把问题与方法讲清楚；不适合靠补充实验“救”的稿件。',
  },
  CoRL: {
    ccf: null,
    tier: 'first',
    difficulty: 5,
    fit: '机器人学习 / VLA / 强基线 / 真机实验',
    advice: '看重方法新颖性与真实机器人验证；2027 官方日期未出，当前只能按预测窗口排期。',
  },
  HRI: {
    ccf: null,
    tier: 'first',
    difficulty: 4,
    fit: '人因实验 / 交互设计 / 伦理 / 社会机器人',
    advice: '不是“弱化版 ICRA”：需要清晰的人因问题、实验设计与伦理审查；主会已截止，可关注 Late-Breaking。',
  },
  Humanoids: {
    ccf: null,
    tier: 'first',
    difficulty: 4,
    fit: '人形 / 足式硬件 / 全身控制 / 系统集成',
    advice: '适合硬件与控制结合的系统性工作；2027 CFP 尚未发布，7 月截稿为预测。',
  },
  CASE: {
    ccf: null,
    tier: 'first',
    difficulty: 4,
    fit: '工业自动化 / 系统部署 / 应用验证',
    advice: 'RAS 三大旗舰之一，但偏自动化与应用；有真实产线或系统集成证据时性价比高。',
  },
  'RO-MAN': {
    ccf: null,
    tier: 'second',
    difficulty: 3,
    fit: '社会 HRI / 用户研究 / 跨文化交互',
    advice: 'HRI 子领域核心会议；与 HRI 主会形成“春季 HRI、夏季 RO-MAN”的双窗口。',
  },
  ICAR: {
    ccf: null,
    tier: 'second',
    difficulty: 3,
    fit: '先进机器人 / 欧洲社区 / 应用系统',
    advice: '覆盖广、氛围相对友好；适合作为 IROS/ICRA 的备选或欧洲交流窗口。',
  },
  RoboSoft: {
    ccf: null,
    tier: 'second',
    difficulty: 3,
    fit: '软体材料 / 仿生机构 / 柔性传感',
    advice: '软体机器人主场；主论文已截止，Extended Abstract 是晚到的补充通道。',
  },
  ISMR: {
    ccf: null,
    tier: 'second',
    difficulty: 3,
    fit: '医疗机器人 / 临床转化 / 手术与康复',
    advice: '单轨、医学交叉氛围强；适合有临床合作或明确医疗场景的工作。',
  },
  AIM: {
    ccf: null,
    tier: 'second',
    difficulty: 3,
    fit: '机电一体化 / 控制 / 执行器与传感',
    advice: '适合硬件、控制与机电系统结合的工作；CCF 未列，但在机电社区有稳定认可。',
  },
  SII: {
    ccf: null,
    tier: 'second',
    difficulty: 3,
    fit: '系统集成 / 工业 / 跨学科',
    advice: '偏系统与集成，适合工程性强、跨模块的工作；主论文已截止，可关注下一届。',
  },
  WHC: {
    ccf: 'C',
    ccfDomain: '人机交互与普适计算',
    tier: 'second',
    difficulty: 3,
    fit: '触觉 / 可穿戴 / 康复 / 手术触觉',
    advice: '触觉领域最大双年会议；CCF C（人机交互），投稿日期官网尚未公布。',
  },
  ARSO: {
    ccf: null,
    tier: 'special',
    difficulty: 2,
    fit: '社会影响 / 伦理政策 / HRI 应用',
    advice: '适合讨论机器人社会影响、标准与政策的跨学科工作；竞争度相对低。',
  },
  ICARA: {
    ccf: null,
    tier: 'special',
    difficulty: 2,
    fit: '自动化应用 / 工程 / 工业监测',
    advice: '应用导向、周期相对友好；适合工程验证与区域交流。',
  },
  RoMoCo: {
    ccf: null,
    tier: 'special',
    difficulty: 2,
    fit: '运动控制 / 轨迹规划 / 多机器人',
    advice: '专题研讨会，适合控制理论或运动规划的中期工作。',
  },
  ICICR: {
    ccf: null,
    tier: 'special',
    difficulty: 2,
    fit: '智能计算 / 机器人应用',
    advice: '交叉与区域型会议，适合作为快速交流或学生首篇论文。',
  },
  ARIS: {
    ccf: null,
    tier: 'special',
    difficulty: 2,
    fit: '智能系统 / 自主机器人 / 区域社区',
    advice: '亚太区域会议，适合应用展示与建立合作。',
  },
  ICIA: {
    ccf: null,
    tier: 'special',
    difficulty: 2,
    fit: '信息自动化 / 行业应用',
    advice: '行业应用导向，适合系统落地与工程论文。',
  },
  IC2AI: {
    ccf: null,
    tier: 'special',
    difficulty: 2,
    fit: '控制 / 仪器 / 嵌入式',
    advice: '控制与仪器方向的应用会议；适合短周期、工程性工作。',
  },
  ICMRE: {
    ccf: null,
    tier: 'special',
    difficulty: 2,
    fit: '机电工程 / 机器人设计 / 教育',
    advice: '机电与机器人工程教育方向；适合工程设计与教学成果。',
  },
  ICDL: {
    ccf: null,
    tier: 'special',
    difficulty: 2,
    fit: '发展机器人 / 认知科学 / 社会学习',
    advice: '发展机器人与认知交叉的小社区；适合理论/实验并重的探索性工作。',
  },
};


export function getRating(series: string): VenueRating {
  return (
    RATING_MAP[series] ?? {
      ccf: null,
      tier: 'special',
      difficulty: 2,
      fit: '待补充',
      advice: '该会议的评级尚未整理。',
    }
  );
}

export function ccfKey(rank: CcfRank | null): CcfRank | 'none' {
  return rank ?? 'none';
}

export function difficultyLabel(value: number): string {
  switch (value) {
    case 5:
      return '极高';
    case 4:
      return '高';
    case 3:
      return '中高';
    default:
      return '中等';
  }
}
