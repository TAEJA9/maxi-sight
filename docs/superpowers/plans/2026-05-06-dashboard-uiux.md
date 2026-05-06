# Dashboard UI/UX 개선 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Skills-A~E 기준 미구현 9개 항목(목표 배분 비교, 수평 바 차트, 뉴스 감성 배지, 상관관계 히트맵, 툴팁 초과수익, 오류 배너, ISA 한도, 스켈레톤 UI, 우선순위 정렬)을 3단계로 구현한다.

**Architecture:** 데이터 계산은 모두 `src/modules/`에서 처리하고 컴포넌트는 props를 받아 렌더링만 한다. 상태는 `App.jsx`에서 단일 관리하며 `sentimentScores`가 신규 추가된다. 목표 배분은 `src/config.js` 상수 + `localStorage` 오버라이드 방식으로 처리한다.

**Tech Stack:** React 18, Recharts 2, Tailwind CSS 3, Vite 5, Gemini API (geminiClient.js)

---

## 파일 변경 지도

| 파일 | 역할 |
|------|------|
| `src/config.js` (**신규**) | 기본 목표 배분 상수, ISA 한도 상수 |
| `src/modules/moduleB.js` | `calcAssetClassCorrelation()` 추가, `calculateMetrics()` 반환값에 `asset_class_correlation` 추가 |
| `src/modules/moduleD.js` | `pinned: true` 필드, 정렬 보강, `sentimentScores` 반환 |
| `src/modules/moduleE.js` | 뉴스 감성 색상/레이블 상수 추가 |
| `src/modules/geminiClient.js` | `sentiment_scores` 파싱 추가 |
| `src/components/V3AllocationChart.jsx` | `TargetComparisonLegend` 교체, `CorrelationHeatmap` 추가 |
| `src/components/V4Timeline.jsx` | `ContributionBars` 수평 바 교체, 툴팁 초과수익 |
| `src/components/V2KPICards.jsx` | `SentimentCard` 4번째 카드 추가 |
| `src/components/V5InsightFeed.jsx` | 스켈레톤 카드, HIGH 핀 아이콘 |
| `src/components/V1BalanceHub.jsx` | ISA 비과세 잔여 표시 |
| `src/App.jsx` | `FlagBanner` 컴포넌트, `sentimentScores` state |

---

## Task 1: config.js — 기본 목표 배분 + ISA 상수

**Files:**
- Create: `src/config.js`

- [ ] **Step 1: config.js 생성**

```js
// src/config.js

// 기본 목표 배분 (%) — localStorage 'maxi_target_allocation' 로 오버라이드 가능
export const DEFAULT_TARGET_ALLOCATION = {
  'EQ':   30,
  'EQ-F': 15,
  'ET':   10,
  'ET-F': 25,
  'BD':   10,
  'CS':   10,
  'CM':    0,
  'CR':    0,
  'SV':    0,
};

// ISA 비과세 한도 (원)
export const ISA_TAX_FREE_LIMIT = 2_000_000;

// 목표 배분 이탈 경고 기준 (%p)
export const ALLOCATION_WARN_THRESHOLD = 5;

/** localStorage에서 목표 배분 읽기, 없으면 기본값 반환 */
export function getTargetAllocation() {
  try {
    const saved = localStorage.getItem('maxi_target_allocation');
    if (saved) return { ...DEFAULT_TARGET_ALLOCATION, ...JSON.parse(saved) };
  } catch {}
  return { ...DEFAULT_TARGET_ALLOCATION };
}
```

- [ ] **Step 2: 브라우저에서 동작 확인**

`npm run dev` 실행 후 콘솔에서:
```js
import('/src/config.js').then(m => console.log(m.getTargetAllocation()))
```
Expected: `{ EQ: 30, 'EQ-F': 15, ET: 10, 'ET-F': 25, BD: 10, CS: 10, CM: 0, CR: 0, SV: 0 }`

- [ ] **Step 3: 커밋**

```bash
git add src/config.js
git commit -m "feat: 기본 목표 배분·ISA 상수 config.js 추가"
```

---

## Task 2: moduleE.js — 뉴스 감성 상수 추가

**Files:**
- Modify: `src/modules/moduleE.js`

- [ ] **Step 1: 감성 색상/레이블 상수 추가**

`moduleE.js` 파일 끝에 아래 코드 추가:

```js
// 뉴스 감성 점수 → 레이블/색상 매핑 (Skills-D §1 D-09)
export const SENTIMENT_CONFIG = {
  positive: { label: '긍정', color: '#34d399', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.30)' },
  neutral:  { label: '중립', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.25)' },
  negative: { label: '부정', color: '#c084fc', bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.30)' },
};

/** 감성 점수(-1~1) → 'positive' | 'neutral' | 'negative' */
export function sentimentKey(score) {
  if (score == null) return 'neutral';
  if (score >= 0.5)  return 'positive';
  if (score <= -0.5) return 'negative';
  return 'neutral';
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/modules/moduleE.js
git commit -m "feat: moduleE 뉴스 감성 색상/레이블 상수 추가"
```

