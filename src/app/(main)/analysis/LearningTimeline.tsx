"use client";

interface TimelineItem {
  title: string;
  date: string;
}

interface Props {
  items: TimelineItem[];
}

export default function LearningTimeline({
  items,
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
          marginBottom: 24,
        }}
      >
        📅 학습 타임라인
      </h3>

      <div
        style={{
          display: "grid",
          gap: 20,
        }}
      >
        {items.length === 0 ? (
          <div
            style={{
              color: "var(--text-muted)",
            }}
          >
            아직 학습 기록이 없습니다.
          </div>
        ) : (
          items.map((item, index) => (
            <div
              key={`${item.title}-${index}`}
              style={{
                display: "flex",
                gap: 18,
              }}
            >
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: "var(--primary)",
                  marginTop: 6,
                  flexShrink: 0,
                }}
              />

              <div>
                <div
                  style={{
                    fontWeight: 700,
                    marginBottom: 4,
                  }}
                >
                  {item.title}
                </div>

                <div
                  style={{
                    fontSize: 13,
                    color: "var(--text-muted)",
                  }}
                >
                  {item.date}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
