"use client";

interface Company {
  name: string;
  unlocked: boolean;
}

interface Props {
  companies: Company[];
}

export default function CompanyUnlockProgress({
  companies,
}: Props) {
  const unlockedCount = companies.filter(
    (company) => company.unlocked
  ).length;

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
        🏢 기업 잠금 해제 현황
      </h3>

      <div
        style={{
          marginBottom: 18,
          fontWeight: 700,
        }}
      >
        {unlockedCount} / {companies.length}개 해제
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
          gap: 14,
        }}
      >
        {companies.map((company) => (
          <div
            key={company.name}
            style={{
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: 16,
              textAlign: "center",
              background: company.unlocked
                ? "rgba(34,197,94,0.08)"
                : "transparent",
            }}
          >
            <div
              style={{
                fontSize: 24,
                marginBottom: 8,
              }}
            >
              {company.unlocked ? "🔓" : "🔒"}
            </div>

            <div
              style={{
                fontWeight: 700,
              }}
            >
              {company.name}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
