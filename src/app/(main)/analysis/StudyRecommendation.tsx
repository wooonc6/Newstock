"use client";

interface Props {
  accuracy: number;
  streak: number;
  unlockedCompanies: number;
}

export default function StudyRecommendation({
  accuracy,
  streak,
  unlockedCompanies,
}: Props) {
  let title = "";
  let message = "";

  if (accuracy < 60) {
    title = "정답률 향상";
    message =
      "뉴스를 조금 더 꼼꼼히 읽고 핵심 내용을 정리한 뒤 퀴즈를 풀어보세요.";
  } else if (streak < 7) {
    title = "꾸준한 학습";
    message =
      "매일 뉴스 1개만 학습해도 투자 실력이 꾸준히 성장합니다.";
  } else if (unlockedCompanies < 10) {
    title = "기업 확장";
    message =
      "새로운 기업의 뉴스를 학습하여 투자 가능한 기업을 늘려보세요.";
  } else {
    title = "아주 좋습니다!";
    message =
      "현재 매우 좋은 학습 습관을 유지하고 있습니다. 다양한 산업의 뉴스를 계속 학습해보세요.";
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
          marginBottom: 18,
        }}
      >
        💡 AI 학습 추천
      </h3>

      <div
        style={{
          fontSize: 18,
          fontWeight: 700,
          marginBottom: 12,
        }}
      >
        {title}
      </div>

      <p
        style={{
          color: "var(--text-muted)",
          lineHeight: 1.8,
        }}
      >
        {message}
      </p>
    </section>
  );
}
