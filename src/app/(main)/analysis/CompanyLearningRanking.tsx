"use client";

interface Company {
  name: string;
  solved: number;
}

interface Props {
  companies: Company[];
}

export default function CompanyLearningRanking({
  companies,
}: Props) {
  const ranking = [...companies].sort(
    (a, b) => b.solved - a.solved
  );

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
        🏆 기업별 학습 순위
      </h3>

      <div
        style={{
          display: "grid",
          gap: 14,
        }}
      >
        {ranking.map((company, index) => (
          <div
            key={company.name}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
              }}
            >
              <strong>{index + 1}위</strong>

              <span>{company.name}</span>
            </div>

            <strong>{company.solved}개</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
