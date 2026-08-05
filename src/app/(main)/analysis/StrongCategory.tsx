"use client";

interface Category {
  name: string;
  accuracy: number;
}

interface Props {
  categories: Category[];
}

export default function StrongCategory({
  categories,
}: Props) {
  const sorted = [...categories].sort(
    (a, b) => b.accuracy - a.accuracy
  );

  const strong = sorted[0];

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
        🏆 가장 강한 분야
      </h3>

      <div
        style={{
          border: "1px solid var(--border)",
          borderRadius: 14,
          padding: 20,
        }}
      >
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            marginBottom: 10,
          }}
        >
          {strong.name}
        </div>

        <div
          style={{
            fontSize: 32,
            fontWeight: 800,
            color: "#16a34a",
          }}
        >
          {strong.accuracy}%
        </div>

        <p
          style={{
            marginTop: 16,
            color: "var(--text-muted)",
            lineHeight: 1.8,
          }}
        >
          현재 가장 높은 정답률을 기록한 분야입니다.
          <br />
          꾸준히 학습하여 강점을 계속 유지해보세요.
        </p>
      </div>
    </section>
  );
}
