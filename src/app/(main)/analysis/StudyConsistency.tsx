"use client";

interface Props {
  currentStreak: number;
  bestStreak: number;
}

export default function StudyConsistency({
  currentStreak,
  bestStreak,
}: Props) {
  const ratio =
    bestStreak === 0
      ? 0
      : Math.round((currentStreak / bestStreak) * 100);

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
        🔥 학습 꾸준함
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2,1fr)",
          gap: 20,
        }}
      >
        <div>
          <div
            style={{
              color: "var(--text-muted)",
              fontSize: 13,
            }}
          >
            현재 연속 학습
          </div>

          <div
            style={{
              marginTop: 8,
              fontSize: 34,
              fontWeight: 800,
            }}
          >
            {currentStreak}일
          </div>
        </div>

        <div>
          <div
            style={{
              color: "var(--text-muted)",
              fontSize: 13,
            }}
          >
            최고 기록
          </div>

          <div
            style={{
              marginTop: 8,
              fontSize: 34,
              fontWeight: 800,
            }}
          >
            {bestStreak}일
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 24,
        }}
      >
        <div
          style={{
            width: "100%",
            height: 12,
            background: "#ececec",
            borderRadius: 999,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${ratio}%`,
              height: "100%",
              background: "var(--primary)",
            }}
          />
        </div>

        <div
          style={{
            marginTop: 10,
            fontSize: 13,
            color: "var(--text-muted)",
          }}
        >
          최고 기록 대비 {ratio}%
        </div>
      </div>
    </section>
  );
}
