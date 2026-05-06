# Skills-B.md · 투자 지표 계산 규칙

Maxi-Sight 분석 파이프라인 Module B — Investment Metrics Calculation


## 목적

Module A에서 정규화된 포트폴리오 JSON을 입력받아, 핵심 투자 지표를 계산한다. 계산 결과는 Module C(시각화), D(인사이트 트리거), E(자연어 번역)의 입력값으로 사용된다.


## 1. CAGR (연평균 성장률 · 성장 에너지)

**정의**: 투자 원금이 현재 가치로 성장하는 데 걸린 연평균 성장률

**공식**:

CAGR = (현재가치 / 초기투자금)^(1 / 보유연수) - 1

**계산 규칙**:

- `현재가치` = 전체 보유 종목의 `current_krw × qty` 합산

- `초기투자금` = 전체 보유 종목의 `cost_krw × qty` 합산

- `보유연수` = (오늘 날짜 - 포트폴리오 최초 매수일) / 365

- 보유 기간 1년 미만 시: CAGR 대신 단순 수익률(%) 표시, 레이블에 `*` 표기

- 결과값은 소수점 둘째 자리까지 반올림 (예: 12.34%)

**출력 필드**: `cagr_pct` (float)


## 2. Sharpe Ratio (위험 대비 수익률 · 투자 가성비)

**정의**: 감수한 위험 한 단위당 얼마나 많은 초과 수익을 얻었는지 측정

**공식**:

Sharpe Ratio = (포트폴리오 수익률 - 무위험수익률) / 포트폴리오 변동성

**계산 규칙**:

- `포트폴리오 수익률` = CAGR 값 사용

- `무위험수익률` = 한국 국채 3년물 기준 (기본 더미값: **3.5%**)

- 실시간 금리 API 연동 시 해당 값으로 자동 대체

- `포트폴리오 변동성` = 섹션 5(일간 변동성) 계산 결과 사용

- 변동성이 0인 경우: `sharpe = null`, `flag: "ZERO_VOLATILITY"` 기록

- 결과값은 소수점 둘째 자리까지 반올림 (예: 1.23)

**출력 필드**: `sharpe_ratio` (float | null)


## 3. MDD (최대 낙폭 · 방어력)

**정의**: 보유 기간 중 고점 대비 최대로 하락한 비율

**공식**:

MDD = (최고점 - 최저점) / 최고점 × 100

**계산 규칙**:

- 전체 보유 기간의 일별 포트폴리오 평가액 시계열 데이터 필요

- `최고점` = 해당 시계열에서의 최댓값

- `최저점` = 최고점 이후 시점의 최솟값 (최고점 이전 저점 제외)

- 일별 데이터 미확보 시: 종목별 52주 고·저가로 근사치 계산, `flag: "APPROX_MDD"` 기록

- 결과값은 양수(%)로 표현 (예: 낙폭 15% → `15.0`)

**출력 필드**: `mdd_pct` (float)


## 4. 포트폴리오 베타 (시장 민감도)

**정의**: 시장(벤치마크) 대비 포트폴리오의 가격 민감도

**공식**:

포트폴리오 베타 = Σ(종목 베타 × 종목 시가총액 비중)

**계산 규칙**:

- 각 종목의 개별 베타는 외부 API에서 조회 (미조회 시 기본값 `1.0` 사용)

- `종목 시가총액 비중` = 해당 종목 `current_krw × qty` / 전체 포트폴리오 평가액

- 현금성 자산(CS), 저축(SV)의 베타는 `0.0`으로 고정

- 가상자산(CR)은 베타 계산 제외 (시장 상관관계 별도 측정)

- 결과값은 소수점 둘째 자리까지 반올림

**출력 필드**: `portfolio_beta` (float)


## 5. 일간 변동성 (연환산 · 스트레스 지수)

**정의**: 포트폴리오 수익률의 일별 변동 정도를 연 단위로 환산

**공식**:

