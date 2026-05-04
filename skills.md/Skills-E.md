<!-----



Conversion time: 3.837 seconds.


Using this Markdown file:

1. Paste this output into your source file.
2. See the notes and action items below regarding this conversion run.
3. Check the rendered output (headings, lists, code blocks, tables) for proper
   formatting and use a linkchecker before you publish this page.

Conversion notes:

* Docs™ to Markdown version 2.0β2
* Sun May 03 2026 23:43:22 GMT-0700 (미 태평양 하계 표준시)
* Source doc: Skills-E.md
* Tables are currently converted to HTML tables.
----->



# Skills-E.md · 자연어 번역 매핑


    Maxi-Sight 분석 파이프라인 Module E — Natural Language Translation


---


## 목적

금융 전문 용어와 수치를 개인 투자자가 즉시 이해할 수 있는 일상 언어로 번역하는 규칙을 정의한다. 이 파일을 수정하는 것만으로, 코드 변경 없이 대시보드 전체의 번역 문구가 즉시 업데이트된다.


---


## 1. KPI 카드 번역 문구 (V2 뷰 하단 한 줄)


### CAGR (연평균 성장률 · 성장 에너지)


<table>
  <tr>
   <td><strong>조건</strong>
   </td>
   <td><strong>표시 문구</strong>
   </td>
  </tr>
  <tr>
   <td>CAGR ≥ 15%
   </td>
   <td>"내 돈이 빠르게 자라고 있어요! 🚀"
   </td>
  </tr>
  <tr>
   <td>10% ≤ CAGR &lt; 15%
   </td>
   <td>"꾸준히 잘 성장하고 있어요 📈"
   </td>
  </tr>
  <tr>
   <td>7% ≤ CAGR &lt; 10%
   </td>
   <td>"안정적인 성장 속도예요"
   </td>
  </tr>
  <tr>
   <td>3% ≤ CAGR &lt; 7%
   </td>
   <td>"성장은 하고 있지만, 속도를 높여볼 수 있어요"
   </td>
  </tr>
  <tr>
   <td>0% ≤ CAGR &lt; 3%
   </td>
   <td>"거의 제자리예요. 전략 점검을 추천해요"
   </td>
  </tr>
  <tr>
   <td>CAGR &lt; 0%
   </td>
   <td>"원금이 줄고 있어요. 점검이 필요해요 ⚠️"
   </td>
  </tr>
  <tr>
   <td>데이터 부족(1년 미만)
   </td>
   <td>"아직 성장 속도를 측정하기엔 기간이 짧아요"
   </td>
  </tr>
</table>



### Sharpe Ratio (위험 대비 수익률 · 투자 가성비)


<table>
  <tr>
   <td><strong>조건</strong>
   </td>
   <td><strong>표시 문구</strong>
   </td>
  </tr>
  <tr>
   <td>Sharpe > 1.5
   </td>
   <td>"위험 대비 수익이 탁월해요! 최상급 효율이에요 🏅"
   </td>
  </tr>
  <tr>
   <td>1.0 &lt; Sharpe ≤ 1.5
   </td>
   <td>"효율 좋은 투자 중이에요! 유지하세요"
   </td>
  </tr>
  <tr>
   <td>0.5 &lt; Sharpe ≤ 1.0
   </td>
   <td>"괜찮은 투자를 하고 있어요"
   </td>
  </tr>
  <tr>
   <td>0 &lt; Sharpe ≤ 0.5
   </td>
   <td>"위험 대비 수익이 아직 아쉬워요"
   </td>
  </tr>
  <tr>
   <td>Sharpe ≤ 0
   </td>
   <td>"감수하는 위험만큼 수익이 나오지 않고 있어요"
   </td>
  </tr>
  <tr>
   <td>null
   </td>
   <td>"변동성 데이터 부족으로 계산할 수 없어요"
   </td>
  </tr>
</table>



### MDD (최대 낙폭 · 방어력)


<table>
  <tr>
   <td><strong>조건</strong>
   </td>
   <td><strong>표시 문구</strong>
   </td>
  </tr>
  <tr>
   <td>MDD &lt; 5%
   </td>
   <td>"방어력이 튼튼해요 🛡️"
   </td>
  </tr>
  <tr>
   <td>5% ≤ MDD &lt; 10%
   </td>
   <td>"약간의 출렁임이 있어요, 주시하세요"
   </td>
  </tr>
  <tr>
   <td>10% ≤ MDD &lt; 15%
   </td>
   <td>"제법 흔들렸어요. 리스크 점검을 추천해요"
   </td>
  </tr>
  <tr>
   <td>15% ≤ MDD &lt; 25%
   </td>
   <td>"큰 하락을 경험했어요 — 리스크 점검이 필요해요"
   </td>
  </tr>
  <tr>
   <td>MDD ≥ 25%
   </td>
   <td>"심각한 낙폭이에요. 포트폴리오 재검토를 권장해요 🚨"
   </td>
  </tr>
