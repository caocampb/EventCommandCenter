import { getI18n } from "@/locales/server";
import { LoginForm } from "./components/login-form";

export const metadata = {
  title: "Login",
};

export default async function LoginPage() {
  const t = await getI18n();
  
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-theme-bg-page">
      <div className="w-full max-w-md rounded-lg border border-theme-border-subtle bg-theme-bg-card p-8 shadow-sm">
        <h1 className="mb-6 text-2xl font-semibold text-theme-text-primary">
          {t("login.title")}
        </h1>
        <LoginForm loginLabel={t("login.submit")} />
      </div>
    </div>
  );
} 