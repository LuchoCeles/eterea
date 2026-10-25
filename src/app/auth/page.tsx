import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/AuthForm";
import { getCurrentUser, isAdmin } from "@/server/auth";

export const metadata = { title: "Administración — Etérea", robots: { index: false, follow: false } };

export default async function AuthPage() {
  const user = await getCurrentUser();
  if (user && (await isAdmin(user.id))) redirect("/admin");
  return <AuthForm />;
}