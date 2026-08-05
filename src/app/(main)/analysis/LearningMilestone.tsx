"use client";

interface Milestone {
  target: number;
  title: string;
}

interface Props {
  current: number;
}

export default function LearningMilestone({
  current,
}: Props) {
  const milestones: Milestone[] = [
    { target: 10, title: "뉴스 입문" },
    { target: 30, title: "뉴스 탐험가" },
    { target: 50, title: "기업 분석가" },
    { target: 100, title: "투자 전문가" },
  ];

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
          marginBottom: 24,
        }}
      >
        🚩 학습 마일스톤
      </h3>

      <div
        style={{
          display: "grid",
          gap: 16,
        }}
      >
        {milestones.map((item) => {
          const completed = current >= item.target;

          return (
            <div
              key={item.target}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: 16,
                opacity: completed ? 1 : 0.5,
              }}
            >
              <div>
                <div
                  style={{
                    fontWeight: 700,
                  }}
                >
                  {item.title}
                </div>

                <div
                  style={{
                    marginTop: 6,
                    fontSize: 13,
                    color: "var(--text-muted)",
                  }}
                >
                  퀴즈 {item.target}개 완료
                </div>
              </div>

              <div
                style={{
                  fontSize: 24,
                }}
              >
                {completed ? "✅" : "⏳"}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
