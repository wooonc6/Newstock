import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !secretKey) {
    console.error("Account deletion is missing its server-only Supabase configuration.");
    return NextResponse.json(
      { error: "회원 탈퇴 기능이 아직 설정되지 않았습니다." },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const admin = createAdminClient(supabaseUrl, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Account deletion does not immediately expire already-issued JWTs, so revoke
  // every session before removing the Auth user and its cascading app data.
  const { error: signOutError } = await supabase.auth.signOut({ scope: "global" });
  if (signOutError) {
    console.error("Failed to revoke sessions before account deletion:", signOutError.message);
    return NextResponse.json(
      { error: "로그인 세션을 정리하지 못했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 }
    );
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) {
    console.error("Failed to delete Supabase Auth user:", deleteError.message);
    return NextResponse.json(
      { error: "계정을 삭제하지 못했습니다. 다시 로그인한 뒤 재시도해 주세요." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
