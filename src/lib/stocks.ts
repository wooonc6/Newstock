import type { Stock } from "@/types";

export const STOCKS: Stock[] = [
  {
    ticker: "005930.KS",
    name: "삼성전자",
    sector: "IT / 반도체",
    sectorColor: "blue",
    description: "세계 최대 메모리 반도체·스마트폰 제조사. KOSPI 시가총액 1위",
    marketCap: "약 380조원",
  },
  {
    ticker: "051910.KS",
    name: "LG화학",
    sector: "화학 / 배터리",
    sectorColor: "green",
    description: "국내 최대 종합화학 기업. 전기차 배터리 글로벌 선도 (LG에너지솔루션 분리상장)",
    marketCap: "약 18조원",
  },
  {
    ticker: "034020.KS",
    name: "두산에너빌리티",
    sector: "에너지 / 발전",
    sectorColor: "amber",
    description: "원자력·가스터빈 등 발전설비 전문. 소형모듈원자로(SMR) 핵심 수혜주",
    marketCap: "약 5조원",
  },
  {
    ticker: "000660.KS",
    name: "SK하이닉스",
    sector: "IT / 반도체",
    sectorColor: "blue",
    description: "AI 붐으로 급성장한 HBM 메모리 반도체 세계 1위. KOSPI 시가총액 2위",
    marketCap: "약 120조원",
  },
  {
    ticker: "005380.KS",
    name: "현대차",
    sector: "자동차 / EV",
    sectorColor: "red",
    description: "국내 1위 완성차 제조사. 전기차·수소차 전환 가속화로 글로벌 시장 공략 중",
    marketCap: "약 50조원",
  },
  {
    ticker: "035420.KS",
    name: "NAVER",
    sector: "IT / 플랫폼",
    sectorColor: "green",
    description: "국내 최대 검색·커머스 플랫폼. AI 검색·클라우드·웹툰 글로벌 사업 확장",
    marketCap: "약 25조원",
  },
  {
    ticker: "086790.KS",
    name: "하나금융지주",
    sector: "금융 / 은행",
    sectorColor: "purple",
    description: "하나은행 모회사. 국내 4대 금융그룹 중 하나로 글로벌 네트워크 강화",
    marketCap: "약 17조원",
  },
  {
    ticker: "035720.KS",
    name: "카카오",
    sector: "IT / 플랫폼",
    sectorColor: "amber",
    description: "카카오톡·카카오페이 운영. 국내 최대 모바일 메신저 기반 플랫폼 생태계",
    marketCap: "약 18조원",
  },
  {
    ticker: "105560.KS",
    name: "KB금융",
    sector: "금융 / 은행",
    sectorColor: "purple",
    description: "KB국민은행 모회사. 국내 시가총액 1위 금융그룹. 자산관리·디지털 금융 선도",
    marketCap: "약 28조원",
  },
  {
    ticker: "068270.KS",
    name: "셀트리온",
    sector: "바이오 / 헬스",
    sectorColor: "red",
    description: "국내 최대 바이오시밀러 기업. 항체 의약품 글로벌 수출 선도",
    marketCap: "약 22조원",
  },
];

export function getStock(ticker: string): Stock | undefined {
  return STOCKS.find((s) => s.ticker === ticker);
}

export const SECTOR_BADGE_CLASSES: Record<Stock["sectorColor"], string> = {
  blue: "bg-blue-500/15 text-blue-400",
  green: "bg-accent/12 text-accent",
  amber: "bg-warn/12 text-warn",
  purple: "bg-purple-500/12 text-purple-400",
  red: "bg-danger/12 text-red-400",
};
