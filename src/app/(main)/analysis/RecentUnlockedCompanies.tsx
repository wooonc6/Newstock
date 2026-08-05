"use client";

interface Company {
  name: string;
  date: string;
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
          fontSize: 22,
          fontWeight: 800,
          marginBottom: 22,
        }}
      >
        🔓 최근 잠금 해제 기업
      </h3>

      <div
        style={{
          display: "grid",
          gap: 14,
        }}
      >
        {companies.length === 0 ? (
          <div
            style={{
              color: "var(--text-muted)",
            }}
          >
            아직 잠금 해제한 기업이 없습니다.
          </div>
        ) : (
          companies.map((company) => (
            <div
              key={`${company.name}-${company.date}`}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: 16,
              }}
            >
              <strong>{company.name}</strong>

              <span
                style={{
                  color: "var(--text-muted)",
                  fontSize: 13,
                }}
              >
                {company.date}
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
