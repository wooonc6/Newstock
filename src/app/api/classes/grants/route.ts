import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const body = await req.json().catch(() => null) as { classId?: unknown; amount?: unknown } | null;
  const classId = typeof body?.classId === "string" ? body.classId : "";
  const amount = typeof body?.amount === "number" ? body.amount : Number.NaN;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(classId)) {
    return NextResponse.json({ error: "잘못된 수업입니다." }, { status: 400 });
  }
  if (!Number.isSafeInteger(amount) || amount < 1 || amount > 100_000_000) {
    return NextResponse.json({ error: "지급 금액은 1원 이상 1억원 이하의 정수로 입력해 주세요." }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("grant_class_coins", {
    p_class_id: classId,
    p_amount: amount,
  });
  if (error || !data?.[0]) {
    const status = error?.code === "42501" ? 403 : error?.code === "P0002" ? 400 : 500;
    const message = status === 403
      ? "이 수업의 관리자만 지급할 수 있습니다."
      : error?.code === "P0002"
        ? "아직 지급할 학생이 없습니다."
        : "모의투자금 지급을 처리하지 못했습니다.";
    return NextResponse.json({ error: message }, { status });
  }

  return NextResponse.json({ grant: data[0] });
}
