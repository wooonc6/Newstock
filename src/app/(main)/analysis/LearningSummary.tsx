"use client";

interface Props {
  totalQuiz: number;
  accuracy: number;
  unlockedCompanies: number;
  streak: number;
}

export default function LearningSummary({
  totalQuiz,
  accuracy,
  unlockedCompanies,
  streak,
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
        📖 학습 요약
      </h3>

      <div
        style={{
          display: "grid",
          gap: 12,
          lineHeight: 1.8,
          color: "var(--text-muted)",
        }}
      >
        <div>✅ 완료한 뉴스 퀴즈 : {totalQuiz}개</div>

        <div>🎯 평균 정답률 : {accuracy}%</div>

        <div>🏢 기업 잠금 해제 : {unlockedCompanies}개</div>

        <div>🔥 연속 학습 : {streak}일</div>

        <div
          style={{
            marginTop: 8,
            paddingTop: 16,
            borderTop: "1px solid var(--border)",
          }}
        >
          꾸준한 뉴스 학습은 투자 판단력 향상에 큰 도움이 됩니다.
          앞으로도 매일 뉴스를 읽고 퀴즈를 풀며 성장해보세요.
        </div>
      </div>
    </section>
  );
}
