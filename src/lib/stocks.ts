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
