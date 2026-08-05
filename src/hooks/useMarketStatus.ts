"use client";

import { useEffect, useState } from "react";
import { getMarketScheduleStatus } from "@/lib/marketSchedule";

export function useMarketStatus() {
  const [status, setStatus] = useState(() => getMarketScheduleStatus());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setStatus(getMarketScheduleStatus());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  return status;
}