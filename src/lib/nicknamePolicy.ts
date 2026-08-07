const BLOCKED_NICKNAME_FRAGMENTS = [
  // 운영 중 확인된 공개 닉네임 정책 위반 표현.
  // 비교 전 공백/구분자/대소문자를 정규화하므로 단순 우회 표기도 함께 차단됩니다.
  "nomuhyunuii",
  "nomuhyununji",
];

export function normalizeNicknameForPolicy(value: string) {
  return value
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/[\s._-]+/g, "");
}

export function requiresNicknameReset(value: string | null | undefined) {
  if (!value) return false;
  const normalized = normalizeNicknameForPolicy(value);
  return BLOCKED_NICKNAME_FRAGMENTS.some((fragment) => normalized.includes(fragment));
}

export function validateNickname(value: string) {
  const nickname = value.normalize("NFKC").trim();

  if (nickname.length < 2 || nickname.length > 20) {
    return { ok: false as const, error: "닉네임은 2자 이상 20자 이하로 입력해주세요." };
  }

  if (!/^[가-힣a-zA-Z0-9._-]+$/.test(nickname)) {
    return {
      ok: false as const,
      error: "닉네임에는 한글, 영문, 숫자, 마침표(.), 밑줄(_), 하이픈(-)만 사용할 수 있습니다.",
    };
  }

  if (requiresNicknameReset(nickname)) {
    return { ok: false as const, error: "사용할 수 없는 닉네임입니다. 다른 닉네임을 입력해주세요." };
  }

  return { ok: true as const, nickname };
}

export function getPublicNickname(nickname: string | null | undefined, userId: string) {
  if (!nickname || requiresNicknameReset(nickname)) {
    const suffix = userId.replace(/-/g, "").slice(-4).toUpperCase() || "USER";
    return `사용자_${suffix}`;
  }
  return nickname;
}
