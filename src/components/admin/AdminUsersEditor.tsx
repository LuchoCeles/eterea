"use client";

import { useState, type FormEvent } from "react";
import { KeyRound, LockKeyhole, Pencil, Plus, Trash2 } from "lucide-react";

type AdminUser = { id: string; name: string; username: string; createdAt: string; role: string };

async function responseData(response: Response) {
  return response.json().catch(() => ({}));
}

export function AdminUsersEditor({ initialUsers }: { initialUsers: AdminUser[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyId("new");
    setMessage(null);
    setError(null);
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, username, password }),
      });
      const data = await responseData(response);
      if (!response.ok) throw new Error(data.error ?? "No se pudo crear el usuario.");
      setUsers((current) => [...current, data.user]);
      setName("");
      setUsername("");
      setPassword("");
      setMessage(`Se creó la cuenta de ${data.user.name}.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo crear el usuario.");
    } finally {
      setBusyId(null);
    }
  }

  async function saveUser(event: FormEvent<HTMLFormElement>, user: AdminUser) {
    event.preventDefault();
    setBusyId(user.id);
    setMessage(null);
    setError(null);
    try {
      const changes = {
        ...(editName.trim() !== user.name && { name: editName.trim() }),
        ...(user.role !== "owner" && editUsername.trim() !== user.username && { username: editUsername.trim() }),
        ...(user.role !== "owner" && editPassword && { password: editPassword }),
      };
      if (Object.keys(changes).length === 0) {
        setEditingId(null);
        return;
      }
      const response = await fetch(`/api/admin/users/${encodeURIComponent(user.id)}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(changes),
      });
      const data = await responseData(response);
      if (!response.ok) throw new Error(data.error ?? "No se pudo actualizar el usuario.");
      setUsers((current) => current.map((item) => item.id === user.id
        ? { ...item, name: data.user.name, username: data.user.username }
        : item));
      setEditPassword("");
      setEditingId(null);
      setMessage(`Se actualizó la cuenta de ${data.user.name}.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo actualizar el usuario.");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteUser(user: AdminUser) {
    if (!window.confirm(`¿Eliminar la cuenta de ${user.name} (${user.username})? Esta acción no se puede deshacer.`)) return;
    setBusyId(user.id);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch(`/api/admin/users/${encodeURIComponent(user.id)}`, { method: "DELETE" });
      const data = await responseData(response);
      if (!response.ok) throw new Error(data.error ?? "No se pudo eliminar el usuario.");
      setUsers((current) => current.filter((item) => item.id !== user.id));
      setMessage(`Se eliminó la cuenta de ${user.name}.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo eliminar el usuario.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-[1120px] pb-8">
      <div className="sticky top-0 z-20 -mx-5 mb-7 bg-background/95 px-5 py-5 backdrop-blur-xl sm:-mx-7 sm:px-7 lg:-mx-10 lg:px-10 xl:-mx-12 xl:px-12">
        <h2 className="font-display text-[28px] font-semibold leading-tight sm:text-[38px]">Usuarios</h2>
        <p className="mt-1 text-xs text-muted-foreground sm:text-base">Creá y administrá las cuentas que acceden al panel.</p>
      </div>

      {message && <p role="status" className="mb-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm">{message}</p>}
      {error && <p role="alert" className="mb-5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}

      <form onSubmit={createUser} className="admin-card-surface mb-7 rounded-[22px] border border-border p-5 sm:p-7">
        <h3 className="font-display text-xl font-semibold">Crear administrador</h3>
        <p className="mt-1 text-sm text-muted-foreground">La cuenta nueva podrá administrar la tienda, pero no gestionar usuarios.</p>
        <p className="mt-3 text-sm text-muted-foreground">El nombre identifica a quién pertenece la cuenta y aparece en la barra superior del panel.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="grid gap-2 text-sm font-medium">Nombre
            <input value={name} onChange={(event) => setName(event.target.value)} required maxLength={100} autoComplete="name" className="h-11 rounded-lg border bg-background px-3" />
          </label>
          <label className="grid gap-2 text-sm font-medium">Usuario
            <input value={username} onChange={(event) => setUsername(event.target.value)} required minLength={3} maxLength={191} pattern="[a-zA-Z0-9._@+\-]+" autoComplete="off" className="h-11 rounded-lg border bg-background px-3" />
          </label>
          <label className="grid gap-2 text-sm font-medium">Contraseña
            <input value={password} onChange={(event) => setPassword(event.target.value)} required minLength={12} maxLength={128} type="password" autoComplete="new-password" className="h-11 rounded-lg border bg-background px-3" />
          </label>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Usá al menos 12 caracteres para la contraseña.</p>
        <button disabled={busyId !== null} className="admin-save-button mt-5 inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold disabled:opacity-50"><Plus className="h-4 w-4" />Crear usuario</button>
      </form>

      <div className="space-y-3">
        <h3 className="font-display text-xl font-semibold">Cuentas del panel</h3>
        {users.map((user) => (
          <div key={user.id} className="admin-card-surface rounded-[22px] border border-border p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{user.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">Usuario: {user.username} · {user.role === "owner" ? "Dueño" : "Administrador"} · Desde {new Date(user.createdAt).toLocaleDateString("es-AR")}</p>
              </div>
              {user.role === "owner" ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs"><LockKeyhole className="h-3.5 w-3.5" />Credenciales protegidas</span>
                  <button type="button" disabled={busyId !== null} onClick={() => { setEditingId(user.id); setEditName(user.name); setError(null); }} className="inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm hover:bg-secondary disabled:opacity-50"><Pencil className="h-4 w-4" />Editar nombre</button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <button type="button" disabled={busyId !== null} onClick={() => { setEditingId(user.id); setEditName(user.name); setEditUsername(user.username); setEditPassword(""); setError(null); }} className="inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm hover:bg-secondary disabled:opacity-50"><KeyRound className="h-4 w-4" />Editar</button>
                  <button type="button" disabled={busyId !== null} onClick={() => void deleteUser(user)} className="inline-flex h-10 items-center gap-2 rounded-lg border border-destructive/40 px-3 text-sm text-destructive hover:bg-destructive/10 disabled:opacity-50"><Trash2 className="h-4 w-4" />Eliminar</button>
                </div>
              )}
            </div>
            {editingId === user.id && (
              <form onSubmit={(event) => void saveUser(event, user)} className="mt-5 border-t border-border pt-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-medium">Nombre
                    <input value={editName} onChange={(event) => setEditName(event.target.value)} required maxLength={100} autoComplete="name" className="h-11 rounded-lg border bg-background px-3" />
                  </label>
                  {user.role !== "owner" && <>
                    <label className="grid gap-2 text-sm font-medium">Usuario
                      <input value={editUsername} onChange={(event) => setEditUsername(event.target.value)} required minLength={3} maxLength={191} pattern="[a-zA-Z0-9._@+\-]+" className="h-11 rounded-lg border bg-background px-3" />
                    </label>
                    <label className="grid gap-2 text-sm font-medium">Contraseña nueva
                      <input value={editPassword} onChange={(event) => setEditPassword(event.target.value)} minLength={12} maxLength={128} type="password" autoComplete="new-password" placeholder="Dejá en blanco para conservarla" className="h-11 rounded-lg border bg-background px-3" />
                    </label>
                  </>}
                </div>
                <div className="mt-4 flex gap-2">
                  <button disabled={busyId !== null} className="admin-save-button h-11 rounded-xl px-4 text-sm font-semibold disabled:opacity-50">Guardar cambios</button>
                  <button type="button" onClick={() => { setEditingId(null); setEditPassword(""); }} className="h-11 rounded-xl border px-4 text-sm">Cancelar</button>
                </div>
              </form>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
