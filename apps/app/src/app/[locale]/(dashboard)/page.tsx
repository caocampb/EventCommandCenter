import { SignOut } from "@/components/sign-out";
import { getI18n } from "@/locales/server";
import { getUser } from "@v1/supabase/queries";
import { ClientBoundary } from "@/utils/client-boundary";

export const metadata = {
  title: "Home",
};

export default async function Page() {
  const { data } = await getUser();
  const t = await getI18n();

  return (
    <ClientBoundary>
      <div className="h-screen w-screen flex flex-col items-center justify-center">
        <div className="flex flex-col items-center justify-center gap-4">
          <p>{t("welcome", { name: data?.user?.email })}</p>

          <SignOut />
        </div>
      </div>
    </ClientBoundary>
  );
}
