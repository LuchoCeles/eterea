"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { adminSections } from "@/components/admin/AdminSidebar";
import { AdminContentSkeleton } from "@/components/loading/AdminSkeleton";

export function AdminSectionRedirect() {
  const router = useRouter();

  useEffect(() => {
    let slug = "contenido";
    try {
      const saved = window.localStorage.getItem("eterea-admin-section");
      slug = adminSections.find((item) => item.id === saved)?.slug ?? slug;
    } catch {
      // Se abre Diseño del inicio si el navegador bloquea el almacenamiento.
    }
    router.replace(`/admin/${slug}`);
  }, [router]);

  return <AdminContentSkeleton />;
}
