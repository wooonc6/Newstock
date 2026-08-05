"use client";

interface Props {
  totalQuiz: number;
  unlockedCompanies: number;
  streak: number;
}

export default function LearningAchievement({
  totalQuiz,
  unlockedCompanies,
  streak,
}: Props) {
  const achievements = [
    {
      title: "첫 퀴즈",
      unlocked: totalQuiz >= 1,
    },
    {
      title: "퀴즈 10개",
      unlocked: totalQuiz >= 10,
    },
    {
      title: "기업 5개 해제",
      unlocked: unlockedCompanies >= 5,
    },
    {
      title: "기업 10개 해제",
      unlocked: unlockedCompanies >= 10,
    },
    {
      title: "7일 연속 학습",
      unlocked: streak >= 7,
    },
    {
      title: "30일 연속 학습",
      unlocked: streak >= 30,
    },
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
          fontSize: 22,
          fontWeight: 800,
          marginBottom: 24,
        }}
      >
        🏆 학습 업적
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(180px,1fr))",
          gap: 18,
        }}
      >
        {achievements.map((achievement) => (
          <div
            key={achievement.title}
            style={{
              border: "1px solid var(--border)",
              borderRadius: 14,
              padding: 20,
              textAlign: "center",
              opacity: achievement.unlocked ? 1 : 0.45,
            }}
          >
            <div
              style={{
                fontSize: 36,
                marginBottom: 12,
              }}
            >
              {achievement.unlocked ? "🏅" : "🔒"}
            </div>

            <div
              style={{
                fontWeight: 700,
              }}
            >
              {achievement.title}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
