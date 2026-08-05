"use client";

interface Props {
  score: number;
}

export default function LearningRank({
  score,
}: Props) {
  let rank = "Bronze";
  let color = "#b45309";

  if (score >= 40) {
    rank = "Silver";
    color = "#6b7280";
  }

  if (score >= 70) {
    rank = "Gold";
    color = "#f59e0b";
  }

  if (score >= 90) {
    rank = "Diamond";
    color = "#2563eb";
  }

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
        🏅 학습 등급
      </h3>

      <div
        style={{
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 44,
            fontWeight: 800,
            color,
          }}
        >
          {rank}
        </div>

        <div
          style={{
            marginTop: 12,
            fontSize: 18,
            fontWeight: 700,
          }}
        >
          {score}점
        </div>

        <p
          style={{
            marginTop: 16,
            color: "var(--text-muted)",
            lineHeight: 1.8,
          }}
        >
          뉴스 학습, 퀴즈 정답률,
          <br />
          기업 잠금 해제 등을 종합한 등급입니다.
        </p>
      </div>
    </section>
  );
}
