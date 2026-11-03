import { redirect } from "next/navigation";
import { AdminUsersEditor } from "@/components/admin/AdminUsersEditor";
import { getCurrentUser } from "@/server/auth";
import { prisma } from "@/server/prisma";

export default async function AdminUsersPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser?.isAdmin) redirect("/admin");
  const owner = currentUser.isOwner;
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
