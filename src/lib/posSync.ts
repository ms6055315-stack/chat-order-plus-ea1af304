// POS multi-device sync over Lovable Cloud.
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

const SYNC_CODE_KEY = 'rabbani_sync_code';
const DEVICE_ID_KEY = 'rabbani_device_id';
const PRINT_HOST_KEY = 'rabbani_print_host';
const META_KEY = 'rabbani_sync_meta';
const QUEUE_KEY = 'rabbani_sync_queue';
const ENABLED_KEY = 'rabbani_sync_enabled';
const SYNCED_PREFIX = 'rabbani_';
const LOCAL_ONLY = new Set([SYNC_CODE_KEY, DEVICE_ID_KEY, PRINT_HOST_KEY, META_KEY, QUEUE_KEY, ENABLED_KEY]);

let started = false;
let applyingRemote = false;
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let flushing = false;
let printChannel: ReturnType<typeof supabase.channel> | null = null;
let printHandler: ((html: string, label: string) => void) | null = null;
let nativeSetItem: ((k: string, v: string) => void) | null = null;

function rawSet(key: string, value: string) {
  (nativeSetItem || localStorage.setItem.bind(localStorage))(key, value);
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch { return fallback; }
}

type Meta = Record<string, number>;
function getMeta(): Meta { return readJson<Meta>(META_KEY, {}); }
function setLocalStamp(key: string, ts: number) {
  const meta = getMeta();
  meta[key] = ts;
  rawSet(META_KEY, JSON.stringify(meta));
}
function localStamp(key: string): number { return getMeta()[key] ?? 0; }
function getQueue(): Record<string, number> { return readJson<Record<string, number>>(QUEUE_KEY, {}); }
function queueKey(key: string, ts: number) {
  const q = getQueue();
  q[key] = ts;
  rawSet(QUEUE_KEY, JSON.stringify(q));
}
function unqueueCompleted(snapshot: Record<string, number>) {
  const q = getQueue();
  for (const [key, sentAt] of Object.entries(snapshot)) {
    if (q[key] === sentAt) delete q[key];
  }
  rawSet(QUEUE_KEY, JSON.stringify(q));
}

export function isSyncEnabled(): boolean {
  return localStorage.getItem(ENABLED_KEY) === '1';
}

export function setSyncEnabled(on: boolean) {
  rawSet(ENABLED_KEY, on ? '1' : '0');
}

