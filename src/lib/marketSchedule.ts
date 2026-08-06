const KST_TIME_ZONE = "Asia/Seoul";

type SessionKind =
  | "closed"
  | "pre_close_price"
  | "opening_call"
  | "regular"
  | "closing_call"
  | "closing_gap"
  | "after_close_price"
  | "after_single_price"
  | "learning_after_class";

type KstParts = {
  dateKey: string;
  timeText: string;
  weekday: string;
  dayOfWeek: number;
  minuteOfDay: number;
};

export type MarketScheduleStatus = {
  nowIso: string;
  dateKey: string;
  timeText: string;
  weekday: string;
  isTradingDay: boolean;
  closedReason: string | null;
  realMarket: {
    kind: SessionKind;
    label: string;
    description: string;
    isOrderSession: boolean;
    priceBasis: string;
  };
  newstock: {
    kind: SessionKind;
    label: string;
    description: string;
    canTradeNow: boolean;
    canExecuteOrders: boolean;
    priceBasis: string;
  };
  nextOpenText: string;
};

const REAL_MARKET = {
  preCloseStart: 8 * 60 + 30,
  preCloseEnd: 8 * 60 + 40,
  regularStart: 9 * 60,
  closingCallStart: 15 * 60 + 20,
  regularEnd: 15 * 60 + 30,
  afterCloseStart: 15 * 60 + 40,
  afterCloseEnd: 16 * 60,
  afterSingleEnd: 18 * 60,
};

const NEWSTOCK_MARKET = {
  open: 8 * 60 + 30,
  afterClassStart: 18 * 60,
  close: 24 * 60,
};

const MARKET_CLOSED_DATES: Record<string, string> = {
  "2026-01-01": "신정",
  "2026-02-16": "설날 연휴",
  "2026-02-17": "설날",
  "2026-02-18": "설날 연휴",
  "2026-03-02": "삼일절 대체공휴일",
  "2026-05-01": "근로자의 날",
  "2026-05-05": "어린이날",
  "2026-05-25": "부처님오신날 대체공휴일",
  "2026-06-03": "전국동시지방선거",
  "2026-08-17": "광복절 대체공휴일",
  "2026-09-24": "추석 연휴",
  "2026-09-25": "추석",
  "2026-10-05": "개천절 대체공휴일",
  "2026-10-09": "한글날",
  "2026-12-25": "성탄절",
  "2026-12-31": "증권시장 연말 휴장",
};