---

## Task 3: moduleD.js — pinned 필드 + 정렬 보강 + sentimentScores 반환

**Files:**
- Modify: `src/modules/moduleD.js`

- [ ] **Step 1: generateInsights() — HIGH 카드에 pinned 추가**

`generateInsights()` 함수에서 sort 이후 insights 생성 부분을 아래로 교체:

```js
  // 기존 코드 (sort, deduplicate) 아래 timestamps 부분을 교체
  return insights.map((ins, i) => ({
    ...ins,
    pinned: ins.priority === 'HIGH',
    generated_at: new Date(Date.now() - i * 3000).toISOString(),
    source: 'Gemini AI',
  }));
```

- [ ] **Step 2: getSimulatedSentimentScores() 함수 추가**

`triggerD09` 함수 아래에 추가:

```js
/**
 * 보유 종목별 시뮬레이션 감성 점수 반환
 * Gemini 미연동 시 fallback으로 사용
 * @returns {Object} { [ticker]: score(-1~1) }
 */
export function getSimulatedSentimentScores(holdings, ownerName) {
  const presets = {
    '송유진': { 'TSLA': -0.7, 'TQQQ': 0.3, 'SOL': -0.2, '305540': -0.4 },
    '한예지': { 'NVDA': 0.8,  'AAPL': 0.5, 'SCHD': 0.2 },
    '박민수': { '005930': -0.3 },
    '김정연': {},
  };
  const base = presets[ownerName] ?? {};
  const scores = {};
  holdings.forEach(h => {
    scores[h.ticker] = base[h.ticker] ?? 0.0;
  });
  return scores;
}
```

- [ ] **Step 3: generateInsightsWithAI() — sentimentScores 반환하도록 수정**

`generateInsightsWithAI()` 함수 전체를 아래로 교체:

```js
export async function generateInsightsWithAI(metrics, normalizedPortfolio) {
  const baseCards = generateInsights(metrics, normalizedPortfolio);
  const triggered = baseCards.filter(c => c.trigger_id !== 'DEFAULT');

  // Gemini 미연동 시 룰 기반 + 시뮬레이션 감성 반환
  if (triggered.length === 0) {
    return {
      cards: baseCards,
      sentimentScores: getSimulatedSentimentScores(
        normalizedPortfolio.holdings,
        normalizedPortfolio.owner_name,
      ),
    };
  }

  const triggeredItems = triggered.map(c => ({
    trigger_id: c.trigger_id,
    type: c.type,
    title: c.title,
    priority: c.priority,
    context: getTriggerContext(c, metrics),
  }));

  const metricsSnapshot = {
    owner_name: normalizedPortfolio.owner_name,
    style: normalizedPortfolio.style,
    total_value_krw: metrics.total_value_krw,
    total_return_pct: metrics.total_return_pct,
    cagr_pct: metrics.cagr_pct,
    sharpe_ratio: metrics.sharpe_ratio,
    mdd_pct: metrics.mdd_pct,
    volatility_annualized_pct: metrics.volatility_annualized_pct,
  };

  const aiResult = await callGeminiInsights(triggeredItems, metricsSnapshot);

  const simulatedScores = getSimulatedSentimentScores(
    normalizedPortfolio.holdings,
    normalizedPortfolio.owner_name,
  );

  if (!aiResult) {
    return { cards: baseCards, sentimentScores: simulatedScores };
  }

  const { cards: aiCards, sentimentScores: aiScores } = aiResult;
  const sentimentScores = aiScores ?? simulatedScores;

  const aiMap = {};
  (aiCards ?? []).forEach(c => { aiMap[c.trigger_id] = c; });

  const cards = baseCards.map((card, i) => {
    const ai = aiMap[card.trigger_id];
    if (!ai) return card;
    return {
      ...card,
      title: ai.title || card.title,
      body: ai.body || card.body,
      generated_at: new Date(Date.now() - i * 60000 * 15).toISOString(),
      source: 'Gemini AI',
      ai_generated: true,
    };
  });

  return { cards, sentimentScores };
}
```

- [ ] **Step 4: 커밋**

```bash
git add src/modules/moduleD.js
git commit -m "feat: moduleD pinned 필드, 정렬 보강, sentimentScores 반환"
```

---

## Task 4: geminiClient.js — sentiment_scores 파싱 추가

**Files:**
- Modify: `src/modules/geminiClient.js`

- [ ] **Step 1: callGeminiInsights() 반환 타입 변경**

`SYSTEM_RULES` 상수에서 `[출력 규칙]` 섹션을 아래로 교체:

```js
const SYSTEM_RULES = `[역할]
당신은 Maxi-Sight 개인 투자 대시보드의 AI 분석 엔진입니다.

