import type React from "react";
import type { Stock } from "@/types";

export const STOCKS: Stock[] = [
  {
    ticker: "005930.KS",
    name: "삼성전자",
    sector: "IT / 반도체",
    sectorColor: "blue",
    description: "메모리 반도체와 스마트폰을 중심으로 한국 증시를 대표하는 기업입니다.",
    marketCap: "약 380조원",
  },
  {
    ticker: "051910.KS",
    name: "LG화학",
    sector: "화학 / 배터리",
    sectorColor: "green",
    description: "화학 소재와 전지 소재 사업을 기반으로 성장하는 국내 대표 소재 기업입니다.",
    marketCap: "약 18조원",
  },
  {
    ticker: "034020.KS",
    name: "두산에너빌리티",
    sector: "에너지 / 발전",
    sectorColor: "amber",
    description: "발전 설비와 원전, SMR 관련 사업을 다루는 에너지 인프라 기업입니다.",
    marketCap: "약 5조원",
  },
  {
    ticker: "000660.KS",
    name: "SK하이닉스",
    sector: "IT / 반도체",
    sectorColor: "blue",
    description: "AI 수요와 함께 주목받는 HBM 등 메모리 반도체를 생산하는 기업입니다.",
    marketCap: "약 120조원",
  },
  {
    ticker: "005380.KS",
    name: "현대차",
    sector: "자동차 / EV",
    sectorColor: "red",
    description: "내연기관차와 전기차, 수소차 전환을 추진하는 국내 대표 자동차 기업입니다.",
    marketCap: "약 50조원",
  },
  {
    ticker: "035420.KS",
    name: "NAVER",
    sector: "IT / 플랫폼",
    sectorColor: "green",
    description: "검색, 커머스, 콘텐츠, 클라우드와 AI 서비스를 운영하는 플랫폼 기업입니다.",
    marketCap: "약 25조원",
  },
  {
    ticker: "086790.KS",
    name: "하나금융지주",
    sector: "금융 / 은행",
    sectorColor: "purple",
    description: "하나은행을 중심으로 은행, 증권, 카드 등 금융 서비스를 제공하는 금융지주입니다.",
    marketCap: "약 17조원",
  },
  {
    ticker: "035720.KS",
    name: "카카오",
    sector: "IT / 플랫폼",
    sectorColor: "amber",
    description: "메신저, 콘텐츠, 페이, 모빌리티 등 생활 밀착형 플랫폼 서비스를 운영합니다.",
    marketCap: "약 18조원",
  },
  {
    ticker: "068270.KS",
    name: "셀트리온",
    sector: "바이오 / 헬스",
    sectorColor: "red",
    description: "바이오시밀러와 의약품 개발, 글로벌 판매를 중심으로 성장하는 바이오 기업입니다.",
    marketCap: "약 22조원",
  },
];

export function getStock(ticker: string): Stock | undefined {
  return STOCKS.find((stock) => stock.ticker === ticker);
}

export const SECTOR_BADGE_STYLES: Record<Stock["sectorColor"], React.CSSProperties> = {
  blue: { background: "#dbeafe", color: "#1d4ed8" },
  green: { background: "#d1fae5", color: "#065f46" },
  amber: { background: "#fef3c7", color: "#92400e" },
  purple: { background: "#ede9fe", color: "#6d28d9" },
  red: { background: "#fee2e2", color: "#b91c1c" },
};
