"use server";

/**
 * Supabase storage helpers. Use server client for signed URLs (private bucket).
 * Path format: {userId}/{timestamp}_{filename}
 */

export interface StoredDocument {
  name: string;
  path: string;
  created_at?: string;
}

export async function createSignedUrl(
  path: string,
  expiresInSeconds: number = 3600,
): Promise<{ url: string | null; error: string | null }> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("documents")
    .createSignedUrl(path, expiresInSeconds);
  if (error) return { url: null, error: error.message };
  const url =
    (data as { signedUrl?: string; signedURL?: string })?.signedUrl ??
    (data as { signedUrl?: string; signedURL?: string })?.signedURL ??
    null;
  return { url, error: null };
}

export async function listUserDocuments(): Promise<StoredDocument[]> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: list, error } = await supabase.storage
    .from("documents")
    .list(user.id, { limit: 100 });

  if (error || !list) return [];

  const docs: StoredDocument[] = [];
  for (const item of list) {
    if (item.name) {
      const path = `${user.id}/${item.name}`;
      docs.push({
        name: item.name,
        path,
        created_at: item.created_at ?? undefined,
      });
    }
  }
  docs.sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
  return docs;
}

export async function deleteDocument(
  path: string,
): Promise<{ error: string | null }> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  if (!path.startsWith(`${user.id}/`)) return { error: "Forbidden" };
  const { error } = await supabase.storage.from("documents").remove([path]);
  return { error: error?.message ?? null };
}
