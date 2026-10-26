import { redirect } from "next/navigation";
import { AdminUsersEditor } from "@/components/admin/AdminUsersEditor";
import { getCurrentUser, isOwner } from "@/server/auth";
import { prisma } from "@/server/prisma";

export default async function AdminUsersPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser || !(await isOwner(currentUser.id))) redirect("/admin");
  const users = await prisma.user.findMany({
    select: { id: true, name: true, username: true, createdAt: true, roles: { select: { role: true } } },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
  return <AdminUsersEditor initialUsers={users.map((user) => ({
    id: user.id,
    name: user.name || user.username,
    username: user.username,
    createdAt: user.createdAt.toISOString(),
    role: user.roles.some(({ role }) => role === "owner") ? "owner" : "admin",
  }))} />;
}
