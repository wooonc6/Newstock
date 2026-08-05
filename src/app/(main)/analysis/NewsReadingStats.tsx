"use client";

interface Props {
  articlesRead: number;
  averagePerDay: number;
}

export default function NewsReadingStats({
  articlesRead,
  averagePerDay,
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
        📰 뉴스 학습 통계
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
          gap: 20,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 13,
              color: "var(--text-muted)",
            }}
          >
            읽은 뉴스
          </div>

          <div
            style={{
              marginTop: 8,
              fontSize: 34,
              fontWeight: 800,
            }}
          >
            {articlesRead}개
          </div>
        </div>

        <div>
          <div
            style={{
              fontSize: 13,
              color: "var(--text-muted)",
            }}
          >
            하루 평균
          </div>

          <div
            style={{
              marginTop: 8,
              fontSize: 34,
              fontWeight: 800,
            }}
          >
            {averagePerDay}개
          </div>
        </div>
      </div>

      <p
        style={{
          marginTop: 20,
          color: "var(--text-muted)",
          lineHeight: 1.8,
        }}
      >
        꾸준히 뉴스를 읽을수록 기업과 산업을 이해하는 능력이 향상됩니다.
      </p>
    </section>
  );
}
