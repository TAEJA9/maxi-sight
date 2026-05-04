# Skills-A.md · 데이터 표준화 규칙

Maxi-Sight 분석 파이프라인 Module A — Data Normalization


## 목적

다양한 소스(CSV, JSON, API)에서 입력된 포트폴리오 데이터를 분석 가능한 표준 스키마로 변환한다. 이 규칙을 따르면 데이터 소스가 변경되어도 이후 모듈(B~E)은 수정 없이 동작한다.


## 1. 계좌 유형 분류 코드

| 코드 | 계좌 유형 | 설명 | 세금 특이사항 |
|---|---|---|---|
| 01 | ISA | 개인종합자산관리계좌 | 이자·배당 비과세 한도 (200만/400만원) |
| 02 | IRP | 개인형 퇴직연금 | 연금소득세 분리과세, 55세 이후 수령 |
| 03 | GEN | 일반 위탁 (국내) | 배당소득세 15.4%, 매매차익 비과세 |
| 04 | OVS | 해외 주식 (미국 등) | 양도소득세 22% (250만원 초과분) |
| 05 | PEN | 연금저축펀드 및 보험 | 세액공제 연 400만원, 연금소득세 3.3~5.5% |
| 06 | CMA | CMA / 파킹통장 / 외화예금 | 이자소득세 15.4% |
| 07 | CRP | 가상자산 (거래소 및 개인 지갑) | 가상자산 소득세 22% (250만원 초과분) |


## 2. 자산 클래스 코드

| 코드 | 자산 클래스 | 예시 종목 | 기본 통화 |
|---|---|---|---|
| EQ | 국내 주식 | 삼성전자, SK하이닉스, 카카오, POSCO홀딩스 | KRW |
| EQ-F | 해외 주식 | Apple, NVIDIA, Tesla, TSMC, Microsoft | USD |
| ET | 국내 ETF | KODEX200, TIGER 미국S&P500, KODEX 레버리지 | KRW |
| ET-F | 해외 ETF | SPY, QQQ, VTI, SCHD, VOO | USD |
| BD | 채권 | 국채 10년, KODEX 국고채3년, 회사채 ETF | KRW |
| CS | 현금/CMA | CMA, MMF, 예수금, 파킹통장 잔액 | KRW |
| CM | 금/원자재 | KODEX 골드선물, GLD, IAU, 원유 ETF | KRW/USD |
| CR | 가상자산 | BTC, ETH, SOL, XRP | USD → KRW 환산 |
| SV | 저축 | 정기예금, 적금, 청약저축 | KRW |
| UN | 미분류 | 인식 불가 종목 | — |


## 3. 통화 환산 규칙

- **USD → KRW**: `cost_krw = cost_usd × exchange_rate_usd_krw`

- **가상자산(CR)**: 코인별 USD 시세 → KRW 환산

- 환율 적용 우선순위:

1. 실시간 환율 API 연동 시 → API 응답값 사용

2. API 미연동 시 → `exchange_rate_usd_krw` 고정값 (기본값: `1,350`)

4. 환율 기준일을 `rate_date` 필드에 기록

### 자산 클래스별 통화 처리

| 코드 | 기본 통화 | 환산 방법 |
|---|---|---|
| EQ, ET, BD, CS, SV | KRW | 환산 불필요 |
| EQ-F, ET-F | USD | × 환율 |
| CM | KRW 또는 USD | 종목별 확인 후 처리 |
| CR | USD | 코인 USD 시세 × 환율 |
| 06 CMA (외화예금) | USD / JPY 등 | 해당 통화 × 환율 |


## 4. 결측값 및 오류 처리

| 상황 | 처리 방법 |
|---|---|
| 거래내역 누락 | 직전일 종가로 대체 (최대 5영업일) |
| 종가 데이터 없음 | 직전 유효 종가로 대체 |
| 취득단가 누락 | cost_krw = null, flag: "MISSING_COST" |
| 수량 음수 | flag: "INVALID_QTY" |
| 미지원 자산 클래스 | asset_class: "UN" 으로 분류 |
| 코인 시세 미조회 | 직전 유효 시세, flag: "STALE_PRICE" |
| CMA/저축 잔액 미입력 | current_krw = cost_krw (원금 유지 가정) |
| 연금계좌 | tax_deferred: true 플래그 기록 |

5. 오류 플래그가 있는 항목은 분석에는 포함하되, 대시보드 상단에 경고 배너로 표시한다.


