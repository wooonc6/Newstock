"use client";

interface Props {
  totalMinutes: number;
  studyDays: number;
}

export default function AverageStudyTime({
  totalMinutes,
  studyDays,
}: Props) {
  const average =
    studyDays === 0
      ? 0
      : Math.round(totalMinutes / studyDays);

  return (
    <section
      style={{
        border: "1px solid var(--border)",
        borderRadius: 18,
        background: "var(--surface)",
        padding: 24,
      }}
    >
      <h3
        style={{
          fontSize: 20,
          fontWeight: 800,
          marginBottom: 20,
        }}
      >
        ⌛ 하루 평균 학습 시간
      </h3>

      <div
        style={{
          fontSize: 44,
          fontWeight: 800,
        }}
      >
        {average}분
      </div>

      <p
        style={{
          marginTop: 16,
          color: "var(--text-muted)",
          lineHeight: 1.8,
        }}
      >
        학습한 날짜를 기준으로 계산한 평균 학습 시간입니다.
      </p>
    </section>
  );
}
