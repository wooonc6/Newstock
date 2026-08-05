"use client";

interface Company {
  name: string;
  unlockedAt: string;
}

interface Props {
  companies: Company[];
}

export default function RecentUnlockedCompanies({
  companies,
}: Props) {
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
        🎉 최근 잠금 해제한 기업
      </h3>

      <div
        style={{
          display: "grid",
          gap: 14,
        }}
      >
        {companies.map((company) => (
          <div
            key={company.name}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              border: "1px solid var(--border)",
              borderRadius: 14,
              padding: 16,
            }}
          >
            <div>
              <div
                style={{
                  fontWeight: 700,
                }}
              >
                🔓 {company.name}
              </div>

              <div
                style={{
                  marginTop: 6,
                  fontSize: 13,
                  color: "var(--text-muted)",
                }}
              >
                기업 잠금 해제 완료
              </div>
            </div>

            <div
              style={{
                fontSize: 13,
                color: "var(--text-muted)",
              }}
            >
              {company.unlockedAt}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
