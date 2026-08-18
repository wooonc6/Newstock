const NAME_PATTERN = /^[가-힣a-zA-Z]+(?:[ '-][가-힣a-zA-Z]+)*$/;

export function validateRealName(lastNameValue: string, firstNameValue: string) {
  const lastName = lastNameValue.normalize("NFKC").trim();
  const firstName = firstNameValue.normalize("NFKC").trim();

  if (!lastName || !firstName) {
    return { ok: false as const, error: "성과 이름을 모두 입력해주세요." };
  }
  if (lastName.length > 20 || firstName.length > 20 || !NAME_PATTERN.test(lastName) || !NAME_PATTERN.test(firstName)) {
    return { ok: false as const, error: "성과 이름은 한글 또는 영문으로 각각 20자 이하로 입력해주세요." };
  }

  return { ok: true as const, lastName, firstName, displayName: `${lastName}${firstName}` };
}