const SPECIAL_TRADING_DAYS: Record<string, { realRegularStart: number; note: string }> = {
  "2026-01-02": { realRegularStart: 10 * 60, note: "2026년 첫 거래일 1시간 늦은 개장" },
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function getKstParts(date: Date): KstParts {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: KST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "00";
  const year = value("year");
  const month = value("month");
  const day = value("day");
  const hour = Number(value("hour"));
  const minute = Number(value("minute"));
  const second = Number(value("second"));
  const dateKey = `${year}-${month}-${day}`;
  const dayOfWeek = new Date(`${dateKey}T00:00:00+09:00`).getDay();

  return {
    dateKey,
    timeText: `${value("hour")}:${value("minute")}:${value("second")}`,
    weekday: WEEKDAYS[dayOfWeek],
    dayOfWeek,
    minuteOfDay: hour * 60 + minute,
  };
}

function addDays(dateKey: string, amount: number) {
  const next = new Date(`${dateKey}T00:00:00+09:00`);
  next.setDate(next.getDate() + amount);
  return getKstParts(next).dateKey;
}

function getClosedReason(parts: KstParts) {
  if (parts.dayOfWeek === 0 || parts.dayOfWeek === 6) return "주말";
  return MARKET_CLOSED_DATES[parts.dateKey] ?? null;
}

function formatDateLabel(dateKey: string) {
  const parts = getKstParts(new Date(`${dateKey}T00:00:00+09:00`));
  return `${Number(dateKey.slice(5, 7))}/${Number(dateKey.slice(8, 10))}(${parts.weekday})`;
}

function getNextTradingDate(dateKey: string) {
  let cursor = dateKey;
  for (let i = 0; i < 370; i += 1) {
    cursor = addDays(cursor, 1);
    const parts = getKstParts(new Date(`${cursor}T00:00:00+09:00`));
    if (!getClosedReason(parts)) return cursor;
  }
  return dateKey;
}

function getRealMarketSession(parts: KstParts, closedReason: string | null) {
  const special = SPECIAL_TRADING_DAYS[parts.dateKey];
  const regularStart = special?.realRegularStart ?? REAL_MARKET.regularStart;
  const preCloseStart = special ? regularStart - 30 : REAL_MARKET.preCloseStart;
  const preCloseEnd = special ? regularStart - 20 : REAL_MARKET.preCloseEnd;
  const openingCallStart = preCloseEnd;
  const openingCallEnd = regularStart;

  if (closedReason) {
    return {
      kind: "closed" as const,
      label: "현실장 휴장",
      description: `${closedReason}에는 한국 주식시장이 열리지 않습니다.`,
      isOrderSession: false,
      priceBasis: "마지막 거래일 종가 또는 최근 확인가",
    };
  }

  const minute = parts.minuteOfDay;
  if (minute >= preCloseStart && minute < preCloseEnd) {
    return {
      kind: "pre_close_price" as const,
      label: "장전 시간외종가",
      description: "전일 종가 기준으로 거래되는 시간입니다.",
      isOrderSession: true,
      priceBasis: "전일 종가",
    };
  }
  if (minute >= openingCallStart && minute < openingCallEnd) {
    return {
      kind: "opening_call" as const,
      label: "시가 결정 준비",
      description: "주문을 모아 정규장 시작 가격을 정하는 구간입니다.",
      isOrderSession: true,
      priceBasis: "시가 결정 전 예상 가격",
    };
  }
  if (minute >= regularStart && minute < REAL_MARKET.closingCallStart) {
    return {
      kind: "regular" as const,
      label: "정규장",
      description: "일반적인 실시간 매수·매도가 가능한 시간입니다.",
      isOrderSession: true,
      priceBasis: "실시간에 가까운 현재가",
    };
  }
  if (minute >= REAL_MARKET.closingCallStart && minute < REAL_MARKET.regularEnd) {
    return {
      kind: "closing_call" as const,
      label: "종가 결정 준비",
      description: "마감 주문을 모아 당일 종가를 정하는 구간입니다.",
      isOrderSession: true,
      priceBasis: "종가 결정 전 예상 가격",
    };
  }
  if (minute >= REAL_MARKET.regularEnd && minute < REAL_MARKET.afterCloseStart) {
    return {
      kind: "closing_gap" as const,
      label: "장후 접수 대기",
      description: "정규장 종료 후 시간외종가 주문을 준비하는 짧은 구간입니다.",
      isOrderSession: false,
      priceBasis: "당일 종가",
    };
  }
  if (minute >= REAL_MARKET.afterCloseStart && minute < REAL_MARKET.afterCloseEnd) {
    return {
      kind: "after_close_price" as const,
      label: "장후 시간외종가",
      description: "당일 종가 기준으로 거래되는 시간입니다.",
      isOrderSession: true,
      priceBasis: "당일 종가",
    };
  }
  if (minute >= REAL_MARKET.afterCloseEnd && minute < REAL_MARKET.afterSingleEnd) {
    return {
      kind: "after_single_price" as const,
      label: "시간외단일가",
      description: "주문을 모아 10분 단위로 체결하는 시간외 거래 구간입니다.",
      isOrderSession: true,
      priceBasis: "당일 종가 대비 제한 범위 안의 단일가",
    };
  }

  return {
    kind: "closed" as const,
    label: "현실장 거래 불가",
    description: "정규장과 시간외 거래가 모두 끝난 시간입니다.",
    isOrderSession: false,
    priceBasis: "마지막 거래일 종가 또는 최근 확인가",
  };
}

function getNewstockSession(parts: KstParts, closedReason: string | null, realKind: SessionKind) {
  const minute = parts.minuteOfDay;
  const special = SPECIAL_TRADING_DAYS[parts.dateKey];

  if (closedReason) {
    return {
      kind: "closed" as const,
      label: "Newstock 세션 휴장",
      description: `${closedReason}에는 조건 주문 등록만 가능하고 즉시 체결은 쉬어갑니다.`,
      canTradeNow: false,
      canExecuteOrders: false,
      priceBasis: "마지막 거래일 종가 또는 최근 확인가",
    };
  }

  const realSessionPriceBasis: Record<SessionKind, string> = {
    closed: "마지막 거래일 종가 또는 최근 확인가",
    pre_close_price: "전일 종가 기준",
    opening_call: "시가 결정 전 최근 확인가 기준",
    regular: "정규장 최근 현재가 기준",
    closing_call: "종가 결정 전 최근 확인가 기준",
    closing_gap: "당일 종가 확인 대기 기준가",
    after_close_price: "당일 종가에 가까운 마지막 확인가 기준",
    after_single_price: "Newstock 단일가 기준가",
    learning_after_class: "Newstock 애프터 기준가",
  };

  if (minute >= NEWSTOCK_MARKET.open && minute < NEWSTOCK_MARKET.afterClassStart) {
    return {
      kind: realKind,
      label: special ? `Newstock 현실 반영장 · ${special.note}` : "Newstock 현실 반영장",
      description: "현실의 정규장·시간외장 구간을 구분해 Newstock 체결가를 정합니다.",
      canTradeNow: true,
      canExecuteOrders: true,
      priceBasis: realSessionPriceBasis[realKind],
    };
  }

  if (minute >= NEWSTOCK_MARKET.afterClassStart && minute < NEWSTOCK_MARKET.close) {
    return {
      kind: "learning_after_class" as const,
      label: "Newstock 애프터 세션",
      description: "저녁 학습 시간에도 연습할 수 있도록 당일 마지막 확인가로 체결합니다.",
      canTradeNow: true,
      canExecuteOrders: true,
      priceBasis: "당일 종가에 가까운 Yahoo Finance 마지막 확인가",
    };
  }

  return {
    kind: "closed" as const,
    label: "Newstock 세션 마감",
    description: "즉시 거래는 쉬고, 조건 주문 등록만 가능합니다.",
    canTradeNow: false,
    canExecuteOrders: false,
    priceBasis: "마지막 거래일 종가 또는 최근 확인가",
  };
}

function getNextOpenText(parts: KstParts, closedReason: string | null) {
  if (!closedReason && parts.minuteOfDay < NEWSTOCK_MARKET.open) return `오늘 08:30 세션 시작`;
  if (!closedReason && parts.minuteOfDay < NEWSTOCK_MARKET.close) return `오늘 24:00 세션 마감`;
  const nextTradingDate = getNextTradingDate(parts.dateKey);
  return `${formatDateLabel(nextTradingDate)} 08:30 세션 시작`;
}

export function getMarketScheduleStatus(now: Date = new Date()): MarketScheduleStatus {
  const parts = getKstParts(now);
  const closedReason = getClosedReason(parts);
  const realMarket = getRealMarketSession(parts, closedReason);
  const newstock = getNewstockSession(parts, closedReason, realMarket.kind);

  return {
    nowIso: now.toISOString(),
    dateKey: parts.dateKey,
    timeText: parts.timeText,
    weekday: parts.weekday,
    isTradingDay: !closedReason,
    closedReason,
    realMarket,
    newstock,
    nextOpenText: getNextOpenText(parts, closedReason),
  };
}
