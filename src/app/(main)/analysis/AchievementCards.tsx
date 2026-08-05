"use client";

interface Props {
  totalQuiz: number;
  unlockedCompanies: number;
  accuracy: number;
}

export default function AchievementCards({
  totalQuiz,
  unlockedCompanies,
  accuracy,
}: Props) {
  const achievements = [
    {
      emoji: "📚",
      title: "첫 뉴스 학습",
      unlocked: totalQuiz >= 1,
    },
    {
      emoji: "📝",
      title: "퀴즈 10개 완료",
      unlocked: totalQuiz >= 10,
    },
    {
      emoji: "🏢",
      title: "기업 5개 잠금 해제",
      unlocked: unlockedCompanies >= 5,
    },
    {
      emoji: "🎯",
      title: "정답률 80% 달성",
      unlocked: accuracy >= 80,
    },
    {
      emoji: "🏆",
      title: "퀴즈 50개 완료",
      unlocked: totalQuiz >= 50,
    },
    {
      emoji: "🚀",
      title: "기업 20개 잠금 해제",
      unlocked: unlockedCompanies >= 20,
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
          fontSize: 20,
          fontWeight: 800,
          marginBottom: 20,
        }}
      >
        🏅 성장 업적
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
          gap: 16,
        }}
      >
        {achievements.map((item) => (
          <div
            key={item.title}
            style={{
              border: "1px solid var(--border)",
              borderRadius: 14,
              padding: 18,
              textAlign: "center",
              opacity: item.unlocked ? 1 : 0.45,
              background: item.unlocked
                ? "rgba(34,197,94,0.08)"
                : "transparent",
            }}
          >
            <div
              style={{
                fontSize: 36,
                marginBottom: 12,
              }}
            >
              {item.emoji}
            </div>

            <div
              style={{
                fontWeight: 700,
                marginBottom: 8,
              }}
            >
              {item.title}
            </div>

            <div
              style={{
                fontSize: 13,
                color: item.unlocked
                  ? "#16a34a"
                  : "var(--text-muted)",
              }}
            >
              {item.unlocked ? "달성 완료" : "미달성"}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
