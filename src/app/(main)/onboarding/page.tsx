"use client";

import { useRouter } from "next/navigation";
import NewstockLogo from "@/components/layout/NewstockLogo";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

const STEPS = [
  { step: "1단계", icon: "📰", label: "뉴스 읽기", desc: "관심 종목의 최신 뉴스를 읽어요" },
  { step: "2단계", icon: "🎯", label: "퀴즈 풀기", desc: "뉴스 내용을 퀴즈로 확인해요" },
  { step: "3단계", icon: "📈", label: "투자하기", desc: "퀴즈를 풀면 모의 투자가 열려요" },
];

export default function OnboardingPage() {
  const router = useRouter();

  return (
    <div
      style={{
        minHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "24px 8px",
        gap: "36px",
      }}
    >
      <div style={{ display: "grid", gap: "14px", justifyItems: "center" }}>
        <NewstockLogo size={56} />
        <div style={{ display: "grid", gap: "4px" }}>
          <strong style={{ fontSize: "22px" }}>Newstock</strong>
          <p style={{ fontSize: "13px", color: "var(--text-dim)" }}>뉴스로 배우는 모의 주식 투자</p>
        </div>
      </div>

      <div style={{ display: "grid", gap: "10px", width: "100%", maxWidth: "360px" }}>
        {STEPS.map(({ step, icon, label, desc }) => (
          <Card key={step} padding="14px 16px">
            <div style={{ display: "flex", alignItems: "center", gap: "14px", textAlign: "left" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "40px",
                  height: "40px",
                  borderRadius: "12px",
                  background: "var(--surface2)",
                  fontSize: "18px",
                  flexShrink: 0,
                }}
                aria-hidden="true"
              >
                {icon}
              </span>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "var(--accent2)",
                    marginBottom: "2px",
                  }}
                >
                  {step}
                </div>
                <div style={{ fontSize: "14px", fontWeight: 700 }}>{label}</div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>{desc}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Button size="md" fullWidth style={{ maxWidth: "360px" }} onClick={() => router.push("/dashboard")}>
        시작하기 →
      </Button>
    </div>
  );
}