일간 변동성 = 로그 수익률 표준편차 × √250

**계산 규칙**:

- `로그 수익률` = ln(당일 평가액 / 전일 평가액)

- 연환산 계수: 국내 연간 영업일 기준 **250일**

- 가상자산(CR) 포함 포트폴리오는 **365일** 적용 (24시간 거래 자산)

- 최소 30영업일 이상의 데이터 필요 (미달 시 `flag: "INSUFFICIENT_DATA"` 기록)

- 결과값은 퍼센트(%) 형태로 표현 (예: 18.5%)

**출력 필드**: `volatility_annualized_pct` (float)


## 6. 자산군별 비중 계산

**공식**:

자산군 비중(%) = 해당 자산군 평가액 합산 / 전체 포트폴리오 평가액 × 100

**계산 규칙**:

- 자산군 코드(EQ, EQ-F, ET, ET-F, BD, CS, CM, CR, SV) 별로 각각 계산

- 비중의 합산은 100%가 되어야 함 (부동 소수점 오차 허용 범위: ±0.01%)

**출력 필드**: `allocation` (object)

{

"EQ": 0.0, "EQ-F": 0.0, "ET": 0.0, "ET-F": 0.0,

"BD": 0.0, "CS": 0.0, "CM": 0.0, "CR": 0.0, "SV": 0.0

}


## 7. Sortino Ratio (하락장 맷집)

**정의**: 하락 변동성만을 분모로 사용해 하락 위험 대비 수익 효율성을 측정 Sharpe Ratio가 상승·하락 변동을 모두 포함하는 것과 달리, 손실 구간만 반영한다.

**공식**:

Sortino Ratio = (포트폴리오 수익률 - 무위험수익률) / 하락 변동성

**계산 규칙**:

- `하락 변동성` = 수익률이 목표치(기본값: 0%) 미만인 날의 수익률만으로 표준편차 계산

- 무위험수익률 기준은 섹션 2와 동일 (한국 국채 3년물, 기본값 3.5%)

- 하락 데이터가 없는 경우: `sortino = null`, `flag: "NO_DRAWDOWN"` 기록

- 결과값은 소수점 둘째 자리까지 반올림

**출력 필드**: `sortino_ratio` (float | null)

**Sharpe vs Sortino 사용 기준**

- Sharpe: 전체 변동성 기준 종합 효율 평가 → V2 KPI 카드 메인 표시

- Sortino: 하락 구간 집중 평가 → 하락장 진입 시 D-01 트리거 보조 지표로 활용


## 8. 상관관계 매트릭스

**정의**: 보유 종목 간 일간 수익률의 상관계수를 산출하여 분산 투자 효과를 수치화

**공식**:

Correlation(p, q) = Cov(p, q) / (σp × σq)

**계산 규칙**:

- 종목 쌍(pair) 별로 일간 로그 수익률 기준 피어슨 상관계수 계산

- 출력 범위: -1.0 ~ 1.0

- 1.0에 가까울수록: 같은 방향으로 움직임 (분산 효과 낮음)

- -1.0에 가까울수록: 반대 방향으로 움직임 (분산 효과 높음)

- 0에 가까울수록: 독립적으로 움직임 (이상적 분산)

- 보유 종목 수 < 2인 경우: 계산 생략, `flag: "SINGLE_ASSET"` 기록

- 가상자산(CR)은 주식 시장과 다른 거래 시간 → 날짜 기준으로 정렬 후 계산

**출력 필드**: `correlation_matrix` (object, 종목 ticker 쌍을 키로 사용)

{

"005930_AAPL": 0.32,

"005930_SPY": 0.61,

"AAPL_SPY": 0.78,

"BTC_005930": -0.04

}

**Module C 연계**: 상관관계 매트릭스는 V3 보조 히트맵(선택적)으로 시각화


## 9. 배당 수익 추정

**정의**: 보유 종목의 `dividend_yield_pct` 필드를 기반으로 연간·월간 예상 배당금 계산

**공식**:

