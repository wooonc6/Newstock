"use client";

interface Props {
  accuracy: number;
  streak: number;
}

export default function LearningTips({
  accuracy,
  streak,
}: Props) {
  const tips: string[] = [];

  if (accuracy < 70) {
    tips.push("뉴스를 끝까지 읽고 핵심 내용을 정리한 뒤 퀴즈를 풀어보세요.");
  }

  if (streak < 7) {
    tips.push("매일 1개의 뉴스만 학습해도 연속 학습 기록을 이어갈 수 있습니다.");
  }

  if (accuracy >= 70 && streak >= 7) {
    tips.push("현재 좋은 학습 습관을 유지하고 있습니다.");
    tips.push("다양한 산업의 뉴스를 학습하면 투자 시야가 더욱 넓어집니다.");
  }

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
        💡 학습 팁
      </h3>

      <div
        style={{
          display: "grid",
          gap: 14,
        }}
      >
        {tips.map((tip, index) => (
          <div
            key={index}
            style={{
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: 16,
              lineHeight: 1.8,
            }}
          >
            {tip}
          </div>
        ))}
      </div>
    </section>
  );
}
