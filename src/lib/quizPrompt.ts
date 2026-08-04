export type NewsAnalysisPromptInput = {
  company: string;
  ticker: string;
  headline: string;
  newsDate: string;
  sourceUrl: string;
  impactTradingDays: number;
  baseDate: string;
  priceBase: number;
  impactDate: string;
  priceEnd: number;
  changeRate: number;
  direction: "up" | "down";
};

export function formatQuizPrice(price: number | null | undefined) {
  if (price == null) return "-";
  return `${Math.round(price).toLocaleString()}원`;
}

export function createNewsAnalysisPrompt(item: NewsAnalysisPromptInput) {
  const directionLabel = item.direction === "up" ? "상승" : "하락";

  return `다음 뉴스와 당시 시장 상황을 바탕으로 ${item.company} 주가가 왜 움직였는지 분석해 주세요.

[분석 대상]
- 종목: ${item.company} (${item.ticker})
- 기사 제목: ${item.headline}
- 기사 날짜: ${item.newsDate}
- 기사 원문: ${item.sourceUrl}
- 주가 변화: ${item.baseDate} 종가 ${formatQuizPrice(item.priceBase)} → ${item.impactDate} 종가 ${formatQuizPrice(item.priceEnd)}
- 결과: 기사 발표 후 ${item.impactTradingDays}거래일 동안 ${Math.abs(item.changeRate).toFixed(1)}% ${directionLabel}

[분석 요청]
1. 기사 핵심 내용을 주식 초보자도 이해할 수 있게 3줄 이내로 요약해 주세요.
2. 이 뉴스가 해당 기업의 매출, 비용, 성장성, 위험에 어떤 영향을 줄 수 있는지 설명해 주세요.
3. 같은 기간의 시장 전체, 업종, 기업별 이슈를 찾아 주가 변동의 다른 원인도 확인해 주세요.
4. 뉴스의 직접 영향과 단순한 동시 발생을 구분하고, 기사 하나만으로 원인을 단정하지 마세요.
5. 상승 요인과 하락 요인을 표로 비교한 뒤, 가장 가능성 높은 원인과 판단 근거를 정리해 주세요.
6. 확인한 근거 자료의 출처와 날짜를 링크로 제시하고, 확인할 수 없는 내용은 추측하지 말고 '확인 불가'라고 표시해 주세요.

투자 추천이나 매수·매도 지시는 하지 말고, 당시 정보만을 기준으로 교육 목적으로 분석해 주세요.`;
}