annual_dividend_krw = Σ(종목 평가액 × dividend_yield_pct / 100)

monthly_dividend_krw = annual_dividend_krw / 12

**계산 규칙**:

- `dividend_yield_pct > 0`인 종목만 포함
- `dividend_items` 배열은 `annual_krw` 내림차순 정렬
- 가상자산(CR)은 배당 계산 제외

**출력 필드**: `dividend` (object)

```json
{
  "annual_dividend_krw": 0,
  "monthly_dividend_krw": 0,
  "dividend_items": [
    { "name": "string", "ticker": "string", "yield_pct": 0.0, "annual_krw": 0, "monthly_krw": 0 }
  ]
}
```

**Module C 연계**: V2 보조 KPI 카드 — 연 배당·월 배당·배당 종목 수로 표시


## 10. 종목별 비중 배열 (V6 트리맵용)

**정의**: 전체 보유 종목을 평가액 기준으로 집계한 배열. 계좌가 다르더라도 동일 ticker는 합산.

**계산 규칙**:

- `ticker`가 같은 항목 합산
- `value` 내림차순 정렬
- `asset_class` 포함 — V6 색상 매핑에 사용

**출력 필드**: `ticker_allocation` (array)

```json
[
  { "name": "string", "ticker": "string", "value": 0, "asset_class": "EQ-F | ..." }
]
```


## 11. 광역 배분 (국내 / 해외)

**정의**: 보유 자산을 국내와 해외로 이분하여 비중 계산

**분류 기준**:

| 구분 | 자산 클래스 |
|---|---|
| 해외 | EQ-F, ET-F, CR, CM |
| 국내 | EQ, ET, BD, CS, SV, UN |

**출력 필드**: `super_allocation` (object)

```json
{ "domestic_pct": 0.0, "overseas_pct": 0.0 }
```


## 12. Module B 출력 스키마

```json
{
  "portfolio_id": "string",
  "calculated_at": "ISO8601 datetime",
  "total_value_krw": 0,
  "total_cost_krw": 0,
  "total_return_pct": 0.0,
  "cagr_pct": 0.0,
  "cagr_is_simple": false,
  "sharpe_ratio": 0.0,
  "sortino_ratio": 0.0,
  "mdd_pct": 0.0,
  "portfolio_beta": 0.0,
  "volatility_annualized_pct": 0.0,
  "allocation": {
    "EQ": 0.0, "EQ-F": 0.0, "ET": 0.0, "ET-F": 0.0,
    "BD": 0.0, "CS": 0.0, "CM": 0.0, "CR": 0.0, "SV": 0.0
  },
  "super_allocation": { "domestic_pct": 0.0, "overseas_pct": 0.0 },
  "ticker_allocation": [
    { "name": "string", "ticker": "string", "value": 0, "asset_class": "string" }
  ],
  "dividend": {
    "annual_dividend_krw": 0,
    "monthly_dividend_krw": 0,
    "dividend_items": []
  },
  "contributions": [
    {
      "id": "string",
      "ticker": "string",
      "name": "string",
      "asset_class": "string",
      "gain_krw": 0,
      "return_pct": 0.0,
      "weight_pct": 0.0
    }
  ],
  "timeline": [
    {
      "date": "M/D",
      "fullDate": "YYYY-MM-DD",
      "portfolio": 0.0,
      "kospi": 0.0,
      "sp500": 0.0
    }
  ],
  "correlation_matrix": {},
  "flags": []
}
```

**필드 설명**

| 필드 | 설명 |
|---|---|
| `cagr_is_simple` | 보유기간 1년 미만 시 `true` — 단순 수익률로 대체됨을 표시 |
| `contributions` | 종목별 수익 기여도 배열. `return_pct` 내림차순 정렬. V4 수평 바 차트 데이터 |
| `timeline` | 252영업일 누적 수익률 시계열. 내 포트폴리오·KOSPI·S&P500 포함. V4 라인 차트 데이터 |
