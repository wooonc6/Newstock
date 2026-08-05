"use client";

interface CompanyQuizStat {
  company: string;
  completed: number;
  required: number;
}

interface Props {
  companies: CompanyQuizStat[];
}

export default function CompanyQuizStats({
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
        🏢 기업별 퀴즈 진행도
      </h3>

      <div
        style={{
          display: "grid",
          gap: 16,
        }}
      >
        {companies.map((company) => {
          const percent = Math.round(
            (company.completed / company.required) * 100
          );

          return (
            <div
              key={company.company}
              style={{
                border: "1px solid var(--border)",
                borderRadius: 14,
                padding: 18,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 10,
                }}
              >
                <strong>{company.company}</strong>

                <span>
                  {company.completed}/{company.required}
                </span>
              </div>

              <div
                style={{
                  width: "100%",
                  height: 10,
                  borderRadius: 999,
                  overflow: "hidden",
                  background: "#ececec",
                }}
              >
                <div
                  style={{
                    width: `${percent}%`,
                    height: "100%",
                    background:
                      percent === 100
                        ? "#22c55e"
                        : "var(--primary)",
                  }}
                />
              </div>

              <div
                style={{
                  marginTop: 8,
                  fontSize: 13,
                  color: "var(--text-muted)",
                }}
              >
                진행률 {percent}%
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
