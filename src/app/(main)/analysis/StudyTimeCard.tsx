"use client";

interface Props {
  minutes: number;
}

export default function StudyTimeCard({
  minutes,
}: Props) {
  const hours = Math.floor(minutes / 60);
  const remain = minutes % 60;

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
        ⏱️ 누적 학습 시간
      </h3>

      <div
        style={{
          fontSize: 42,
          fontWeight: 800,
        }}
      >
        {hours}시간 {remain}분
      </div>

      <p
        style={{
          marginTop: 16,
          color: "var(--text-muted)",
          lineHeight: 1.8,
        }}
      >
        뉴스를 읽고 퀴즈를 푼 시간을 합산한 학습 시간입니다.
      </p>
    </section>
  );
}