[문체 규칙 - Skills-E §6]
- 종결어미: ~요, ~어요, ~해요, ~이에요 만 사용
- 사용 금지: ~습니다, ~합니다
- 금융 전문 용어는 괄호 안에 한글 설명 병기 (예: MDD(최대 낙폭))
- 한 문장 최대 40자 이내
- 공포 조장 없이 중립적·격려적 어조 유지

[출력 규칙 - Skills-D §7]
- 아래 JSON 구조만 반환. 마크다운 코드블록 없이.
{
  "cards": [{"trigger_id":"D-01","type":"위험 알림","title":"제목","body":"본문","priority":"HIGH"}],
  "sentiment_scores": {"TSLA": 0.7, "SOL": -0.3}
}
- sentiment_scores: 보유 종목 ticker 키, -1.0~1.0 값. 뉴스 분석 기반.`;
```

- [ ] **Step 2: 파싱 로직 수정**

`callGeminiInsights` 함수 내 파싱 부분(`const parsed = JSON.parse(clean)` 이후)을 교체:

```js
      const parsed = JSON.parse(clean);

      // 새 포맷 { cards, sentiment_scores } 또는 구 포맷 Array 모두 처리
      const cards = Array.isArray(parsed) ? parsed : (parsed.cards ?? []);
      const sentimentScores = Array.isArray(parsed) ? null : (parsed.sentiment_scores ?? null);

      if (Array.isArray(cards)) {
        console.info(`[Gemini] ${config.model}(${config.version}) 성공 — ${cards.length}개 카드`);
        return { cards, sentimentScores };
      }
```

- [ ] **Step 3: 커밋**

```bash
git add src/modules/geminiClient.js
git commit -m "feat: geminiClient sentiment_scores 파싱 추가"
```

---

## Task 5: moduleB.js — 자산군 상관관계 계산 추가

**Files:**
- Modify: `src/modules/moduleB.js`

- [ ] **Step 1: pearson() + calcAssetClassCorrelation() 추가**

`calcPortfolioReturns` 함수 아래에 추가:

```js
/** 피어슨 상관계수 계산 */
function pearson(xs, ys) {
  const n = xs.length;
  if (n < 2) return 0;
  const mx = xs.reduce((s, x) => s + x, 0) / n;
  const my = ys.reduce((s, y) => s + y, 0) / n;
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) {
    const xi = xs[i] - mx, yi = ys[i] - my;
    num += xi * yi; dx += xi * xi; dy += yi * yi;
  }
  const denom = Math.sqrt(dx * dy);
  return denom === 0 ? 0 : parseFloat((num / denom).toFixed(2));
}

/**
 * 자산군 단위 상관관계 매트릭스 (Skills-B §8 확장)
 * @returns {{ classes: string[], matrix: Object }}
 *   matrix 키 형식: "EQ:ET-F" → 상관계수
 */
export function calcAssetClassCorrelation(normalizedPortfolio, rand = Math.random) {
  const { holdings } = normalizedPortfolio;
  const DAYS = 252;
  const totalValue = holdings.reduce((s, h) => s + h.total_current_krw, 0);
  if (totalValue === 0) return { classes: [], matrix: {} };

  // 자산군별 가중 일간 수익률 시계열 생성
  const groupReturns = {};
  holdings.forEach(h => {
    const weight = h.total_current_krw / totalValue;
    const ret = generateSimulatedReturns(h, DAYS, rand);
    if (!groupReturns[h.asset_class]) groupReturns[h.asset_class] = Array(DAYS).fill(0);
    ret.forEach((r, i) => { groupReturns[h.asset_class][i] += weight * r; });
  });

  const classes = Object.keys(groupReturns);
  if (classes.length < 2) return { classes, matrix: {} };

  const matrix = {};
  for (let i = 0; i < classes.length; i++) {
    for (let j = 0; j < classes.length; j++) {
      const a = classes[i], b = classes[j];
      if (i === j) { matrix[`${a}:${b}`] = 1.0; continue; }
      const key = `${a}:${b}`, rev = `${b}:${a}`;
      matrix[key] = matrix[rev] !== undefined ? matrix[rev] : pearson(groupReturns[a], groupReturns[b]);
    }
  }
  return { classes, matrix };
}
```

- [ ] **Step 2: calculateMetrics() 반환값에 asset_class_correlation 추가**

`calculateMetrics()` 함수 내 return 객체에 추가:

```js
  const assetClassCorrelation = calcAssetClassCorrelation(normalizedPortfolio, rand);

  return {
    // ... 기존 필드들 ...
    asset_class_correlation: assetClassCorrelation,
  };
```

- [ ] **Step 3: 브라우저 콘솔에서 확인**

`npm run dev` 후 React DevTools 또는 콘솔에서 `metrics.asset_class_correlation` 확인:
Expected: `{ classes: ['EQ', 'ET', 'CR', ...], matrix: { 'EQ:ET': 0.45, ... } }`

- [ ] **Step 4: 커밋**