</table>



---


## 2. 이지가이드 용어 번역 테이블

대시보드 내 모든 금융 용어에 마우스 오버 / 탭 시 팝업으로 표시되는 설명이다.


<table>
  <tr>
   <td><strong>금융 용어</strong>
   </td>
   <td><strong>이지가이드 설명</strong>
   </td>
   <td><strong>보조 설명 (선택 표시)</strong>
   </td>
  </tr>
  <tr>
   <td>CAGR
   </td>
   <td>내 돈이 1년에 평균 몇 % 자랐는지 — 성장 스피드계
   </td>
   <td>복리로 계산하기 때문에 단순 수익률보다 정확해요
   </td>
  </tr>
  <tr>
   <td>Sharpe Ratio
   </td>
   <td>위험을 감수하고 수익을 얼마나 잘 챙겼는지 — 투자 가성비
   </td>
   <td>높을수록 같은 위험으로 더 많이 벌었다는 뜻이에요
   </td>
  </tr>
  <tr>
   <td>MDD
   </td>
   <td>가장 많이 떨어졌을 때 얼마나 깨졌는지 — 내구도 테스트
   </td>
   <td>낮을수록 하락장에서 잘 버틴다는 뜻이에요
   </td>
  </tr>
  <tr>
   <td>변동성
   </td>
   <td>내 자산이 얼마나 롤러코스터처럼 움직이는지 — 스트레스 지수
   </td>
   <td>높을수록 가격이 크게 오르내린다는 뜻이에요
   </td>
  </tr>
  <tr>
   <td>리밸런싱
   </td>
   <td>흔들린 비중을 원래대로 되돌리는 포트폴리오 정리정돈
   </td>
   <td>주기적으로 하면 위험을 일정하게 유지할 수 있어요
   </td>
  </tr>
  <tr>
   <td>베타
   </td>
   <td>시장이 움직일 때 내 포트폴리오가 얼마나 따라 움직이는지 — 민감도
   </td>
   <td>1이면 시장과 똑같이, 0.5면 절반만 움직여요
   </td>
  </tr>
  <tr>
   <td>포트폴리오
   </td>
   <td>내가 보유한 모든 투자 자산의 모음
   </td>
   <td>주식, ETF, 채권 등을 한데 묶어 부르는 말이에요
   </td>
  </tr>
  <tr>
   <td>ETF
   </td>
   <td>주식처럼 사고팔 수 있는 펀드 묶음 상품
   </td>
   <td>여러 종목을 한 번에 사는 효과가 있어요
   </td>
  </tr>
  <tr>
   <td>ISA
   </td>
   <td>세금 혜택이 있는 개인종합자산관리계좌
   </td>
   <td>일정 기간 유지하면 이자·배당 소득세를 줄일 수 있어요
   </td>
  </tr>
  <tr>
   <td>IRP
   </td>
   <td>퇴직금을 쌓고 세액공제 혜택을 받는 퇴직연금계좌
   </td>
   <td>55세 이후 연금으로 받을 수 있어요
   </td>
  </tr>
  <tr>
   <td>수익률
   </td>
   <td>투자한 원금 대비 현재까지 얼마나 벌었는지 비율
   </td>
   <td>(현재가 - 원금) ÷ 원금 × 100으로 계산해요
   </td>
  </tr>
  <tr>
   <td>자산 배분
   </td>
   <td>주식, 채권, 현금 등을 나눠서 투자하는 비율
   </td>
   <td>달걀을 여러 바구니에 나눠 담는 것과 같은 원리예요
   </td>
  </tr>
  <tr>
   <td>무위험수익률
   </td>
   <td>위험이 거의 없는 투자에서 얻는 기본 수익률 기준선
   </td>
   <td>국채 금리를 기준으로 삼아요
   </td>
  </tr>
  <tr>
   <td>벤치마크
   </td>
   <td>내 투자 성과를 비교할 기준 지수
   </td>
   <td>코스피나 S&P 500을 많이 사용해요
   </td>
  </tr>
  <tr>
   <td>초과수익
   </td>
   <td>벤치마크 지수보다 더 많이 번 수익
   </td>
   <td>시장 평균을 이겼다는 뜻이에요
   </td>
  </tr>
</table>



---


## 3. 알림 피드 문구 템플릿

V5 피드에서 Gemini가 생성한 본문 앞에 붙는 아이콘과 레이블 문구.


