"use client";

interface QuizHistoryItem {
  company: string;
  title: string;
  result: "정답" | "오답";
  date: string;
}

interface Props {
  history: QuizHistoryItem[];
}

export default function RecentQuizHistory({
  history,
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
        📝 최근 퀴즈 기록
      </h3>

      <div
        style={{
          display: "grid",
          gap: 14,
        }}
      >
        {history.map((item, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              border: "1px solid var(--border)",
              borderRadius: 14,
              padding: "16px 18px",
            }}
          >
            <div>
              <div
                style={{
                  fontWeight: 700,
                  marginBottom: 4,
                }}
              >
                {item.company}
              </div>

              <div
                style={{
                  fontSize: 13,
                  color: "var(--text-muted)",
                }}
              >
                {item.title}
              </div>
            </div>

            <div
              style={{
                textAlign: "right",
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  color:
                    item.result === "정답"
                      ? "#16a34a"
                      : "#dc2626",
                }}
              >
                {item.result}
              </div>

              <div
                style={{
                  marginTop: 4,
                  fontSize: 12,
                  color: "var(--text-muted)",
                }}
              >
                {item.date}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