```bash
git add src/modules/moduleB.js
git commit -m "feat: moduleB 자산군별 상관관계 매트릭스 계산 추가"
```

---

## Task 6: App.jsx — sentimentScores state + FlagBanner

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: sentimentScores state 추가 + generateInsightsWithAI 응답 처리**

`App.jsx`에서 insights state 선언 아래에 추가:

```js
  const [sentimentScores, setSentimentScores] = useState({});
```

`useEffect` 내 `.then(cards => {` 부분을 `.then(result => {` 로 변경:

```js
  useEffect(() => {
    setIsInsightsLoading(true);
    setInsights(generateInsights(metrics, normalized));
    generateInsightsWithAI(metrics, normalized)
      .then(result => {
        setInsights(result.cards);
        setSentimentScores(result.sentimentScores ?? {});
        setIsInsightsLoading(false);
      })
      .catch(() => {
        setIsInsightsLoading(false);
      });
  }, [activeId, refreshKey]);
```

- [ ] **Step 2: FlagBanner 컴포넌트 추가**

> **주의**: `metrics.flags`는 계산 수준 문자열 배열(APPROX_MDD 등). 배너에는 보유 종목별
> 데이터 플래그(MISSING_COST/STALE_PRICE/INVALID_QTY)를 표시해야 하므로
> `normalizedPortfolio.holdings`에서 직접 필터링한다.

`PersonaInfoBar` 컴포넌트 정의 바로 위에 추가:

```jsx
const FLAG_LABELS = {
  MISSING_COST: '취득단가 없음',
  STALE_PRICE:  '시세 지연',
  INVALID_QTY:  '수량 오류',
};

function FlagBanner({ holdings }) {
  const [dismissed, setDismissed] = useState(false);
  const flagged = (holdings ?? []).filter(h => h.flag && h.flag !== 'OK');
  if (!flagged.length || dismissed) return null;

  const items = flagged.slice(0, 3)
    .map(h => `${h.name ?? h.ticker} (${FLAG_LABELS[h.flag] ?? h.flag})`)
    .join(' · ');

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 mb-4 rounded-xl
                    bg-amber-500/10 border border-amber-500/30 text-sm animate-fade-in">
      <span className="text-base flex-shrink-0">⚠️</span>
      <p className="flex-1 text-amber-300">
        <span className="font-semibold">{flagged.length}개 항목에 데이터 경고가 있어요</span>
        <span className="text-amber-400/70 ml-2 text-xs">
          {items}{flagged.length > 3 ? ` 외 ${flagged.length - 3}개` : ''}
        </span>
      </p>
      <button
        onClick={() => setDismissed(true)}
        className="text-xs text-amber-400/50 hover:text-amber-300 border border-amber-500/20
                   px-2 py-0.5 rounded-md transition-colors flex-shrink-0"
      >
        닫기
      </button>
    </div>
  );
}
```

- [ ] **Step 3: FlagBanner를 PersonaInfoBar 아래에 삽입, V2KPICards에 sentimentScores 전달**

`main` 내 PersonaInfoBar 아래:

```jsx
        <PersonaInfoBar portfolio={normalized} metrics={metrics} />
        <FlagBanner holdings={normalized.holdings} />
```

V2KPICards에 prop 추가:

```jsx
          <V2KPICards metrics={metrics} sentimentScores={sentimentScores} />
```

- [ ] **Step 4: 브라우저에서 확인**

`metrics.flags`에 항목이 있는 페르소나 선택 후 노란 배너 표시 확인.
닫기 클릭 → 배너 사라짐 확인.

- [ ] **Step 5: 커밋**

```bash
git add src/App.jsx
git commit -m "feat: FlagBanner 컴포넌트, sentimentScores state 추가"
```

---

## Task 7: V3AllocationChart.jsx — 목표 배분 바 범례 교체

**Files:**
- Modify: `src/components/V3AllocationChart.jsx`

- [ ] **Step 1: import 추가**

파일 상단 import에 추가:

```js
import { getTargetAllocation, ALLOCATION_WARN_THRESHOLD } from '../config.js';
import { ASSET_CLASSES } from '../modules/moduleA.js';
```

- [ ] **Step 2: CustomLegend를 TargetComparisonLegend로 교체**

기존 `function CustomLegend` 전체를 삭제하고 아래로 교체:

```jsx
function TargetComparisonLegend({ data }) {
  const targets = getTargetAllocation();

  return (
    <div className="mt-4 pt-4 border-t border-[var(--border)] space-y-1.5">
      <div className="flex justify-between text-[10px] text-[var(--text-muted)] mb-2 px-0.5">
        <span>현재 비중</span>
        <span>점선 = 목표</span>
      </div>
      {data.map(item => {
        const target = targets[item.cls] ?? 0;
        const diff = parseFloat((item.value - target).toFixed(1));
        const isWarn = Math.abs(diff) > ALLOCATION_WARN_THRESHOLD;
        const maxPct = Math.max(item.value, target, 1);

        return (
          <div
            key={item.cls}
            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] transition-colors ${
              isWarn
                ? 'bg-red-500/[0.06] border border-red-500/20'
                : 'border border-transparent'
            }`}
          >
            <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: item.color }} />
            <span className="w-14 text-[var(--text-secondary)] flex-shrink-0 truncate">{item.label}</span>

            {/* 바 트랙 */}
            <div className="flex-1 h-[6px] rounded-full relative" style={{ background: 'rgba(255,255,255,0.07)' }}>
              {/* 현재 비중 — 실선 */}
              <div
                className="absolute top-0 left-0 h-full rounded-full"
                style={{ width: `${(item.value / maxPct) * 100}%`, background: item.color }}
              />
              {/* 목표 비중 — 점선 테두리 */}
              {target > 0 && (
                <div
                  className="absolute top-0 left-0 h-full rounded-full border"
                  style={{
                    width: `${(target / maxPct) * 100}%`,
                    borderColor: item.color,
                    opacity: 0.5,
                    borderStyle: 'dashed',
                    background: 'transparent',
                  }}
                />
              )}
            </div>

            <span className="w-8 text-right font-bold flex-shrink-0" style={{ color: item.color }}>
              {item.value.toFixed(1)}%
            </span>

            {/* diff 배지 */}
            <span className={`text-[9px] font-bold px-1 py-0.5 rounded-full flex-shrink-0 ${
              isWarn
                ? 'bg-red-500/20 text-red-400'
                : 'bg-[var(--border)] text-[var(--text-muted)]'
            }`}>
              {isWarn ? '⚠' : ''}{diff > 0 ? '+' : ''}{diff}
            </span>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: 컴포넌트 내 사용처 변경**

`V3AllocationChart` return 내 `<CustomLegend data={data} />` → `<TargetComparisonLegend data={data} />`

- [ ] **Step 4: 브라우저에서 확인**

실행 후 V3 카드 하단에 바 비교 범례 표시 확인. 목표 대비 ±5%p 초과 항목에 빨간 배경 확인.

- [ ] **Step 5: 커밋**

```bash
git add src/components/V3AllocationChart.jsx
git commit -m "feat: V3 목표 배분 비교 바 범례 교체"
```

---

## Task 8: V3AllocationChart.jsx — 상관관계 히트맵 추가

**Files:**
- Modify: `src/components/V3AllocationChart.jsx`

- [ ] **Step 1: CorrelationHeatmap 컴포넌트 추가**

`TargetComparisonLegend` 아래에 추가:

