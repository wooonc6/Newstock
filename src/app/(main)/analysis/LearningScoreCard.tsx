"use client";

interface Props {
  score: number;
}

export default function LearningScoreCard({
  score,
}: Props) {
  let grade = "C";

  if (score >= 60) grade = "B";
  if (score >= 80) grade = "A";
  if (score >= 95) grade = "S";

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
        ⭐ 종합 학습 점수
      </h3>

      <div
        style={{
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 54,
            fontWeight: 800,
            color: "var(--primary)",
          }}
        >
          {score}
        </div>

        <div
          style={{
            marginTop: 10,
            fontSize: 26,
            fontWeight: 800,
          }}
        >
          {grade} 등급
        </div>

        <p
          style={{
            marginTop: 18,
            color: "var(--text-muted)",
            lineHeight: 1.8,
          }}
        >
          뉴스 학습량, 퀴즈 정답률,
          <br />
          기업 잠금 해제 등을 종합하여 계산한 점수입니다.
        </p>
      </div>
    </section>
  );
}
