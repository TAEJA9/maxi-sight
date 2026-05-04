# Maxi-Sight 🚀

> **MaxItOut 팀**의 개인 투자 포트폴리오 대시보드

[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://vercel.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://reactjs.org)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite)](https://vitejs.dev)

---

## 📊 주요 기능

### 페르소나 스위처
상단 탭에서 **송유진 · 김정연 · 한예지** 중 선택 → 전체 대시보드 실시간 전환

### V1 · 종합 잔고 허브
- 총 자산 KRW/USD 병렬 표시
- 계좌별 소계 (ISA / IRP / 일반 위탁 / 해외 주식 / CMA / 가상자산)
- 접이식 Accordion · 과세이연 🔒 배지

### V2 · 3대 핵심 지표 카드
- **CAGR** (성장 스피드계), **Sharpe** (투자 가성비), **MDD** (내구도 테스트)
- 색상 기준: 초록(우수) / 노랑(주의) / 빨강(위험)
- 이지가이드 팝업: 금융 용어 쉬운 설명

### V3 · 포트폴리오 배분 차트
- Recharts 도넛 차트 · 중앙 총 자산 표시
- 자산군 8종 색상 범례 (국내주식 / 해외주식 / ETF / 채권 / 현금 / 가상자산 등)

### V4 · 수익률 타임라인
- 내 포트폴리오 vs KOSPI vs S&P 500 라인 차트
- 기간 선택: 1M / 3M / 6M / 1Y / 전체
- 종목별 수익 기여도 수평 바 차트

### V5 · AI 인사이트 피드
- Skills-D.md 트리거 자동 평가 (D-01~D-09)
- 위험/리밸런싱/기회/집중위험/정보 유형별 색상 카드
- **송유진**: TSLA 뉴스 경보(D-09) 자동 생성
- **김정연**: ISA/IRP 절세 칭찬 카드 자동 생성

---

## 🧮 금융 지표 계산 (Skills-B.md 완전 준수)

| 지표 | 공식 | 설명 |
|------|------|------|
| CAGR | `(현재가치/초기투자금)^(1/보유연수) - 1` | 연평균 성장률 |
| Sharpe | `(CAGR - 무위험수익률) / 변동성` | 위험 대비 수익 효율 |
| MDD | `(고점 - 저점) / 고점 × 100` | 최대 낙폭 |
| Sortino | `(CAGR - 무위험수익률) / 하락변동성` | 하락장 맷집 |
| Beta | `Σ(종목베타 × 비중)` | 시장 민감도 |
| 변동성 | `σ(log수익률) × √250` | 연환산 스트레스 지수 |

- 무위험수익률: **한국 국채 3년물 3.5%** (Skills-B §2)
- 가상자산 포함 시 연환산 계수: **365일** (Skills-B §5)

---

## 🚀 시작하기

### 사전 요구사항
- [Node.js](https://nodejs.org/) v18+ 설치

### 설치 및 실행

```bash
# 저장소 클론
git clone https://github.com/your-org/maxi-sight.git
cd maxi-sight

# 패키지 설치
npm install

# 개발 서버 실행
npm run dev
```

브라우저에서 `http://localhost:5173` 열기

### 빌드

```bash
npm run build
```

---

## 📦 기술 스택

| 기술 | 버전 | 용도 |
|------|------|------|
| React | 18 | UI 프레임워크 |
| Vite | 5 | 빌드 도구 |
| Tailwind CSS | 3 | 스타일링 |
| Recharts | 2 | 차트 시각화 |
| Lucide React | 0.344 | 아이콘 |

---

## 🌐 Vercel 배포

1. GitHub에 이 저장소 push
2. [vercel.com](https://vercel.com) → **New Project** → GitHub 저장소 선택
3. 자동 감지: Framework = **Vite** / Build = `npm run build` / Output = `dist`
4. **Deploy** 클릭

---

## 📁 프로젝트 구조

```
maxi-sight/
├── src/
│   ├── modules/
│   │   ├── moduleA.js    # 데이터 정규화 (Skills-A)
│   │   ├── moduleB.js    # 금융 지표 계산 (Skills-B)
│   │   ├── moduleD.js    # 인사이트 트리거 (Skills-D)
│   │   └── moduleE.js    # 자연어 번역 (Skills-E)
│   ├── components/
│   │   ├── V1BalanceHub.jsx      # 종합 잔고 허브
│   │   ├── V2KPICards.jsx        # 핵심 지표 카드
│   │   ├── V3AllocationChart.jsx # 자산 배분 차트
│   │   ├── V4Timeline.jsx        # 수익률 타임라인
│   │   ├── V5InsightFeed.jsx     # AI 인사이트 피드
│   │   └── shared.jsx            # 공통 컴포넌트
│   ├── App.jsx           # 메인 앱 (페르소나 스위처)
│   ├── main.jsx          # React 진입점
│   └── index.css         # 글로벌 스타일 (Apple 다크 테마)
├── portfolio.json         # 포트폴리오 데이터
├── skills.md/             # 설계 명세 (A~E)
├── vercel.json            # Vercel 배포 설정
└── package.json
```

---

## 📜 라이선스

MIT © MaxItOut Team 2026
