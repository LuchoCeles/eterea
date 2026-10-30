const graphApi = "https://graph.facebook.com/v25.0";

type MetaStage = "profile" | "media";
type InstagramProfile = { id: string; username: string };
type InstagramPictureProfile = InstagramProfile & { profilePictureUrl: string | null };
type MetaFailure = "token" | "permission" | "account" | "unavailable" | "invalid_response";

const messages: Record<MetaFailure, string> = {
  token: "Meta rechazó el token. Revisá que esté vigente y corresponda a Instagram Unified Login.",
  permission: "Meta no autorizó el acceso. Revisá instagram_basic y el acceso de la cuenta en Meta Business.",
  account: "No se pudo acceder a esa cuenta de Instagram. Verificá el ID y su vinculación en Meta Business.",
  unavailable: "Meta no pudo completar la consulta. Reintentá más tarde.",
  invalid_response: "Meta no devolvió datos válidos para esa cuenta de Instagram.",
};

export class InstagramMetaError extends Error {
  constructor(readonly reason: MetaFailure, readonly status: number) {
    super(messages[reason]);
  }
}

type MetaErrorBody = { error?: { code?: unknown } };

function failureFor(code: unknown, stage: MetaStage): MetaFailure {
  if (code === 190) return "token";
  if (code === 10 || code === 200) return "permission";
  if (stage === "profile") return "account";
  return "unavailable";
}

async function graphGet<T>(path: string, token: string, stage: MetaStage, fetcher: typeof fetch): Promise<T> {
  let response: Response;
  try {
    response = await fetcher(`${graphApi}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    throw new InstagramMetaError("unavailable", 502);
  }

  const result: unknown = await response.json().catch(() => null);
  const errorCode = result && typeof result === "object" ? (result as MetaErrorBody).error?.code : undefined;
  if (!response.ok || errorCode !== undefined) {
    const reason = errorCode === undefined && response.status === 401
      ? "token"
      : errorCode === undefined && response.status === 403
        ? "permission"
        : failureFor(errorCode, stage);
    throw new InstagramMetaError(reason, reason === "permission" ? 403 : reason === "unavailable" ? 502 : 400);
  }
  return result as T;
}

export async function validateInstagramAccount(token: string, accountId: string, fetcher: typeof fetch = fetch) {
  const encodedId = encodeURIComponent(accountId);
  const profile = await graphGet<{ id?: unknown; username?: unknown }>(
    `/${encodedId}?fields=id,username`, token, "profile", fetcher,
  );
  if (profile.id !== accountId || typeof profile.username !== "string" || !/^[\w.]{1,30}$/.test(profile.username)) {
    throw new InstagramMetaError("invalid_response", 400);
  }

  const feed = await graphGet<{ data?: unknown }>(
    `/${encodedId}/media?fields=id,caption,media_type,media_url,permalink,timestamp&limit=1`,
    token,
    "media",
    fetcher,
  );
  if (!Array.isArray(feed.data)) throw new InstagramMetaError("unavailable", 502);

  const result: InstagramProfile & { sampleCount: number } = {
    id: profile.id,
    username: profile.username,
    sampleCount: feed.data.length,
  };
  return result;
}

export async function getInstagramPictureProfile(token: string, accountId: string, fetcher: typeof fetch = fetch): Promise<InstagramPictureProfile | null> {
  const profile = await graphGet<{ id?: unknown; username?: unknown; profile_picture_url?: unknown }>(
    `/${encodeURIComponent(accountId)}?fields=id,username,profile_picture_url`, token, "profile", fetcher,
  );
  if (profile.id !== accountId || typeof profile.username !== "string" || !/^[\w.]{1,30}$/.test(profile.username)) return null;
  let profilePictureUrl: string | null = null;
  if (typeof profile.profile_picture_url === "string") {
    try {
      const url = new URL(profile.profile_picture_url);
      if (url.protocol === "https:" && !url.username && !url.password) profilePictureUrl = url.href;
    } catch {
      // Meta puede omitir el campo o devolver una URL temporal inválida.
    }
  }
  return { id: profile.id, username: profile.username, profilePictureUrl };
}

export function instagramAccountPath(accountId: string, suffix = "") {
  return `/${encodeURIComponent(accountId)}${suffix}`;
}

export function instagramGraphApi() {
  return graphApi;
}

export async function getInstagram<T>(path: string, token: string, fetcher: typeof fetch = fetch) {
  return graphGet<T>(path, token, "media", fetcher);
}
