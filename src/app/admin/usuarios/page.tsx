import { redirect } from "next/navigation";
import { AdminUsersEditor } from "@/components/admin/AdminUsersEditor";
import { getCurrentUser, isAdmin, isOwner } from "@/server/auth";
import { prisma } from "@/server/prisma";

export default async function AdminUsersPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser || !(await isAdmin(currentUser.id))) redirect("/admin");
  const owner = await isOwner(currentUser.id);
  const users = await prisma.user.findMany({
    where: owner ? undefined : { id: currentUser.id },
    select: { id: true, name: true, username: true, createdAt: true, roles: { select: { role: true } } },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
  return <AdminUsersEditor owner={owner} currentUserId={currentUser.id} initialUsers={users.map((user) => ({
    id: user.id,
    name: user.name || user.username,
    username: user.username,
    createdAt: user.createdAt.toISOString(),
    role: user.roles.some(({ role }) => role === "owner") ? "owner" : "admin",
  }))} />;
}
