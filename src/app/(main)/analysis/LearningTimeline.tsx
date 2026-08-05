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
          fontSize: 20,
          fontWeight: 800,
          marginBottom: 24,
        }}
      >
        🕒 학습 타임라인
      </h3>

      <div
        style={{
          display: "grid",
          gap: 18,
        }}
      >
        {items.map((item, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              gap: 16,
              alignItems: "flex-start",
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

            <div
              style={{
                flex: 1,
                borderLeft: "2px solid var(--border)",
                paddingLeft: 18,
                paddingBottom: 20,
              }}
            >
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
                {item.date}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
