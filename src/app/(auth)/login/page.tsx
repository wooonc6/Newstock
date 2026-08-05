import AuthForm from "@/components/auth/AuthForm";
import Footer from "@/components/layout/Footer";

export default function LoginPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "18px",
        padding: "20px",
      }}
    >
      <AuthForm />
      <div style={{ width: "100%", maxWidth: "440px" }}>
        <Footer />
      </div>
    </div>
  );
}
