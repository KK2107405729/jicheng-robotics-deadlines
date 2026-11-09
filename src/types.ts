export type CategoryId =
  | 'flagship'
  | 'embodied'
  | 'perception'
  | 'manipulation'
  | 'humanoids'
  | 'hri'
  | 'multi'
  | 'medical'
  | 'industrial'
  | 'field'
  | 'soft';

export type Confidence = 'confirmed' | 'estimated';

export type MilestoneKind =
  | 'abstract'
  | 'paper'
  | 'extended-abstract'
  | 'special-session'
  | 'workshop'
  | 'late-breaking'
  | 'supplementary'
  | 'rebuttal'
  | 'notification'
  | 'camera-ready'
  | 'registration';

export type Region = '亚洲' | '欧洲' | '北美' | '其他' | '待公布';

export type CcfRank = 'A' | 'B' | 'C';

export type PaperTier = 'flagship' | 'first' | 'second' | 'special';

export interface VenueRating {
  ccf: CcfRank | null;
  ccfDomain?: '人工智能' | '人机交互与普适计算';
  tier: PaperTier;
  difficulty: 2 | 3 | 4 | 5;
  fit: string;
  advice: string;
}

export type Publisher = 'ieee' | 'acm' | 'openreview' | 'pmlr' | 'rss' | 'unknown';

export interface Category {
  id: CategoryId;
  label: string;
  en: string;
  color: string;
  description: string;
}

export interface Deadline {
  kind: MilestoneKind;
  label: string;
  date: string;
  displayDate?: string;
  time?: string;
  timezone?: string;
  utcOffset?: string;
  confidence: Confidence;
  note?: string;
}

export interface ConferenceLocation {
  city: string;
  country: string;
  countryCn: string;
  flag: string;
  region: Region;
  venue?: string;
}

export interface Conference {
  id: string;
  series: string;
  edition: number;
  fullName: string;
  chineseName: string;
  categories: CategoryId[];
  location: ConferenceLocation | null;
  startDate: string | null;
  endDate: string | null;
  format: '线下' | '混合' | '线上' | '待公布';
  website: string;
  websiteLabel?: string;
  submissionUrl: string;
  submissionLabel?: string;
  dblpKey?: string;
  publisher: Publisher;
  proceedingsUrl?: string;
  openreviewUrl?: string;
  deadlines: Deadline[];
  summary: string;
  tags: string[];
  sources: { label: string; url: string }[];
  lastVerified: string;
  dateStatus: 'confirmed' | 'partial' | 'tba';
  successorId?: string;
  note?: string;
  featured?: boolean;
}

export type View = 'radar' | 'strategy' | 'calendar' | 'papers' | 'about';

export type SortMode = 'deadline' | 'conference' | 'name';
export type TimeFilter = 'all' | 'next30' | 'next90' | 'next180' | 'closed' | 'tba';
