import { redirect } from "next/navigation";

export const metadata = { title: "Ingresar — Etérea", robots: { index: false, follow: false } };

export default function LoginPage() {
  redirect("/auth");
}
