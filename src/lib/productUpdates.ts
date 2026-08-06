export type ProductUpdate = {
  date: string;
  label: string;
  title: string;
  summary: string;
  href: string;
};

// 최신 업데이트가 앞에 오도록 한 줄씩 추가하면 상단 티커에 바로 반영됩니다.
export const PRODUCT_UPDATES: ProductUpdate[] = [
  {
    date: "08.07",
    label: "NEW",
    title: "Newstock 애프터 세션",
    summary: "세션 마감 없이 24시간 모의 거래가 이어집니다",
    href: "/portfolio",
  },
  {
    date: "08.07",
    label: "개선",
    title: "랭킹 자산 반영",
    summary: "현금뿐 아니라 보유 주식까지 총자산에 포함됩니다",
    href: "/ranking",
  },
  {
    date: "08.06",
    label: "개선",
    title: "가입 흐름 간소화",
    summary: "가입 후 더 빠르게 Newstock을 시작할 수 있습니다",
    href: "/onboarding",
  },
  {
    date: "08.06",
    label: "업데이트",
    title: "개념별 학습 미션",
    summary: "투자 역량을 개념 단위 미션으로 확인할 수 있습니다",
    href: "/analysis",
  },
];