```jsx
const CORR_COLORS = [
  [0.0,  '#3b82f6'], // -1.0 파랑
  [0.5,  '#1e293b'], // 0.0 중립 (어두운 배경)
  [1.0,  '#ef4444'], // +1.0 빨강
];

function corrColor(val) {
  // val: -1 ~ 1 → t: 0 ~ 1
  const t = (val + 1) / 2;
  if (t <= 0.5) {
    const u = t / 0.5;
    return blendHex('#3b82f6', '#1e293b', u);
  } else {
    const u = (t - 0.5) / 0.5;
    return blendHex('#1e293b', '#ef4444', u);
  }
}

function blendHex(from, to, t) {
  const f = parseInt(from.slice(1), 16);
  const tgt = parseInt(to.slice(1), 16);
  const r = Math.round(((f >> 16) & 255) * (1 - t) + ((tgt >> 16) & 255) * t);
  const g = Math.round(((f >> 8)  & 255) * (1 - t) + ((tgt >> 8)  & 255) * t);
  const b = Math.round(((f)       & 255) * (1 - t) + ((tgt)       & 255) * t);
  return `rgb(${r},${g},${b})`;
}

function CorrelationHeatmap({ correlation }) {
  const { classes, matrix } = correlation ?? {};
  if (!classes || classes.length < 2) return null;

  const labels = classes.map(c => ASSET_CLASSES[c]?.label ?? c);

  return (
    <div className="glass-card p-5 mt-0 animate-fade-in-up">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">자산군 상관관계</h2>
        <span className="text-[10px] text-[var(--text-muted)]">따로국밥 지수</span>
      </div>

      <div className="overflow-x-auto">
        <table className="text-[10px] border-separate" style={{ borderSpacing: 3 }}>
          <thead>
            <tr>
              <td className="w-12" />
              {classes.map((c, i) => (
                <td key={c} className="text-center text-[var(--text-muted)] pb-1" style={{ minWidth: 36 }}>
                  {labels[i]}
                </td>
              ))}
            </tr>
          </thead>
          <tbody>
            {classes.map((a, i) => (
              <tr key={a}>
                <td className="text-right pr-2 text-[var(--text-muted)] whitespace-nowrap">{labels[i]}</td>
                {classes.map(b => {
                  const val = matrix[`${a}:${b}`] ?? matrix[`${b}:${a}`] ?? 0;
                  const bg = corrColor(val);
                  const textColor = Math.abs(val) > 0.5 ? '#fff' : '#aaa';
                  return (
                    <td
                      key={b}
                      className="text-center font-bold rounded"
                      style={{ background: bg, color: textColor, height: 28, minWidth: 36 }}
                    >
                      {val.toFixed(2)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2 mt-3 text-[10px] text-[var(--text-muted)]">
        <span style={{ color: '#3b82f6' }}>-1.0 반대 방향</span>
        <div className="flex-1 h-1.5 rounded-full"
          style={{ background: 'linear-gradient(90deg,#3b82f6,#1e293b,#ef4444)' }} />
        <span style={{ color: '#ef4444' }}>+1.0 같은 방향</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: V3AllocationChart return을 Fragment로 교체**

`V3AllocationChart` 함수 전체 return 블록을 아래로 교체:

```jsx
export function V3AllocationChart({ metrics }) {
  const { allocation, total_value_krw, asset_class_correlation } = metrics;
  // ... (기존 data 계산 로직 그대로) ...
  const [activeIdx, setActiveIdx] = useState(null);
  const activeItem = activeIdx !== null ? data[activeIdx] : null;

  return (
    <>
      <div className="glass-card p-6 animate-fade-in-up">
        {/* 기존 SectionHeader, PieChart, 중앙 표시 코드 그대로 유지 */}
        <TargetComparisonLegend data={data} />
      </div>
      <CorrelationHeatmap correlation={asset_class_correlation} />
    </>
  );
}
```

- [ ] **Step 3: 브라우저에서 확인**

V3 카드 아래 상관관계 테이블 표시 확인. 자산군 1개 페르소나(한예지 등)에서 히트맵 미표시 확인.

- [ ] **Step 4: 커밋**

```bash
git add src/components/V3AllocationChart.jsx
git commit -m "feat: V3 자산군 상관관계 히트맵 추가"
```

---

## Task 9: V4Timeline.jsx — 수평 바 차트 교체 + 툴팁 초과수익

**Files:**
- Modify: `src/components/V4Timeline.jsx`

- [ ] **Step 1: ChartTooltip에 초과수익 행 추가**

기존 `ChartTooltip` 함수 전체를 교체:

```jsx
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  const portfolio = payload.find(p => p.dataKey === 'portfolio');
  const kospi     = payload.find(p => p.dataKey === 'kospi');
  const excess    = portfolio && kospi
    ? parseFloat((portfolio.value - kospi.value).toFixed(2))
    : null;

  return (
    <div className="custom-tooltip">
      <p className="text-xs text-[var(--text-muted)] mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-[var(--text-muted)]">{p.name}</span>
          <span className="font-semibold ml-auto" style={{ color: p.color }}>
            {p.value >= 0 ? '+' : ''}{p.value?.toFixed(2)}%
          </span>
        </div>
      ))}
      {excess !== null && (
        <>
          <div className="h-px bg-[var(--border)] my-1.5" />
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[var(--text-muted)]">KOSPI 대비 초과수익</span>
            <span className={`font-bold ${excess >= 0 ? 'text-red-400' : 'text-blue-400'}`}>
              {excess >= 0 ? '+' : ''}{excess}%p
            </span>
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: ContributionBars 컴포넌트 추가**

`V4Timeline` 함수 위에 추가:

```jsx
function ContributionBars({ contributions }) {
  const items = (contributions ?? []).slice(0, 6);
  if (!items.length) return null;

  const maxAbs = Math.max(...items.map(h => Math.abs(h.return_pct ?? 0)), 1);

  return (
    <div className="glass-card p-5 animate-fade-in-up">
      <SectionHeader title="종목별 수익 기여도" subtitle="취득단가 대비 수익률 순" />
      <div className="mt-2 space-y-2">
        {items.map((h, idx) => {
          const pct   = h.return_pct ?? 0;
          const isPos = pct >= 0;
          const barW  = `${Math.round((Math.abs(pct) / maxAbs) * 100)}%`;
          const color = isPos ? '#ef4444' : '#3b82f6';
          const sign  = isPos ? '+' : '';

          return (
            <div key={h.id} className="flex items-center gap-2">
              {/* 순위 */}
              <span className="w-5 text-[10px] font-bold text-[var(--text-muted)] text-center flex-shrink-0">
                {idx + 1}
              </span>
              {/* 종목명 */}
              <span className="w-20 text-xs text-[var(--text-secondary)] truncate flex-shrink-0" title={h.name}>
                {h.name}
              </span>
              {/* 바 */}
              <div className="flex-1 h-5 rounded relative overflow-hidden"
                   style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div
                  className="h-full rounded flex items-center pl-2"
                  style={{
                    width: barW,
                    background: `linear-gradient(90deg,${color}60,${color})`,
                    minWidth: 4,
                  }}
                >
                  {parseFloat(barW) > 20 && (
                    <span className="text-[9px] font-bold text-white/90">{h.ticker}</span>
                  )}
                </div>
              </div>
              {/* 수익률 */}
              <span className="w-14 text-xs font-bold text-right flex-shrink-0"
                    style={{ color }}>
                {sign}{pct.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: V4Timeline 내 Holdings Contribution List 섹션 교체**

기존 `{/* Holdings Contribution List */}` 블록 전체(`<div className="glass-card p-5 ...">...</div>`)를 삭제하고:

```jsx
      <ContributionBars contributions={contributions} />
```

- [ ] **Step 4: 브라우저에서 확인**

수평 바 차트 표시 확인. 라인 차트 호버 시 툴팁에 "KOSPI 대비 초과수익" 행 표시 확인.

- [ ] **Step 5: 커밋**

```bash
git add src/components/V4Timeline.jsx
git commit -m "feat: V4 수평 바 차트, 툴팁 초과수익 추가"
```

---

## Task 10: V2KPICards.jsx — 뉴스 감성 카드 추가

**Files:**
- Modify: `src/components/V2KPICards.jsx`

- [ ] **Step 1: import 추가**

```js
import { SENTIMENT_CONFIG, sentimentKey } from '../modules/moduleE.js';
```

- [ ] **Step 2: SentimentCard 컴포넌트 추가**

`SecondaryKPI` 함수 아래에 추가:

```jsx
function SentimentCard({ sentimentScores }) {
  const tickers = Object.keys(sentimentScores ?? {});
  if (!tickers.length) return null;

  // 포트폴리오 전체 단순 평균
  const avg = tickers.reduce((s, t) => s + (sentimentScores[t] ?? 0), 0) / tickers.length;
  const key = sentimentKey(avg);
  const cfg = SENTIMENT_CONFIG[key];

  // 종목별 방향 아이콘
  const tickerIcons = tickers.slice(0, 4).map(ticker => {
    const score = sentimentScores[ticker] ?? 0;
    const k = sentimentKey(score);
    const arrow = k === 'positive' ? '↑' : k === 'negative' ? '↓' : '–';
    const color = SENTIMENT_CONFIG[k].color;
    return { ticker, arrow, color };
  });

  return (
    <div
      className="glass-card p-4 flex flex-col gap-1"
      style={{ borderColor: cfg.border, background: cfg.bg }}
    >
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider">
          뉴스 감성
        </span>
        <span className="text-[9px] text-[var(--text-muted)]">Gemini</span>
      </div>

      <div className="flex items-center gap-1.5">
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full border"
          style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}
        >
          ● {cfg.label}
        </span>
      </div>

      <div className="flex gap-2 mt-1 flex-wrap">
        {tickerIcons.map(({ ticker, arrow, color }) => (
          <span key={ticker} className="text-[10px]" style={{ color }}>
            {ticker} {arrow}
          </span>
        ))}
      </div>

      <p className="text-[10px] text-[var(--text-muted)] mt-0.5">종목 온도계</p>
    </div>
  );
}
```

- [ ] **Step 3: V2KPICards props + 보조 지표 그리드에 SentimentCard 추가**

함수 시그니처 변경:
```jsx
export function V2KPICards({ metrics, sentimentScores }) {
```

보조 지표 grid 교체:
```jsx
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SecondaryKPI label="Sortino" guideKey="Sortino"
          value={sortino_ratio != null ? sortino_ratio.toFixed(2) : '—'}
          sub="하락장 맷집" />
        <SecondaryKPI label="베타" guideKey="베타"
          value={portfolio_beta != null ? portfolio_beta.toFixed(2) : '—'}
          sub="시장 민감도" />
        <SecondaryKPI label="변동성" guideKey="변동성"
          value={volatility_annualized_pct != null ? `${volatility_annualized_pct.toFixed(1)}%` : '—'}
          sub="연환산 스트레스" />
        {Object.keys(sentimentScores ?? {}).length > 0 && (
          <SentimentCard sentimentScores={sentimentScores} />
        )}
      </div>
```

- [ ] **Step 4: 브라우저에서 확인**

뉴스 감성 카드 표시 확인 (송유진: 부정 보라, 한예지: 긍정 초록 예상).
`sentimentScores`가 빈 객체일 때 카드 미표시 확인.

- [ ] **Step 5: 커밋**

```bash
git add src/components/V2KPICards.jsx
git commit -m "feat: V2 뉴스 감성 4번째 카드 추가"
```

---

## Task 11: V5InsightFeed.jsx — 스켈레톤 + HIGH 핀 아이콘

**Files:**
- Modify: `src/components/V5InsightFeed.jsx`
- Modify: `src/components/shared.jsx` (shimmer CSS 확인용)

- [ ] **Step 1: shimmer 애니메이션 CSS 확인**

`index.html` 또는 전역 CSS 파일에서 `.skeleton` 클래스 확인. 없으면 `src/index.css`에 추가:

```css
.skeleton {
  background: linear-gradient(
    90deg,
    rgba(255,255,255,0.06) 25%,
    rgba(255,255,255,0.10) 50%,
    rgba(255,255,255,0.06) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

- [ ] **Step 2: InsightCard에 핀 아이콘 추가**

`InsightCard` 함수 내 제목 옆에 조건부 핀 표시:

```jsx
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className="text-sm font-bold text-[var(--text-primary)]">{insight.title}</span>
              {insight.pinned && (
                <span className="text-[10px] text-red-400">📌</span>
              )}
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${priority.cls}`}>
                {priority.label}
              </span>
```

- [ ] **Step 3: V5InsightFeed 로딩 중 스켈레톤 표시**

`V5InsightFeed` 함수 내 카드 목록 부분에서 로딩 상태 교체:

```jsx
      {filtered.length === 0 && isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="rounded-xl border border-white/[0.06] p-4 animate-fade-in-up"
                 style={{ animationDelay: `${i * 80}ms` }}>
              <div className="skeleton h-3 w-24 rounded mb-3" />
              <div className="skeleton h-4 w-48 rounded mb-2" />
              <div className="skeleton h-3 w-full rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
```

- [ ] **Step 4: 브라우저에서 확인**

페이지 새로고침 직후 V5 피드에 shimmer 스켈레톤 3개 표시 확인 (약 1~2초).
HIGH 카드에 📌 아이콘 표시 확인.

- [ ] **Step 5: 커밋**

```bash
git add src/components/V5InsightFeed.jsx src/index.css
git commit -m "feat: V5 스켈레톤 UI, HIGH 핀 아이콘 추가"
```

---

## Task 12: V1BalanceHub.jsx — ISA 비과세 한도 잔여

**Files:**
- Modify: `src/components/V1BalanceHub.jsx`

- [ ] **Step 1: import 추가**

```js
import { ISA_TAX_FREE_LIMIT } from '../config.js';
import { formatKRW } from '../modules/moduleA.js';
```

- [ ] **Step 2: IsaLimitBar 컴포넌트 추가**

`V1BalanceHub` 함수 위에 추가:

```jsx
function IsaLimitBar({ group }) {
  if (group.code !== '01') return null;

  const usedInterest = group.holdings.reduce((s, h) => s + (h.interest_krw ?? 0), 0);
  const remaining = Math.max(0, ISA_TAX_FREE_LIMIT - usedInterest);
  const usedPct   = Math.min(100, (usedInterest / ISA_TAX_FREE_LIMIT) * 100);
  const isOver    = remaining === 0;

  return (
    <div className={`flex items-center gap-2 mx-3 mb-2 px-3 py-2 rounded-lg text-[11px] ${
      isOver
        ? 'bg-red-500/10 border border-red-500/25'
        : 'bg-emerald-500/07 border border-emerald-500/20'
    }`}>
      <span className={`font-semibold flex-shrink-0 ${isOver ? 'text-red-400' : 'text-emerald-400'}`}>
        {isOver ? '⚠ 한도 초과' : '비과세 잔여'}
      </span>
      {!isOver && (
        <>
          <div className="flex-1 h-1.5 rounded-full overflow-hidden"
               style={{ background: 'rgba(255,255,255,0.07)' }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${100 - usedPct}%`,
                background: 'linear-gradient(90deg,#10b981,#34d399)',
              }}
            />
          </div>
          <span className="text-emerald-400 font-bold flex-shrink-0">
            {formatKRW(remaining)}
          </span>
          <span className="text-[var(--text-muted)] flex-shrink-0">/ {formatKRW(ISA_TAX_FREE_LIMIT)}</span>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 3: 아코디언 펼침 시 IsaLimitBar 삽입**

`V1BalanceHub` 내 `{isExpanded && (` 블록 전체를 아래로 교체:

```jsx
                {isExpanded && (
                  <div className="animate-fade-in">
                    <IsaLimitBar group={group} />
                    <div className="bg-[var(--bg-secondary)] px-3 pb-3">
                      {group.holdings.map(h => {
                        // ... 기존 holding 렌더링 코드 그대로 ...
                      })}
                    </div>
                  </div>
                )}

- [ ] **Step 4: 브라우저에서 확인**

ISA 계좌(01) 아코디언 펼침 → "비과세 잔여 200만원 / 200만원" (이자 0 기준) 표시 확인.
ISA 계좌 없는 페르소나에서 미표시 확인.

- [ ] **Step 5: 커밋**

```bash
git add src/components/V1BalanceHub.jsx
git commit -m "feat: V1 ISA 비과세 한도 잔여 표시"
```

---

## 최종 검증

- [ ] `npm run build` 빌드 오류 없음 확인
- [ ] `npm run lint` lint 경고 0개 확인
- [ ] 4개 페르소나(송유진/김정연/한예지/박민수) 전환하며 전체 기능 동작 확인
- [ ] 모바일 뷰(375px) 레이아웃 깨짐 없음 확인

```bash
git tag v1.1.0-uiux
```
