import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { data, error } = await supabase.rpc("get_my_classes");

  if (error) return NextResponse.json({ error: "수업 목록을 불러오지 못했습니다." }, { status: 500 });
  return NextResponse.json({ classes: data ?? [] }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const body = await req.json().catch(() => null) as { classCode?: unknown } | null;
  const classCode = typeof body?.classCode === "string" ? body.classCode.trim().toUpperCase() : "";
  if (!/^[A-Z0-9][A-Z0-9_-]{3,31}$/.test(classCode)) {
    return NextResponse.json({ error: "수업 코드를 확인해 주세요." }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("join_class_by_code", { p_class_code: classCode });
  if (error || !data?.[0]) {
    const status = error?.code === "P0002" ? 404 : 500;
    return NextResponse.json({ error: status === 404 ? "유효하지 않은 수업 코드입니다." : "수업 참가를 처리하지 못했습니다." }, { status });
  }
  return NextResponse.json({ class: data[0] });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const body = await req.json().catch(() => null) as { classId?: unknown; name?: unknown } | null;
  const classId = typeof body?.classId === "string" ? body.classId : "";
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!/^[0-9a-f-]{36}$/i.test(classId) || name.length < 1 || name.length > 100) {
    return NextResponse.json({ error: "수업 이름을 1~100자로 입력해 주세요." }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("rename_managed_class", { p_class_id: classId, p_name: name });
  if (error || !data?.[0]) {
    const status = error?.code === "42501" ? 403 : 500;
    return NextResponse.json({ error: status === 403 ? "이 수업의 관리자만 이름을 바꿀 수 있습니다." : "수업 이름을 바꾸지 못했습니다." }, { status });
  }
  return NextResponse.json({ class: data[0] });
}
