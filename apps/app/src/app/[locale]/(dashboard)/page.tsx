import { getI18n } from "@/locales/server";
import { getUser } from "@v1/supabase/queries";
import { DashboardContent } from "./components/dashboard-content";

// Force dynamic rendering to avoid client reference manifest issues
export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Home",
};

export default async function Page() {
  // Server-side data fetching
  const { data } = await getUser();
  const t = await getI18n();
  
  // Pass only the data needed to the client component
  const welcomeMessage = t("welcome", { name: data?.user?.email });
  return <DashboardContent userEmail={data?.user?.email} welcomeMessage={welcomeMessage} />;
}
