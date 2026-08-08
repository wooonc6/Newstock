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
    date: "08.08",
    label: "개선",
    title: "상단 모의현금 자산 연동",
    summary: "우측 상단 모의현금이 각 사용자의 최신 자산과 자동으로 동기화되도록 개선했습니다",
    href: "/assets",
  },
  {
    date: "08.07",
    label: "NEW",
    title: "이메일과 공개 닉네임 분리",
    summary: "이메일은 로그인·계정 복구용으로 유지하고, 랭킹에 표시되는 닉네임은 별도로 설정할 수 있습니다",
    href: "/dashboard",
  },
  {
    date: "08.07",
    label: "개선",
    title: "기존 사용자 닉네임 확인",
    summary: "기존 사용자도 한 번의 안내창에서 현재 닉네임을 유지하거나 새 공개 닉네임으로 변경할 수 있습니다",
    href: "/dashboard",
  },
  {
    date: "08.07",
    label: "안전",
    title: "공개 닉네임 운영 정책 강화",
    summary: "운영 정책에 맞지 않는 닉네임은 랭킹에서 보호 처리되고 로그인 후 변경 안내가 표시됩니다",
    href: "/ranking",
  },
  {
    date: "08.07",
    label: "NEW",
    title: "순위에서 바로 보는 투자 현황",
    summary: "사용자를 누르면 해당 순위 아래에서 보유 종목과 거래 현황이 펼쳐집니다",
    href: "/ranking",
  },
  {
    date: "08.07",
    label: "개선",
    title: "랭킹 총수익률 실시간 반영",
    summary: "실현손익과 보유 종목 평가손익을 합산해 모든 사용자의 성과를 반영합니다",
    href: "/ranking",
  },
  {
    date: "08.07",
    label: "개선",
    title: "학습 분석 실제 데이터 연동",
    summary: "주간 정답률과 뉴스 이해 리포트를 실제 퀴즈·기사 기록으로 계산합니다",
    href: "/analysis",
  },
  {
    date: "08.07",
    label: "개선",
    title: "거래 성과 표시 정교화",
    summary: "잘한·아쉬운 거래 구분과 관계없이 실제 손익에 맞춰 색상을 표시합니다",
    href: "/assets",
  },
  {
    date: "08.07",
    label: "NEW",
    title: "안전한 회원 탈퇴",
    summary: "모든 페이지 하단에서 확인 절차를 거쳐 계정과 관련 기록을 삭제할 수 있습니다",
    href: "/dashboard",
  },
  {
    date: "08.07",
    label: "업데이트",
    title: "Newstock 애프터 세션",
    summary: "세션 마감 없이 24시간 모의 거래가 이어집니다",
    href: "/portfolio",
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
