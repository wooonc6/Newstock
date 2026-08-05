"use client";

interface Props {
  totalQuiz: number;
  correctQuiz: number;
  unlockedCompanies: number;
}

export default function LearningInsight({
  totalQuiz,
  correctQuiz,
  unlockedCompanies,
}: Props) {
  const accuracy =
    totalQuiz === 0
      ? 0
      : Math.round((correctQuiz / totalQuiz) * 100);

  let message =
    "뉴스 퀴즈를 꾸준히 풀어 투자 기초를 다져보세요.";

  if (accuracy >= 90) {
    message =
      "훌륭합니다! 뉴스를 정확하게 이해하며 투자 역량이 빠르게 성장하고 있습니다.";
  } else if (accuracy >= 75) {
    message =
      "좋은 흐름입니다. 꾸준히 퀴즈를 풀면 더 많은 기업을 잠금 해제할 수 있습니다.";
  } else if (accuracy >= 60) {
    message =
      "조금만 더 학습하면 정답률과 투자 판단력이 함께 향상될 것입니다.";
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
        🧠 학습 인사이트
      </h3>

      <div
        style={{
          lineHeight: 1.9,
          color: "var(--text-muted)",
        }}
      >
        <p>{message}</p>

        <br />

        <strong>현재 학습 현황</strong>

        <ul
          style={{
            marginTop: 12,
            paddingLeft: 20,
          }}
        >
          <li>완료한 뉴스 퀴즈 : {totalQuiz}개</li>
          <li>정답률 : {accuracy}%</li>
          <li>기업 잠금 해제 : {unlockedCompanies}개</li>
        </ul>
      </div>
    </section>
  );
}
