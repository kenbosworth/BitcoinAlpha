// tiny helper to call Supabase Edge Functions with the current user's JWT.
// requires: lib/supabase.ts and lib/env.ts (EXPO_PUBLIC_SUPABASE_* only)

import { supabase } from "./supabase";
import { SUPABASE_URL } from "./env";

type Json = Record<string, any> | undefined;

export class FunctionError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "FunctionError";
    this.status = status;
  }
}

function joinUrl(base: string, path: string) {
  const b = base.replace(/\/+$/, "");
  const p = path.replace(/^\/+/, "");
  return `${b}/${p}`;
}

export async function callEdgeFunction<T = any>(
  name: string,
  opts?: {
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    body?: Json;
    headers?: Record<string, string>;
    signal?: AbortSignal;
  }
): Promise<T> {
  const { data: sessionData, error } = await supabase.auth.getSession();
  if (error) throw new FunctionError(`Failed to get session: ${error.message}`);
  const token = sessionData.session?.access_token;
  if (!token) throw new FunctionError("Not authenticated (no JWT)", 401);

  const url = joinUrl(SUPABASE_URL, `/functions/v1/${name}`);
  const res = await fetch(url, {
    method: opts?.method ?? (opts?.body ? "POST" : "GET"),
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(opts?.headers ?? {}),
    },
    body: opts?.body ? JSON.stringify(opts.body) : undefined,
    signal: opts?.signal,
  });

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const msg = isJson ? (payload as any)?.error ?? JSON.stringify(payload) : String(payload);
    throw new FunctionError(msg || `HTTP ${res.status}`, res.status);
  }
  return payload as T;
}

// Convenience wrappers
export const agreeToTerms = () => callEdgeFunction("agree-terms");
export const startTrial   = () => callEdgeFunction("start-trial");
export const claimPromo   = () => callEdgeFunction("claim-promo");

