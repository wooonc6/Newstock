"use client";

interface Props {
  monday: number;
  tuesday: number;
  wednesday: number;
  thursday: number;
  friday: number;
  saturday: number;
  sunday: number;
}

export default function WeeklyProgress({
  monday,
  tuesday,
  wednesday,
  thursday,
  friday,
  saturday,
  sunday,
}: Props) {
  const data = [
    { day: "월", value: monday },
    { day: "화", value: tuesday },
    { day: "수", value: wednesday },
    { day: "목", value: thursday },
    { day: "금", value: friday },
    { day: "토", value: saturday },
    { day: "일", value: sunday },
  ];

  const max = Math.max(...data.map((d) => d.value), 1);

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
        📅 이번 주 학습
      </h3>

      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          height: 220,
          gap: 12,
        }}
      >
        {data.map((item) => (
          <div
            key={item.day}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                fontSize: 13,
                marginBottom: 8,
                fontWeight: 700,
              }}
            >
              {item.value}
            </div>

            <div
              style={{
                width: "100%",
                height: `${(item.value / max) * 150}px`,
                minHeight: 8,
                borderRadius: 10,
                background: "var(--primary)",
              }}
            />

            <div
              style={{
                marginTop: 10,
                fontSize: 13,
                color: "var(--text-muted)",
              }}
            >
              {item.day}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
