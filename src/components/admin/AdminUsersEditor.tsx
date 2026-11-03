"use client";

import { useState, type FormEvent } from "react";
import { Eye, EyeOff, KeyRound, Pencil, Plus, Trash2 } from "lucide-react";
import { changePasswordAction, createUserAction, deleteUserAction, updateUserAction } from "@/app/actions/users";

type AdminUser = { id: string; name: string; username: string; createdAt: string; role: string };

function PasswordField({ id, label, value, onChange, autoComplete, required, minLength }: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  required?: boolean;
  minLength?: number;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="grid gap-2 text-sm font-medium">{label}
      <span className="relative block">
        <input id={id} value={value} onChange={(event) => onChange(event.target.value)} required={required}
          minLength={minLength} maxLength={128} type={visible ? "text" : "password"} autoComplete={autoComplete}
          className="h-11 w-full rounded-lg border bg-background px-3 pr-12" />
        <button type="button" aria-controls={id} aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          aria-pressed={visible} onClick={() => setVisible((current) => !current)}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring">
          {visible ? <EyeOff aria-hidden="true" className="h-4 w-4" /> : <Eye aria-hidden="true" className="h-4 w-4" />}
        </button>
      </span>
    </label>
  );
}

export function AdminUsersEditor({ initialUsers, currentUserId, owner }: { initialUsers: AdminUser[]; currentUserId: string; owner: boolean }) {
  const [users, setUsers] = useState(initialUsers);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [passwordEditingId, setPasswordEditingId] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyId("new");
    setMessage(null);
    setError(null);
    try {
      const result = await createUserAction({ name, username, password });
      if ("error" in result) throw new Error(result.error);
      setUsers((current) => [...current, result.user]);
      setName("");
      setUsername("");
      setPassword("");
      setMessage(`Se creó la cuenta de ${result.user.name}.`);
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
      };
      if (Object.keys(changes).length === 0) {
        setEditingId(null);
        return;
      }
      const result = await updateUserAction(user.id, changes);
      if ("error" in result) throw new Error(result.error);
      setUsers((current) => current.map((item) => item.id === user.id
        ? { ...item, name: result.user.name, username: result.user.username }
        : item));
      setEditingId(null);
      setMessage(`Se actualizó la cuenta de ${result.user.name}.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo actualizar el usuario.");
    } finally {
      setBusyId(null);
    }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>, user: AdminUser) {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage(null);
      setError("Las contraseñas nuevas no coinciden.");
      return;
    }
    setBusyId(user.id);
    setMessage(null);
    setError(null);
    try {
      const result = await changePasswordAction(user.id, { password: newPassword, ...(user.id === currentUserId && { currentPassword }) });
      if ("error" in result) throw new Error(result.error);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordEditingId(null);
      setMessage(user.id === currentUserId ? "Se cambió tu contraseña." : `Se cambió la contraseña de ${user.name}.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo cambiar la contraseña.");
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
      const result = await deleteUserAction(user.id);
      if ("error" in result) throw new Error(result.error);
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
        <h2 className="font-display text-[28px] font-semibold leading-tight sm:text-[38px]">{owner ? "Usuarios" : "Mi cuenta"}</h2>
        <p className="mt-1 text-xs text-muted-foreground sm:text-base">{owner ? "Creá y administrá las cuentas que acceden al panel." : "Cambiá la contraseña de tu cuenta."}</p>
      </div>

      {message && <p role="status" className="mb-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm">{message}</p>}
      {error && <p role="alert" className="mb-5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}

      {owner && <form onSubmit={createUser} className="admin-card-surface mb-7 rounded-[22px] border border-border p-5 sm:p-7">
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
          <PasswordField id="admin-user-password" label="Contraseña" value={password} onChange={setPassword} required minLength={12} autoComplete="new-password" />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Usá al menos 12 caracteres para la contraseña.</p>
        <button disabled={busyId !== null} className="admin-save-button mt-5 inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold disabled:opacity-50"><Plus className="h-4 w-4" />Crear usuario</button>
      </form>}

      <div className="space-y-3">
        {owner && <h3 className="font-display text-xl font-semibold">Cuentas del panel</h3>}
        {users.map((user) => (
          <div key={user.id} className="admin-card-surface rounded-[22px] border border-border p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{user.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">Usuario: {user.username} · {user.role === "owner" ? "Dueño" : "Administrador"} · Desde {new Date(user.createdAt).toLocaleDateString("es-AR")}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {owner && <button type="button" disabled={busyId !== null} onClick={() => { setPasswordEditingId(null); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); setEditingId(user.id); setEditName(user.name); setEditUsername(user.username); setError(null); }} className="inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm hover:bg-secondary disabled:opacity-50"><Pencil className="h-4 w-4" />{user.role === "owner" ? "Editar nombre" : "Editar"}</button>}
                <button type="button" disabled={busyId !== null} onClick={() => { setEditingId(null); setPasswordEditingId(user.id); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); setError(null); }} className="inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm hover:bg-secondary disabled:opacity-50"><KeyRound className="h-4 w-4" />Cambiar contraseña</button>
                {owner && user.role !== "owner" && <button type="button" disabled={busyId !== null} onClick={() => void deleteUser(user)} className="inline-flex h-10 items-center gap-2 rounded-lg border border-destructive/40 px-3 text-sm text-destructive hover:bg-destructive/10 disabled:opacity-50"><Trash2 className="h-4 w-4" />Eliminar</button>}
              </div>
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
                  </>}
                </div>
                <div className="mt-4 flex gap-2">
                  <button disabled={busyId !== null} className="admin-save-button h-11 rounded-xl px-4 text-sm font-semibold disabled:opacity-50">Guardar cambios</button>
                  <button type="button" onClick={() => setEditingId(null)} className="h-11 rounded-xl border px-4 text-sm">Cancelar</button>
                </div>
              </form>
            )}
            {passwordEditingId === user.id && (
              <form onSubmit={(event) => void changePassword(event, user)} className="mt-5 border-t border-border pt-5">
                <h4 className="font-semibold">{user.id === currentUserId ? "Cambiar mi contraseña" : `Cambiar contraseña de ${user.name}`}</h4>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {user.id === currentUserId && <PasswordField id={`current-password-${user.id}`} label="Contraseña actual" value={currentPassword} onChange={setCurrentPassword} required autoComplete="current-password" />}
                  <PasswordField id={`new-password-${user.id}`} label="Contraseña nueva" value={newPassword} onChange={setNewPassword} required minLength={12} autoComplete="new-password" />
                  <PasswordField id={`confirm-password-${user.id}`} label="Repetir contraseña nueva" value={confirmPassword} onChange={setConfirmPassword} required minLength={12} autoComplete="new-password" />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Usá entre 12 y 128 caracteres. Las otras sesiones de esta cuenta se cerrarán.</p>
                <div className="mt-4 flex gap-2">
                  <button disabled={busyId !== null} className="admin-save-button h-11 rounded-xl px-4 text-sm font-semibold disabled:opacity-50">Guardar contraseña</button>
                  <button type="button" onClick={() => { setPasswordEditingId(null); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); }} className="h-11 rounded-xl border px-4 text-sm">Cancelar</button>
                </div>
              </form>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
