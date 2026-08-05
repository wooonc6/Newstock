"use client";

interface Props {
  unlocked: number;
  total: number;
}

export default function CompanyUnlockProgress({
  unlocked,
  total,
}: Props) {
  const percent =
    total === 0
      ? 0
      : Math.round((unlocked / total) * 100);

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
          fontSize: 22,
          fontWeight: 800,
          marginBottom: 22,
        }}
      >
        🏢 기업 잠금 해제 진행률
      </h3>

      <div
        style={{
          fontSize: 42,
          fontWeight: 800,
          marginBottom: 10,
        }}
      >
        {unlocked} / {total}
      </div>

      <div
        style={{
          width: "100%",
          height: 14,
          background: "#ececec",
          borderRadius: 999,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${percent}%`,
            height: "100%",
            background: "var(--primary)",
          }}
        />
      </div>

      <div
        style={{
          marginTop: 12,
          color: "var(--text-muted)",
        }}
      >
        전체 기업의 {percent}%를 학습했습니다.
      </div>
    </section>
  );
}
