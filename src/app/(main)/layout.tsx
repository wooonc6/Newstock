import NavTabs from "@/components/layout/NavTabs";
import Header from "@/components/layout/Header";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ maxWidth: "740px", margin: "0 auto", padding: "24px 18px", position: "relative", zIndex: 1 }}>
      {/* Header는 auth 브랜치 완성 후 실제 유저 데이터로 교체 */}
      <Header nickname="게스트" coins={0} streak={0} />
      <NavTabs />
      {children}
    </div>
  );
}