## 5. 계좌별 특수 처리 규칙

### ISA (01)

6. 비과세 한도 초과분 분리과세 9.9%

7. ISA 만기 IRP 이전 여부 `isa_to_irp` 필드에 기록

### IRP / 연금저축 (02, 05)

8. `tax_deferred: true` — 과세이연 자산으로 분류

9. 연금 수령 개시 나이 `pension_start_age` 필드 (기본값: 55)

10. 중도 인출 시 기타소득세 16.5% 발생 → 유동성 위험 알림(D-09 연계) 트리거 가능

### 해외 주식/ETF (04, EQ-F, ET-F)

11. 양도소득세 계산을 위해 `purchase_date` 및 `cost_usd` 필드 필수

12. 연간 양도소득 250만원 초과 여부 Module B에서 별도 계산

### CMA / 외화예금 (06)

13. 이자 수익 `interest_krw` 필드로 별도 기록

14. ```
current_krw = cost_krw + interest_krw
외화예금은 `currency` 필드에 실제 통화 코드 기록 (예: `"JPY"`, `"EUR"`)

```
### 가상자산 (07, CR)

16. 취득단가: 매수 당시 원화 환산 금액 기준 (FIFO 원칙)

17. `coin_symbol` 필드 필수 (예: `"BTC"`, `"ETH"`)

18. `exchange_name` 필드 (예: `"업비트"`, `"바이낸스"`, `"개인 지갑"`)

19. 24시간 거래 자산 — 수익률 타임라인에서 주말 데이터 포함 처리

### 저축 (SV)

20. 만기일 `maturity_date` 필드 기록

21. `current_krw = cost_krw + 발생이자` (단리 계산)

22. 청약저축은 `sub_type: "SUBSCRIPTION"` 필드로 구분


## 6. 다중 소스 통합 규칙

### 입력 가능 형식

23. **CSV**: 헤더 행 필수. 컬럼명 자동 매핑 (아래 매핑 테이블 참조)

24. **JSON**: 배열 또는 단일 객체 모두 허용

25. **API 응답**: REST JSON 응답, 중첩 객체는 flatten 처리

### CSV 컬럼 자동 매핑 테이블

| 입력 컬럼명 (허용 변형) | 표준 필드 |
|---|---|
| ticker, 종목코드, symbol, 코인심볼 | ticker |
| name, 종목명, 자산명, coin_name | name |
| qty, quantity, 수량, 보유수량, 코인수량 | qty |
| cost, 취득단가, avg_cost, 매수단가 | cost_krw |
| current, 현재가, price, 현재시세 | current_krw |
| account, 계좌, account_type, 계좌유형 | account_type |
| class, 자산분류, asset_type, 자산클래스 | asset_class |
| date, 매수일, purchase_date, 취득일 | purchase_date |
| exchange, 거래소, exchange_name | exchange_name |


## 7. 표준 출력 스키마

모든 데이터는 아래 JSON 스키마로 정규화하여 Module B로 전달한다.

{

"portfolio_id": "string",

"generated_at": "ISO8601 datetime",

"exchange_rate_usd_krw": 1350,

"rate_date": "YYYY-MM-DD",

"holdings": [

{

"id": "string (UUID)",

"ticker": "string",

"name": "string",

"asset_class": "EQ | EQ-F | ET | ET-F | BD | CS | CM | CR | SV | UN",

"account_type": "01 | 02 | 03 | 04 | 05 | 06 | 07",

"qty": 0,

"cost_krw": 0,

"current_krw": 0,

"purchase_date": "YYYY-MM-DD",

"currency": "KRW | USD | JPY | EUR | ...",

"tax_deferred": false,

"coin_symbol": null,

"exchange_name": null,

"interest_krw": 0,

"maturity_date": null,

"sub_type": null,

"flag": "OK | MISSING_COST | INVALID_QTY | STALE_PRICE"

}

]

}


## 8. 검증 체크리스트

Module B 진입 전 아래 항목을 모두 통과해야 한다.

1. 모든 `ticker` 값이 비어 있지 않음

2. 모든 `current_krw` 값이 0 이상의 숫자

3. `asset_class` 가 허용 코드 목록에 포함됨

4. `account_type` 이 허용 코드 목록에 포함됨

5. USD 자산에 `exchange_rate_usd_krw` 값이 존재함

6. CR(가상자산) 항목에 `coin_symbol` 이 존재함

7. 전체 보유 종목 수 ≥ 1
