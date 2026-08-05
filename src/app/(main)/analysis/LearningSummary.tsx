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
  let message = "";

  if (accuracy >= 90) {
    message =
      "매우 뛰어난 학습 성과입니다. 다양한 산업으로 학습 범위를 넓혀보세요.";
  } else if (accuracy >= 70) {
    message =
      "꾸준한 학습을 이어가고 있습니다. 조금만 더 노력하면 상위권입니다.";
  } else {
    message =
      "뉴스를 조금 더 꼼꼼히 읽고 퀴즈를 반복 학습해보세요.";
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
          fontSize: 22,
          fontWeight: 800,
          marginBottom: 20,
        }}
      >
        📖 학습 요약
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(180px,1fr))",
          gap: 18,
          marginBottom: 24,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 13,
              color: "var(--text-muted)",
            }}
          >
            완료한 퀴즈
          </div>

          <div
            style={{
              marginTop: 8,
              fontSize: 32,
              fontWeight: 800,
            }}
          >
            {totalQuiz}개
          </div>
        </div>

        <div>
          <div
            style={{
              fontSize: 13,
              color: "var(--text-muted)",
            }}
          >
            정답률
          </div>

          <div
            style={{
              marginTop: 8,
              fontSize: 32,
              fontWeight: 800,
            }}
          >
            {accuracy}%
          </div>
        </div>

        <div>
          <div
            style={{
              fontSize: 13,
              color: "var(--text-muted)",
            }}
          >
            잠금 해제 기업
          </div>

          <div
            style={{
              marginTop: 8,
              fontSize: 32,
              fontWeight: 800,
            }}
          >
            {unlockedCompanies}개
          </div>
        </div>

        <div>
          <div
            style={{
              fontSize: 13,
              color: "var(--text-muted)",
            }}
          >
            연속 학습
          </div>

          <div
            style={{
              marginTop: 8,
              fontSize: 32,
              fontWeight: 800,
            }}
          >
            {streak}일
          </div>
        </div>
      </div>

      <div
        style={{
          borderTop: "1px solid var(--border)",
          paddingTop: 20,
          color: "var(--text-muted)",
          lineHeight: 1.8,
        }}
      >
        {message}
      </div>
    </section>
  );
}