<table>
  <tr>
   <td><strong>트리거 유형</strong>
   </td>
   <td><strong>아이콘</strong>
   </td>
   <td><strong>레이블</strong>
   </td>
  </tr>
  <tr>
   <td>위험 알림
   </td>
   <td>⚠️
   </td>
   <td>주의가 필요해요
   </td>
  </tr>
  <tr>
   <td>리밸런싱 알림
   </td>
   <td>🔄
   </td>
   <td>정리할 때가 됐어요
   </td>
  </tr>
  <tr>
   <td>기회 신호
   </td>
   <td>✅
   </td>
   <td>좋은 신호예요
   </td>
  </tr>
  <tr>
   <td>집중 위험
   </td>
   <td>📍
   </td>
   <td>분산을 고려해 보세요
   </td>
  </tr>
  <tr>
   <td>변동성 경보
   </td>
   <td>📈
   </td>
   <td>시장이 흔들리고 있어요
   </td>
  </tr>
  <tr>
   <td>정보 알림
   </td>
   <td>💡
   </td>
   <td>알아두면 좋아요
   </td>
  </tr>
</table>



---


## 4. 수치 표시 포맷 규칙


<table>
  <tr>
   <td><strong>데이터 유형</strong>
   </td>
   <td><strong>표시 형식</strong>
   </td>
   <td><strong>예시</strong>
   </td>
  </tr>
  <tr>
   <td>원화 금액
   </td>
   <td>N,NNN원 (백만 이상: N,NNN만원)
   </td>
   <td>1,234만원
   </td>
  </tr>
  <tr>
   <td>달러 금액
   </td>
   <td>$N,NNN.NN
   </td>
   <td>$9,183.40
   </td>
  </tr>
  <tr>
   <td>수익률/비율
   </td>
   <td>+N.NN% / -N.NN% (부호 포함)
   </td>
   <td>+12.34%
   </td>
  </tr>
  <tr>
   <td>Sharpe Ratio
   </td>
   <td>소수점 둘째 자리
   </td>
   <td>1.23
   </td>
  </tr>
  <tr>
   <td>MDD
   </td>
   <td>N.N% (양수만)
   </td>
   <td>8.5%
   </td>
  </tr>
  <tr>
   <td>날짜
   </td>
   <td>YYYY.MM.DD
   </td>
   <td>2024.03.15
   </td>
  </tr>
  <tr>
   <td>기간
   </td>
   <td>N년 N개월
   </td>
   <td>2년 3개월
   </td>
  </tr>
</table>



---


## 5. 빈 상태(Empty State) 문구

데이터가 없거나 계산 불가 시 표시되는 안내 문구.


<table>
  <tr>
   <td><strong>상황</strong>
   </td>
   <td><strong>표시 문구</strong>
   </td>
  </tr>
  <tr>
   <td>포트폴리오 데이터 없음
   </td>
   <td>"아직 포트폴리오가 없어요. 첫 종목을 추가해 보세요! 🌱"
   </td>
  </tr>
  <tr>
   <td>수익률 데이터 부족
   </td>
   <td>"데이터가 쌓이는 중이에요. 조금만 기다려 주세요"
   </td>
  </tr>
  <tr>
   <td>인사이트 없음
   </td>
   <td>"현재 특이 신호가 없어요. 안정적으로 유지되고 있어요 👍"
   </td>
  </tr>
  <tr>
   <td>계산 오류
   </td>
   <td>"일시적인 오류가 발생했어요. 잠시 후 다시 시도해 주세요"
   </td>
  </tr>
  <tr>
   <td>API 연결 실패
   </td>
   <td>"데이터를 불러오지 못했어요. 네트워크 상태를 확인해 주세요"
   </td>
  </tr>
</table>



---


## 6. 문체 가이드

Gemini가 인사이트 카드를 생성할 때 준수해야 할 문체 규칙.



* **사용할 종결어미**: `~요`, `~어요`, `~해요`, `~이에요`
* **사용 금지**: `~습니다`, `~합니다`, `~십시오`, `~바랍니다`
* **전문 용어 사용 시**: 반드시 괄호 안에 쉬운 설명 병기 (예: MDD(최대 낙폭))
* **문장 길이**: 한 문장 최대 40자 이내 권장
* **숫자 표현**: 수치 뒤에 단위 명확히 표기, 소수점 과다 사용 지양
* **감정 어조**: 위험 상황도 공포를 조장하지 않는 중립적·격려적 어조 유지

# Skills-E.md · 자연어 번역 매핑 (Updated)

## 2. 이지가이드 용어 번역 테이블 보강

| 금융 용어 | 이지가이드 설명 | 보조 설명 |

| :--- | :--- | :--- |

| Sortino Ratio | 하락장에서의 맷집[cite: 4] | 떨어질 때 얼마나 잘 버티는지 보여주는 효율 지수예요 |

| 상관관계 | 따로국밥 지수[cite: 4] | 종목들이 서로 다르게 움직여서 위험을 잘 나눴는지 보여줘요 |

| 뉴스 감성 | 종목 온도계[cite: 4] | 지금 사람들이 이 종목을 얼마나 좋게 보는지 알려줘요 |

d
