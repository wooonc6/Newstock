"use client";

interface Props {
  score: number;
}

export default function NewsUnderstandingScore({
  score,
}: Props) {
  let level = "기초";
  let color = "#ef4444";

  if (score >= 60) {
    level = "보통";
    color = "#f59e0b";
  }

  if (score >= 80) {
    level = "우수";
    color = "#22c55e";
  }

  if (score >= 95) {
    level = "최우수";
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
        📰 뉴스 이해도
      </h3>

      <div
        style={{
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 52,
            fontWeight: 800,
            color,
          }}
        >
          {score}점
        </div>

        <div
          style={{
            marginTop: 12,
            fontSize: 22,
            fontWeight: 700,
          }}
        >
          {level}
        </div>

        <p
          style={{
            marginTop: 18,
            color: "var(--text-muted)",
            lineHeight: 1.8,
          }}
        >
          뉴스 내용을 얼마나 정확하게 이해하고
          투자 판단에 활용하는지를 보여주는 지표입니다.
        </p>
      </div>
    </section>
  );
}
