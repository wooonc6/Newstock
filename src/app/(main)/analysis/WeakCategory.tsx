"use client";

interface Category {
  name: string;
  accuracy: number;
}

interface Props {
  categories: Category[];
}

export default function WeakCategory({
  categories,
}: Props) {
  const sorted = [...categories].sort(
    (a, b) => a.accuracy - b.accuracy
  );

  const weak = sorted[0];

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
        📌 보완이 필요한 분야
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
          {weak.name}
        </div>

        <div
          style={{
            fontSize: 32,
            fontWeight: 800,
            color: "#ef4444",
          }}
        >
          {weak.accuracy}%
        </div>

        <p
          style={{
            marginTop: 16,
            color: "var(--text-muted)",
            lineHeight: 1.8,
          }}
        >
          최근 이 분야의 뉴스 퀴즈 정답률이 가장 낮습니다.
          <br />
          관련 뉴스를 조금 더 학습하면 전체 투자 판단력이 향상됩니다.
        </p>
      </div>
    </section>
  );
}
