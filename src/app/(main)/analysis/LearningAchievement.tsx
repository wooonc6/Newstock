"use client";

interface Achievement {
  title: string;
  description: string;
  achieved: boolean;
}

interface Props {
  achievements: Achievement[];
}

export default function LearningAchievement({
  achievements,
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
        🏅 학습 업적
      </h3>

      <div
        style={{
          display: "grid",
          gap: 16,
        }}
      >
        {achievements.map((achievement) => (
          <div
            key={achievement.title}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              border: "1px solid var(--border)",
              borderRadius: 14,
              padding: 18,
              opacity: achievement.achieved ? 1 : 0.45,
            }}
          >
            <div
              style={{
                fontSize: 28,
              }}
            >
              {achievement.achieved ? "🏆" : "🔒"}
            </div>

            <div>
              <div
                style={{
                  fontWeight: 700,
                  marginBottom: 6,
                }}
              >
                {achievement.title}
              </div>

              <div
                style={{
                  color: "var(--text-muted)",
                  fontSize: 14,
                  lineHeight: 1.7,
                }}
              >
                {achievement.description}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