export function isPrintHost(): boolean { return localStorage.getItem(PRINT_HOST_KEY) === '1'; }
export function setPrintHost(on: boolean) {
  if (on) rawSet(PRINT_HOST_KEY, '1');
  else localStorage.removeItem(PRINT_HOST_KEY);
}
export function setRemotePrintHandler(fn: (html: string, label: string) => void) { printHandler = fn; }
export function sendRemotePrint(html: string, label: string) {
  if (!printChannel) return false;
  void printChannel.send({ type: 'broadcast', event: 'print', payload: { html, label, from: getDeviceId() } });
  return true;
}
export function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    rawSet(DEVICE_ID_KEY, id);
  }
  return id;
}
export function getSyncCode(): string | null {
  if (!isSyncEnabled()) return null;
  return localStorage.getItem(SYNC_CODE_KEY);
}
export function createSyncCode(): string {
  const code = Math.random().toString(36).slice(2, 8).toUpperCase();
  rawSet(SYNC_CODE_KEY, code);
  setSyncEnabled(true);
  return code;
}
export function setSyncCode(code: string) {
  rawSet(SYNC_CODE_KEY, code.trim().toUpperCase());
  setSyncEnabled(true);
}
export function stopSync() {
  localStorage.removeItem(SYNC_CODE_KEY);
  localStorage.removeItem(QUEUE_KEY);
  setSyncEnabled(false);
}
export function getSyncUrl(code: string): string { return `${window.location.origin}/?sync=${code}`; }
function isSyncedKey(key: string) { return key.startsWith(SYNCED_PREFIX) && !LOCAL_ONLY.has(key); }
function scheduleFlush() { if (flushTimer) clearTimeout(flushTimer); flushTimer = setTimeout(() => void flush(), 400); }
async function flush() {
  const code = getSyncCode();
  const q = getQueue();
  const keys = Object.keys(q);
  if (!code || flushing || keys.length === 0) return;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
  flushing = true;
  try {
    const rows = keys.map((store_key) => ({
      sync_code: code,
      store_key,
      data: safeParse(localStorage.getItem(store_key) || 'null'),
      device_id: getDeviceId(),
      updated_at: new Date(q[store_key] || Date.now()).toISOString(),
    }));
    const { error } = await supabase.from('pos_sync').upsert(rows, { onConflict: 'sync_code,store_key' });
    if (error) return;
    unqueueCompleted(q);
  } finally { flushing = false; }
}
function safeParse(raw: string): Json { try { return JSON.parse(raw) as Json; } catch { return raw as any; } }
function applyRemote(store_key: string, data: unknown, remoteTs: number) {
  if (!isSyncedKey(store_key)) return false;
  if (getQueue()[store_key]) return false;
  if (remoteTs <= localStamp(store_key)) return false;
  const next = typeof data === 'string' ? data : JSON.stringify(data);
  if (next === 'null' || next === undefined) return false;
  if (localStorage.getItem(store_key) === next) {
    setLocalStamp(store_key, remoteTs);
    return false;
  }
  applyingRemote = true;
  try { rawSet(store_key, next); setLocalStamp(store_key, remoteTs); } finally { applyingRemote = false; }
  return true;
}
function queueAllLocal() {
  const now = Date.now();
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && isSyncedKey(key)) {
      if (!localStamp(key)) setLocalStamp(key, now);
      queueKey(key, localStamp(key) || now);
    }
  }
}
async function pullAll(): Promise<boolean> {
  const code = getSyncCode();
  if (!code) return false;
  const { data, error } = await supabase.from('pos_sync').select('store_key,data,updated_at').eq('sync_code', code);
  if (error) return false;
  let changed = false;
  for (const row of data || []) {
    const ts = row.updated_at ? new Date(row.updated_at as string).getTime() : 0;
    if (applyRemote(row.store_key, row.data, ts)) changed = true;
  }
  return changed;
}
export async function initPosSync() {
  if (started) return;
  started = true;
  nativeSetItem = localStorage.setItem.bind(localStorage);
  const patched = (key: string, value: string) => {
    const setItem = nativeSetItem;
    if (!setItem) return;
    setItem(key, value);
    if (applyingRemote || !isSyncedKey(key)) return;
    const ts = Date.now();
    setLocalStamp(key, ts);
    if (getSyncCode()) {
      queueKey(key, ts);
      scheduleFlush();
    }
  };
  localStorage.setItem = patched as typeof localStorage.setItem;

  if (!isSyncEnabled()) return;

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
  queueAllLocal();
  const changed = await pullAll();
  if (joined && changed) { window.location.reload(); return; }
  if (changed) window.dispatchEvent(new CustomEvent('rabbani-sync-updated', { detail: '*' }));
  void flush();
  supabase.channel(`pos_sync_${code}`).on('postgres_changes', { event: '*', schema: 'public', table: 'pos_sync', filter: `sync_code=eq.${code}` }, (payload) => {
    const row = payload.new as any;
    if (!row?.store_key || row.device_id === getDeviceId()) return;
    const ts = row.updated_at ? new Date(row.updated_at).getTime() : Date.now();
    if (applyRemote(row.store_key, row.data, ts)) window.dispatchEvent(new CustomEvent('rabbani-sync-updated', { detail: row.store_key }));
  }).subscribe();
  printChannel = supabase.channel(`pos_print_${code}`, { config: { broadcast: { self: false } } }).on('broadcast', { event: 'print' }, ({ payload }) => {
    const job = payload as any;
    if (!job?.html || job.from === getDeviceId()) return;
    if (!isPrintHost()) return;
    printHandler?.(job.html, job.label || 'Print');
  }).subscribe();
  window.addEventListener('online', () => void flush());
  setInterval(() => {
    void flush();
    void pullAll().then((c) => { if (c) window.dispatchEvent(new CustomEvent('rabbani-sync-updated', { detail: '*' })); });
  }, 8000);
}
