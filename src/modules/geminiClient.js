/**
 * geminiClient.js — Gemini API 클라이언트
 * Skills-D.md §7 Gemini API 호출 지시 구현
 */

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// 모델 + API 버전 쌍으로 순차 시도
const MODEL_CONFIGS = [
  { model: 'gemini-1.5-flash', version: 'v1' },
  { model: 'gemini-1.5-flash', version: 'v1beta' },
  { model: 'gemini-1.5-pro', version: 'v1' },
  { model: 'gemini-pro', version: 'v1beta' },
];

function buildUrl({ model, version }) {
  return `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${API_KEY}`;
}

/** Skills-E §6 문체 가이드 + Skills-D §7 출력 규칙 */
const SYSTEM_RULES = `[역할]
당신은 Maxi-Sight 개인 투자 대시보드의 AI 분석 엔진입니다.

[문체 규칙 - Skills-E §6]
- 종결어미: ~요, ~어요, ~해요, ~이에요 만 사용
- 사용 금지: ~습니다, ~합니다
- 금융 전문 용어는 괄호 안에 한글 설명 병기 (예: MDD(최대 낙폭))
- 한 문장 최대 40자 이내
- 공포 조장 없이 중립적·격려적 어조

[출력 규칙 - Skills-D §7]
- 순수 JSON 배열만 반환. 마크다운 코드블록(\`\`\`json) 없이.
- 각 카드: trigger_id, type, title(15자 이내), body(2~3문장), priority(HIGH/MEDIUM/LOW)`;

/**
 * Gemini API 호출 — 여러 모델 순차 시도, 실패 시 null 반환
 * @param {Array} triggeredItems - 발동된 트리거 목록
 * @param {Object} metricsSnapshot - 핵심 지표 요약
 * @returns {Array|null}
 */
export async function callGeminiInsights(triggeredItems, metricsSnapshot) {
  if (!API_KEY || API_KEY === 'your_gemini_api_key_here') {
    console.info('[Gemini] API 키 미설정 — 룰 기반 fallback');
    return null;
  }

  const triggerLines = triggeredItems
    .map(t => `- ${t.trigger_id} (${t.type}, ${t.priority}): ${t.context}`)
    .join('\n');

  const fullPrompt = `${SYSTEM_RULES}

[포트폴리오 분석 결과]
소유자: ${metricsSnapshot.owner_name} (${metricsSnapshot.style})
총 수익률: ${metricsSnapshot.total_return_pct >= 0 ? '+' : ''}${metricsSnapshot.total_return_pct.toFixed(2)}%
CAGR: ${metricsSnapshot.cagr_pct?.toFixed(2) ?? 'N/A'}%
Sharpe: ${metricsSnapshot.sharpe_ratio?.toFixed(2) ?? 'N/A'}
MDD: ${metricsSnapshot.mdd_pct?.toFixed(1) ?? 'N/A'}%
변동성: ${metricsSnapshot.volatility_annualized_pct?.toFixed(1) ?? 'N/A'}%

[발동된 트리거]
${triggerLines}

위 트리거 각각에 대해 인사이트 카드를 JSON 배열로 생성하라.
출력 예시:
[{"trigger_id":"D-01","type":"위험 알림","title":"제목","body":"본문 2~3문장.","priority":"HIGH"}]`;

  const requestBody = JSON.stringify({
    contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 1200 },
  });

  for (const config of MODEL_CONFIGS) {
    try {
      const res = await fetch(buildUrl(config), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: requestBody,
      });

      if (!res.ok) {
        const errText = await res.text();
        console.warn(`[Gemini] ${config.model}(${config.version}) 오류 ${res.status}:`, errText.slice(0, 200));
        continue;
      }

      const data = await res.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (!rawText) { console.warn(`[Gemini] ${config.model} 빈 응답`); continue; }

      const clean = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
      const parsed = JSON.parse(clean);

      if (Array.isArray(parsed)) {
        console.info(`[Gemini] ${config.model}(${config.version}) 성공 — ${parsed.length}개 카드`);
        return parsed;
      }
    } catch (err) {
      console.warn(`[Gemini] ${config.model} 예외:`, err.message);
    }
  }

  console.warn('[Gemini] 모든 모델 실패 — fallback 전환');
  return null;
}
