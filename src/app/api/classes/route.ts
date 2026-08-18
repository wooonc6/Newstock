import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { data, error } = await supabase
    .from("class_members")
    .select("joined_at, classes!inner(id, name)")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: true });

  if (error) return NextResponse.json({ error: "수업 목록을 불러오지 못했습니다." }, { status: 500 });
  const classes = (data ?? []).map((row) => ({
    id: (row.classes as unknown as { id: string; name: string }).id,
    name: (row.classes as unknown as { id: string; name: string }).name,
    joined_at: row.joined_at,
  }));
  return NextResponse.json({ classes }, { headers: { "Cache-Control": "private, no-store" } });
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
