export type ConceptArea = "company" | "industry" | "economy" | "judgement";

export interface InvestmentConcept {
  id: string;
  area: ConceptArea;
  title: string;
  summary: string;
  whyItMatters: string;
  keywords: string[];
}

export const AREA_LABELS: Record<ConceptArea, string> = {
  company: "기업 분석",
  industry: "산업 분석",
  economy: "경제 분석",
  judgement: "투자 판단",
};

export const INVESTMENT_CONCEPTS: InvestmentConcept[] = [
  { id: "revenue", area: "company", title: "매출", summary: "기업이 상품이나 서비스를 판매해 벌어들인 전체 금액입니다.", whyItMatters: "매출이 늘어도 비용이 더 크게 늘면 이익은 감소할 수 있습니다.", keywords: ["매출", "판매", "매출액"] },
  { id: "operating-profit", area: "company", title: "영업이익", summary: "기업의 본업으로 벌어들인 이익입니다.", whyItMatters: "본업의 경쟁력과 수익성이 좋아졌는지 판단할 때 중요합니다.", keywords: ["영업이익", "영업손익", "수익성"] },
  { id: "net-profit", area: "company", title: "순이익", summary: "이자와 세금 등을 모두 반영한 뒤 최종적으로 남은 이익입니다.", whyItMatters: "일회성 수익이나 비용 때문에 영업이익과 다른 방향으로 움직일 수 있습니다.", keywords: ["순이익", "당기순이익"] },
  { id: "eps", area: "company", title: "EPS", summary: "기업의 순이익을 주식 수로 나눈 주당순이익입니다.", whyItMatters: "기업이 주식 한 주당 얼마나 이익을 내는지 비교할 수 있습니다.", keywords: ["eps", "주당순이익"] },
  { id: "per", area: "company", title: "PER", summary: "주가가 주당순이익의 몇 배인지 나타내는 지표입니다.", whyItMatters: "기업의 성장 기대가 주가에 얼마나 반영됐는지 살펴볼 수 있습니다.", keywords: ["per", "주가수익비율"] },
  { id: "pbr", area: "company", title: "PBR", summary: "주가가 주당순자산의 몇 배인지 나타내는 지표입니다.", whyItMatters: "자산 가치와 비교해 주가 수준을 판단할 때 활용합니다.", keywords: ["pbr", "주가순자산비율"] },
  { id: "roe", area: "company", title: "ROE", summary: "자기자본으로 얼마나 많은 이익을 냈는지 보여주는 지표입니다.", whyItMatters: "기업이 주주의 자본을 효율적으로 활용하는지 판단할 수 있습니다.", keywords: ["roe", "자기자본이익률"] },
  { id: "dividend", area: "company", title: "배당", summary: "기업이 이익의 일부를 주주에게 나누어 주는 것입니다.", whyItMatters: "배당 확대는 주주환원 강화로 해석될 수 있지만 성장 투자 여력과 함께 봐야 합니다.", keywords: ["배당", "배당금", "주주환원"] },
  { id: "capital-increase", area: "company", title: "증자", summary: "기업이 새 주식을 발행해 자금을 조달하는 것입니다.", whyItMatters: "성장 자금을 확보할 수 있지만 기존 주주의 지분 가치가 희석될 수 있습니다.", keywords: ["증자", "유상증자", "신주"] },
  { id: "buyback", area: "company", title: "자사주", summary: "기업이 자기 회사의 주식을 직접 사들이는 것입니다.", whyItMatters: "주주환원 신호가 될 수 있지만 실제 소각 여부도 확인해야 합니다.", keywords: ["자사주", "자기주식", "소각"] },
  { id: "ma", area: "company", title: "M&A", summary: "기업의 인수와 합병을 뜻합니다.", whyItMatters: "성장 기회가 될 수 있지만 인수 가격과 통합 비용도 위험 요인입니다.", keywords: ["m&a", "인수", "합병"] },

  { id: "demand-supply", area: "industry", title: "산업 수요와 공급", summary: "제품을 원하는 양과 시장에 제공되는 양의 관계입니다.", whyItMatters: "수요가 공급보다 빠르게 늘면 가격과 기업 실적이 개선될 가능성이 있습니다.", keywords: ["수요", "공급", "재고"] },
  { id: "market-share", area: "industry", title: "시장점유율", summary: "전체 시장에서 특정 기업이 차지하는 비중입니다.", whyItMatters: "점유율 상승은 경쟁력 강화 신호일 수 있지만 가격 경쟁 여부도 봐야 합니다.", keywords: ["시장점유율", "점유율"] },
  { id: "competition", area: "industry", title: "경쟁 구조", summary: "산업 안에서 기업들이 가격, 기술, 품질로 경쟁하는 방식입니다.", whyItMatters: "경쟁이 심해지면 매출이 늘어도 수익성이 낮아질 수 있습니다.", keywords: ["경쟁", "경쟁사", "가격경쟁"] },
  { id: "supply-chain", area: "industry", title: "공급망", summary: "원재료부터 생산과 유통까지 이어지는 연결 구조입니다.", whyItMatters: "부품 부족이나 물류 차질은 기업의 생산과 비용에 직접 영향을 줍니다.", keywords: ["공급망", "부품", "물류"] },
  { id: "industry-cycle", area: "industry", title: "산업 사이클", summary: "산업의 호황과 불황이 반복되는 흐름입니다.", whyItMatters: "현재 실적뿐 아니라 업황이 어느 단계에 있는지 파악해야 합니다.", keywords: ["업황", "사이클", "호황", "불황"] },
  { id: "semiconductor", area: "industry", title: "반도체 산업", summary: "메모리, 시스템 반도체와 관련 장비·소재를 포함하는 산업입니다.", whyItMatters: "재고와 가격, 데이터센터 투자에 따라 실적 변동이 큰 편입니다.", keywords: ["반도체", "메모리", "hbm"] },
  { id: "automobile", area: "industry", title: "자동차 산업", summary: "완성차와 부품, 전기차 생태계를 포함하는 산업입니다.", whyItMatters: "판매량뿐 아니라 환율, 원자재 가격, 제품 구성도 수익성에 영향을 줍니다.", keywords: ["자동차", "전기차", "완성차"] },
  { id: "biotech", area: "industry", title: "바이오 산업", summary: "신약과 바이오 의약품을 개발하고 생산하는 산업입니다.", whyItMatters: "임상과 허가 결과에 따라 기대와 위험이 크게 달라집니다.", keywords: ["바이오", "신약", "임상"] },
  { id: "energy", area: "industry", title: "에너지 산업", summary: "석유, 가스, 전력과 신재생에너지 관련 산업입니다.", whyItMatters: "원자재 가격과 정책 변화가 기업 수익에 큰 영향을 줍니다.", keywords: ["에너지", "전력", "태양광", "풍력"] },

  { id: "base-rate", area: "economy", title: "기준금리", summary: "중앙은행이 통화정책의 기준으로 정하는 금리입니다.", whyItMatters: "대출 비용, 소비, 투자와 주식의 가치평가에 영향을 줍니다.", keywords: ["기준금리", "금리", "금리인상", "금리인하"] },
  { id: "exchange-rate", area: "economy", title: "환율", summary: "서로 다른 나라 화폐의 교환 비율입니다.", whyItMatters: "원화 약세는 수출 기업에 유리할 수 있지만 원재료 수입 비용을 높일 수 있습니다.", keywords: ["환율", "원달러", "달러", "원화"] },
  { id: "inflation", area: "economy", title: "물가와 CPI", summary: "상품과 서비스 가격의 전반적인 상승 정도를 보여줍니다.", whyItMatters: "물가 상승은 금리 정책과 기업 비용, 소비 여력에 영향을 줍니다.", keywords: ["물가", "cpi", "인플레이션"] },
  { id: "gdp", area: "economy", title: "GDP", summary: "한 나라에서 일정 기간 생산된 재화와 서비스의 가치를 나타냅니다.", whyItMatters: "경기 성장 속도와 기업 매출 환경을 이해하는 기본 지표입니다.", keywords: ["gdp", "국내총생산", "경제성장률"] },
  { id: "business-cycle", area: "economy", title: "경기 순환", summary: "경제가 회복, 확장, 둔화, 침체를 반복하는 흐름입니다.", whyItMatters: "경기 단계에 따라 유리한 산업과 위험 요인이 달라질 수 있습니다.", keywords: ["경기", "경기침체", "경기회복", "불황"] },
  { id: "bond-yield", area: "economy", title: "채권금리", summary: "채권에 투자했을 때 기대할 수 있는 수익률입니다.", whyItMatters: "채권금리가 오르면 미래 이익의 현재 가치가 낮아져 성장주에 부담이 될 수 있습니다.", keywords: ["채권금리", "국채금리", "채권 수익률"] },
  { id: "fed-bok", area: "economy", title: "연준과 한국은행", summary: "미국과 한국의 통화정책을 담당하는 중앙은행입니다.", whyItMatters: "금리와 유동성 결정이 환율과 주식시장에 큰 영향을 줍니다.", keywords: ["연준", "fed", "한국은행", "금통위"] },
  { id: "oil-commodity", area: "economy", title: "원유와 원자재", summary: "생산에 사용되는 에너지와 기초 자원의 가격입니다.", whyItMatters: "가격 상승은 에너지 기업에 기회가 될 수 있지만 제조업 비용을 높입니다.", keywords: ["원유", "유가", "원자재", "천연가스"] },
  { id: "exports", area: "economy", title: "수출과 무역", summary: "국가 간 상품과 서비스를 거래하는 활동입니다.", whyItMatters: "수출 증가와 무역 규제는 관련 기업의 매출과 공급망에 영향을 줍니다.", keywords: ["수출", "무역", "관세"] },

  { id: "diversification", area: "judgement", title: "분산투자", summary: "여러 종목이나 산업에 나누어 투자하는 방법입니다.", whyItMatters: "한 기업이나 산업의 충격이 전체 자산에 미치는 영향을 줄일 수 있습니다.", keywords: ["분산", "분산투자", "집중투자"] },
  { id: "volatility", area: "judgement", title: "변동성", summary: "가격이 오르내리는 폭과 정도를 뜻합니다.", whyItMatters: "높은 기대수익과 함께 손실 위험도 커질 수 있음을 보여줍니다.", keywords: ["변동성", "급등", "급락"] },
  { id: "risk", area: "judgement", title: "위험과 불확실성", summary: "예상과 다른 결과가 발생할 가능성입니다.", whyItMatters: "좋은 뉴스에서도 이미 반영된 기대와 실패 가능성을 함께 살펴야 합니다.", keywords: ["위험", "리스크", "불확실성"] },
  { id: "stop-loss-profit", area: "judgement", title: "손절과 익절", summary: "손실이나 수익을 확정하기 위해 주식을 매도하는 판단입니다.", whyItMatters: "감정이 아니라 사전에 정한 기준으로 판단하는 연습이 중요합니다.", keywords: ["손절", "익절", "매도"] },
  { id: "long-short-term", area: "judgement", title: "장기와 단기 관점", summary: "투자 결과를 평가하는 시간 범위를 구분하는 것입니다.", whyItMatters: "단기 뉴스와 장기 성장 요인을 섞어 판단하면 전략이 흔들릴 수 있습니다.", keywords: ["장기투자", "단기투자", "보유기간"] },
  { id: "fomo", area: "judgement", title: "FOMO와 군중심리", summary: "상승에서 뒤처질까 두려워 다른 사람을 따라가는 심리입니다.", whyItMatters: "뉴스 직후의 추격 매수와 과열된 가격을 구분하는 데 필요합니다.", keywords: ["fomo", "군중심리", "추격매수", "과열"] },
  { id: "bull-bear-factors", area: "judgement", title: "상승·하락 요인", summary: "하나의 뉴스에 포함된 긍정 요인과 부정 요인을 나누어 보는 방법입니다.", whyItMatters: "한쪽 정보만 보고 결론을 내리는 실수를 줄일 수 있습니다.", keywords: ["상승요인", "하락요인", "호재", "악재", "목표주가", "투자의견"] },
];

export function findConceptByText(text: string): InvestmentConcept | null {
  return findConceptsByText(text)[0] ?? null;
}

export function findConceptsByText(text: string): InvestmentConcept[] {
  const normalized = text.toLowerCase();
  return INVESTMENT_CONCEPTS.filter((concept) =>
    concept.keywords.some((keyword) => normalized.includes(keyword.toLowerCase()))
  );
}

export function getConcept(id: string): InvestmentConcept | null {
  return INVESTMENT_CONCEPTS.find((concept) => concept.id === id) ?? null;
}
