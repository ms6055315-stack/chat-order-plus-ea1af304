// POS multi-device sync over Lovable Cloud.
// Mirrors every `rabbani_*` localStorage key to a shared cloud row keyed by a
// random sync code. Any device that scans the QR (or enters the code) joins the
// same live session; changes propagate both ways in realtime.
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

const SYNC_CODE_KEY = 'rabbani_sync_code';
const DEVICE_ID_KEY = 'rabbani_device_id';
const PRINT_HOST_KEY = 'rabbani_print_host';
const SYNCED_PREFIX = 'rabbani_';
// Keys that must stay local to each device.
const LOCAL_ONLY = new Set([SYNC_CODE_KEY, DEVICE_ID_KEY, PRINT_HOST_KEY]);

let started = false;
let applyingRemote = false;
const pending = new Map<string, string>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let printChannel: ReturnType<typeof supabase.channel> | null = null;
let printHandler: ((html: string, label: string) => void) | null = null;

export function isPrintHost(): boolean {
  return localStorage.getItem(PRINT_HOST_KEY) === '1';
}

export function setPrintHost(on: boolean) {
  if (on) localStorage.setItem(PRINT_HOST_KEY, '1');
  else localStorage.removeItem(PRINT_HOST_KEY);
}

/** Registers the function used to render incoming remote print jobs. */
export function setRemotePrintHandler(fn: (html: string, label: string) => void) {
  printHandler = fn;
}

/** Sends a print job to the device marked as print host. */
export function sendRemotePrint(html: string, label: string) {
  if (!printChannel) return false;
  void printChannel.send({
    type: 'broadcast',
    event: 'print',
    payload: { html, label, from: getDeviceId() },
  });
  return true;
}


export function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export function getSyncCode(): string | null {
  return localStorage.getItem(SYNC_CODE_KEY);
}

export function createSyncCode(): string {
  const code = Math.random().toString(36).slice(2, 8).toUpperCase();
  localStorage.setItem(SYNC_CODE_KEY, code);
  return code;
}

export function setSyncCode(code: string) {
  localStorage.setItem(SYNC_CODE_KEY, code.trim().toUpperCase());
}

export function stopSync() {
  localStorage.removeItem(SYNC_CODE_KEY);
}

export function getSyncUrl(code: string): string {
  return `${window.location.origin}/?sync=${code}`;
}

function isSyncedKey(key: string) {
  return key.startsWith(SYNCED_PREFIX) && !LOCAL_ONLY.has(key);
}

function scheduleFlush() {
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(flush, 400);
}

async function flush() {
  const code = getSyncCode();
  if (!code || pending.size === 0) return;
  const rows = Array.from(pending.entries()).map(([store_key, raw]) => ({
    sync_code: code,
    store_key,
    data: safeParse(raw),
    device_id: getDeviceId(),
    updated_at: new Date().toISOString(),
  }));
  pending.clear();
  const { error } = await supabase.from('pos_sync').upsert(rows, { onConflict: 'sync_code,store_key' });
  if (error) console.error('POS sync push failed', error);
}

function safeParse(raw: string): Json {
  try {
    return JSON.parse(raw) as Json;
  } catch {
    return raw;
  }
}

function applyRemote(store_key: string, data: unknown) {
  const next = typeof data === 'string' ? data : JSON.stringify(data);
  if (localStorage.getItem(store_key) === next) return false;
  applyingRemote = true;
  try {
    localStorage.setItem(store_key, next);
  } finally {
    applyingRemote = false;
  }
  return true;
}

async function pushAllLocal() {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && isSyncedKey(key)) pending.set(key, localStorage.getItem(key) || '');
  }
  await flush();
}

async function pullAll(): Promise<boolean> {
  const code = getSyncCode();
  if (!code) return false;
  const { data, error } = await supabase.from('pos_sync').select('store_key,data').eq('sync_code', code);
  if (error) {
    console.error('POS sync pull failed', error);
    return false;
  }
  let changed = false;
  for (const row of data || []) {
    if (applyRemote(row.store_key, row.data)) changed = true;
  }
  return changed;
}

/**
 * Starts two-way sync. Call once at app startup.
 * A `?sync=CODE` query param joins an existing session.
 */
export async function initPosSync() {
  if (started) return;
  started = true;

  const params = new URLSearchParams(window.location.search);
  const joinCode = params.get('sync');
  let joined = false;
  if (joinCode) {
    setSyncCode(joinCode);
    joined = true;
    params.delete('sync');
    const qs = params.toString();
    window.history.replaceState({}, '', window.location.pathname + (qs ? `?${qs}` : ''));
  }

  const code = getSyncCode();
  if (!code) return;

  // Intercept local writes so every change is pushed.
  const nativeSetItem = localStorage.setItem.bind(localStorage);
  localStorage.setItem = (key: string, value: string) => {
    nativeSetItem(key, value);
    if (!applyingRemote && isSyncedKey(key) && getSyncCode()) {
      pending.set(key, value);
      scheduleFlush();
    }
  };

  const changed = await pullAll();
  if (joined) {
    if (changed) window.location.reload();
  } else {
    await pushAllLocal();
  }

  supabase
    .channel(`pos_sync_${code}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'pos_sync', filter: `sync_code=eq.${code}` },
      (payload) => {
        const row = payload.new as { store_key?: string; data?: unknown; device_id?: string } | null;
        if (!row?.store_key || row.device_id === getDeviceId()) return;
        if (applyRemote(row.store_key, row.data)) {
          window.dispatchEvent(new CustomEvent('rabbani-sync-updated', { detail: row.store_key }));
        }
      },
    )
    .subscribe();
}
