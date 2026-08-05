"use client";

interface NewsItem {
  company: string;
  title: string;
  reason: string;
}

interface Props {
  news: NewsItem[];
}

export default function RecommendedNews({
  news,
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
        📰 추천 뉴스
      </h3>

      <div
        style={{
          display: "grid",
          gap: 16,
        }}
      >
        {news.map((item, index) => (
          <div
            key={index}
            style={{
              border: "1px solid var(--border)",
              borderRadius: 14,
              padding: 18,
            }}
          >
            <div
              style={{
                fontWeight: 700,
                marginBottom: 8,
              }}
            >
              {item.company}
            </div>

            <div
              style={{
                fontSize: 16,
                marginBottom: 10,
              }}
            >
              {item.title}
            </div>

            <div
              style={{
                color: "var(--text-muted)",
                fontSize: 14,
                lineHeight: 1.7,
              }}
            >
              추천 이유 : {item.reason}
            </div>
          </div>
        ))}
      </div>
    </section>
