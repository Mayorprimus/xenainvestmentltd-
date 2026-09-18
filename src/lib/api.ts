import {
  mapBalances,
  mapTransactions,
  mapNotifications,
  mapInvestment,
  mapVault,
  mapOffer,
  mapTrade,
  mapAnnouncement,
  mapConversation,
  mapProfileToAccount,
} from './format';
import type { SupportConversation } from '../types';

export type ServerState = Record<string, any>;

// ---------- Auth token persistence (single localStorage key) ----------
const TOKEN_KEY = 'xena_auth_token';

export function getAuthToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

export function setAuthToken(token: string): void {
  try { localStorage.setItem(TOKEN_KEY, token); } catch {}
}

export function clearAuthToken(): void {
  try { localStorage.removeItem(TOKEN_KEY); } catch {}
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  country: string;
  phone: string;
  dob: string;
  referrer?: string;
}

export interface AuthResult {
  ok: boolean;
  error?: string;
  account?: any;
  role?: string;
  token?: string;
}

// All authenticated endpoints read the token from the JSON body (and /api/state
// from the x-auth-token header). We attach it in both places so body-based and
// header-based routes behave identically.
async function call<T = any>(
  path: string,
  body: Record<string, unknown> = {},
  opts: { method?: string; includeToken?: boolean } = {}
): Promise<any> {
  const method = opts.method || 'POST';
  const token = getAuthToken();
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) headers['x-auth-token'] = token;
  const init: RequestInit = { method, headers };
  if (method !== 'GET' && method !== 'HEAD') {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(token && opts.includeToken !== false ? { ...body, token } : body);
  }
  try {
    const res = await fetch(path, init);
    let data: any = null;
    try { data = await res.json(); } catch { /* non-JSON response */ }
    if (!data) return { ok: false, error: 'Unexpected response.', _status: res.status };
    return { ...data, _status: res.status } as T;
  } catch {
    // fetch never completed (server unreachable/restarting, offline) —
    // distinct from a real rejection so callers can avoid destructive actions.
    return { ok: false, error: 'Network error. Please try again.', networkError: true };
  }
}

// ---------- Public + Admin bootstrap state ----------
export async function getState(): Promise<ServerState | null> {
  try {
    const data = await call<any>('/api/state', {}, { method: 'GET' });
    if (!data || data.ok === false) return null;
    return {
      ...data,
      price: data.xenaPrice,
      announcements: (data.announcements || []).map(mapAnnouncement),
      vaultCatalog: (data.vaultCatalog || []).map(mapVault),
      p2pOffers: (data.p2pOffers || []).map(mapOffer),
      accounts: (data.accounts || []).map((a: any) =>
        mapProfileToAccount(a, (a.investments || []).map(mapInvestment))
      ),
    };
  } catch {
    return null;
  }
}

export async function saveState(payload: ServerState | string): Promise<boolean> {
  let state: unknown = payload;
  if (typeof payload === 'string') {
    try {
      state = JSON.parse(payload);
    } catch {
      return false;
    }
  }
  const data = await call<any>('/api/state', (state || {}) as Record<string, unknown>, { includeToken: false });
  return !!(data && data.ok);
}

// ---------- Auth ----------
export async function registerAccount(input: RegisterInput): Promise<AuthResult> {
  const data = await call<any>('/api/register', input);
  if (!data?.ok) return { ok: false, error: data?.error || 'Unable to create account.' };
  if (data.token) setAuthToken(data.token);
  return {
    ok: true,
    account: data.account ? mapProfileToAccount(data.account) : undefined,
    role: 'user',
    token: data.token,
  };
}

export async function loginAccount(email: string, password: string): Promise<AuthResult> {
  const data = await call<any>('/api/login', { email, password });
  if (!data?.ok) return { ok: false, error: data?.error || 'Invalid email or password.' };
  if (data.token) setAuthToken(data.token);
  if (data.role === 'admin') return { ok: true, role: 'admin', token: data.token };
  return {
    ok: true,
    account: data.account ? mapProfileToAccount(data.account) : undefined,
    role: 'user',
    token: data.token,
  };
}

export async function saveAccount(updates: unknown): Promise<boolean> {
  const data = await call<any>('/api/account/save', { updates });
  return !!(data && data.ok);
}

export async function changeAccountPassword(currentPassword: string, newPassword: string): Promise<{ ok: boolean; error?: string }> {
  const data = await call<any>('/api/account/password', { currentPassword, newPassword });
  return data?.ok
    ? { ok: true }
    : { ok: false, error: data?.error || 'Unable to change password.' };
}

export async function logout(): Promise<void> {
  clearAuthToken();
}

// ---------- Session state ----------
export async function getMyState(): Promise<{ profile?: any; investments?: any[]; p2pTrades?: any[]; payments?: any[]; withdrawals?: any[]; networkError?: boolean } | null> {
  try {
    const data = await call<any>('/api/me', {});
    if (data?.networkError) return { networkError: true };
    if (!data?.ok) return null;
    return {
      profile: data.profile ? { ...data.profile } : undefined,
      investments: (data.investments || []).map(mapInvestment),
      p2pTrades: (data.p2pTrades || []).map(mapTrade),
      payments: data.payments || [],
      withdrawals: data.withdrawals || [],
    };
  } catch {
    return null;
  }
}

// ---------- P2P Listings & Payment Validation ----------
export async function submitP2POffer(offer: Record<string, unknown>): Promise<{ ok: boolean; error?: string; offer?: Record<string, unknown> }> {
  const data = await call<any>('/api/p2p/offer', { offer });
  if (!data?.ok) return { ok: false, error: data?.error || 'Unable to submit ad.' };
  return { ok: true, offer: data.offer ? mapOffer(data.offer) : undefined };
}

export async function approveP2POffer(offerId: string): Promise<{ ok: boolean; error?: string }> {
  const data = await call<any>('/api/p2p/offer/approve', { offerId });
  return data?.ok ? { ok: true } : { ok: false, error: data?.error || 'Unable to approve.' };
}

export async function rejectP2POffer(offerId: string): Promise<{ ok: boolean; error?: string }> {
  const data = await call<any>('/api/p2p/offer/reject', { offerId });
  return data?.ok ? { ok: true } : { ok: false, error: data?.error || 'Unable to reject.' };
}

export async function moveP2POffer(offerId: string, direction: 'up' | 'down'): Promise<{ ok: boolean; error?: string }> {
  const data = await call<any>('/api/p2p/offer/move', { offerId, direction });
  return data?.ok ? { ok: true } : { ok: false, error: data?.error || 'Unable to move listing.' };
}

export async function submitP2PPayment(trade: Record<string, unknown>): Promise<{ ok: boolean; error?: string; trade?: Record<string, unknown> }> {
  const data = await call<any>('/api/p2p/payment', { trade });
  if (!data?.ok) return { ok: false, error: data?.error || 'Unable to submit payment.' };
  return { ok: true, trade: data.trade ? mapTrade(data.trade) : undefined };
}

export async function approveP2PPayment(tradeId: string): Promise<{ ok: boolean; error?: string; credited?: boolean }> {
  const data = await call<any>('/api/p2p/payment/approve', { tradeId });
  return data?.ok ? { ok: true, credited: !!data.credited } : { ok: false, error: data?.error || 'Unable to approve payment.' };
}

export async function rejectP2PPayment(tradeId: string): Promise<{ ok: boolean; error?: string }> {
  const data = await call<any>('/api/p2p/payment/reject', { tradeId });
  return data?.ok ? { ok: true } : { ok: false, error: data?.error || 'Unable to reject payment.' };
}

// ---------- Admin: Price / Limits / Settings ----------
export async function setXenaPrice(price: number, ngnRate?: number): Promise<{ ok: boolean; error?: string; price?: number; xenaNgnRate?: number }> {
  const data = await call<any>('/api/admin/price', { price, ...(ngnRate != null ? { ngnRate } : {}) });
  if (!data?.ok) return { ok: false, error: data?.error || 'Unable to update price.' };
  return { ok: true, price: Number(data.price ?? price), xenaNgnRate: data.xenaNgnRate != null ? Number(data.xenaNgnRate) : undefined };
}

export async function updateLimits(minDeposit: number, minWithdrawal: number): Promise<{ ok: boolean; error?: string }> {
  const data = await call<any>('/api/admin/limits', { minDeposit, minWithdrawal });
  return data?.ok ? { ok: true } : { ok: false, error: data?.error || 'Unable to update limits.' };
}

export async function updateAdminSettings(flags: Record<string, unknown>): Promise<{ ok: boolean; error?: string }> {
  const data = await call<any>('/api/admin/settings', { flags });
  return data?.ok ? { ok: true } : { ok: false, error: data?.error || 'Unable to update settings.' };
}

export async function replaceAnnouncements(items: any[]): Promise<{ ok: boolean; error?: string }> {
  const data = await call<any>('/api/admin/announcements', { items });
  return data?.ok ? { ok: true } : { ok: false, error: data?.error || 'Unable to update announcements.' };
}

export async function replacePromos(items: any[]): Promise<{ ok: boolean; error?: string; promos?: any[] }> {
  const data = await call<any>('/api/admin/promos', { items });
  return data?.ok ? { ok: true, promos: data.promos } : { ok: false, error: data?.error || 'Unable to update promo codes.' };
}

// ---------- Admin: Users ----------
export async function deleteUserAccount(targetEmail: string): Promise<{ ok: boolean; error?: string }> {
  const data = await call<any>('/api/admin/delete-account', { targetEmail });
  return data?.ok ? { ok: true } : { ok: false, error: data?.error || 'Unable to delete account.' };
}

export async function resetUserPassword(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
  const data = await call<any>('/api/admin/reset-password', { email, password });
  return data?.ok ? { ok: true } : { ok: false, error: data?.error || 'Unable to reset password.' };
}

export async function adjustUserBalance(targetEmail: string, amount: number, memo?: string): Promise<{ ok: boolean; error?: string; newBalance?: number }> {
  const data = await call<any>('/api/admin/adjust-balance', { targetEmail, amount, memo: memo || null });
  if (!data?.ok) return { ok: false, error: data?.error || 'Unable to adjust balance.' };
  return { ok: true, newBalance: data.newBalance != null ? Number(data.newBalance) : undefined };
}

// ---------- Support Conversations ----------
export async function getSupportConversations(): Promise<{ ok: boolean; error?: string; conversations?: SupportConversation[] }> {
  const data = await call<any>('/api/support/conversations', { ensure: true });
  if (!data?.ok) return { ok: false, error: data?.error || 'Unable to load conversations.' };
  return { ok: true, conversations: (data.conversations || []).map(mapConversation) };
}

export async function sendSupportMessage(text: string): Promise<{ ok: boolean; error?: string; conversation?: SupportConversation }> {
  const data = await call<any>('/api/support/messages', { text });
  if (!data?.ok) return { ok: false, error: data?.error || 'Unable to send message.' };
  return { ok: true, conversation: data.conversation ? mapConversation(data.conversation) : undefined };
}

export async function replySupportConversation(email: string, text: string): Promise<{ ok: boolean; error?: string; conversation?: SupportConversation }> {
  const data = await call<any>('/api/support/reply', { email, text });
  if (!data?.ok) return { ok: false, error: data?.error || 'Unable to send reply.' };
  return { ok: true, conversation: data.conversation ? mapConversation(data.conversation) : undefined };
}

export async function resolveSupportConversation(conversationId: string, status: 'open' | 'resolved'): Promise<{ ok: boolean; error?: string }> {
  const data = await call<any>('/api/support/resolve', { conversationId, status });
  return data?.ok ? { ok: true } : { ok: false, error: data?.error || 'Unable to update conversation.' };
}

// ---------- Investments ----------
export async function stakeVault(vaultId: string): Promise<{ ok: boolean; error?: string; investment?: any }> {
  const data = await call<any>('/api/invest/stake', { vaultId });
  if (!data?.ok) return { ok: false, error: data?.error || 'Unable to stake.' };
  return { ok: true, investment: data.investment ? mapInvestment(data.investment) : undefined };
}

export async function claimYield(investmentId: string): Promise<{ ok: boolean; error?: string; amount?: number }> {
  const data = await call<any>('/api/invest/claim', { investmentId });
  if (!data?.ok) return { ok: false, error: data?.error || 'Unable to claim yield.' };
  return { ok: true, amount: data.amount != null ? Number(data.amount) : undefined };
}

export async function redeemPromoCode(code: string): Promise<{ ok: boolean; error?: string; amount?: number; code?: string; title?: string; label?: string }> {
  const data = await call<any>('/api/promo/redeem', { code });
  if (!data?.ok) return { ok: false, error: data?.error || 'Unable to redeem code.' };
  return { ok: true, amount: Number(data.amount || 0), code: data.code, title: data.title, label: data.label };
}

export async function adminRestartInvestment(investmentId: string, note?: string): Promise<{ ok: boolean; error?: string }> {
  return adminInvestmentAction('restart', investmentId, note);
}
export async function adminCancelInvestment(investmentId: string, note?: string): Promise<{ ok: boolean; error?: string }> {
  return adminInvestmentAction('cancel', investmentId, note);
}
export async function adminPayoutInvestment(investmentId: string, note?: string): Promise<{ ok: boolean; error?: string }> {
  return adminInvestmentAction('payout', investmentId, note);
}
async function adminInvestmentAction(action: string, investmentId: string, note?: string): Promise<{ ok: boolean; error?: string }> {
  const data = await call<any>('/api/admin/investments', { action, investmentId, note: note || null });
  return data?.ok ? { ok: true } : { ok: false, error: data?.error || 'Action failed.' };
}

export async function adminPayoutAllVaults(): Promise<{ ok: boolean; error?: string; processed?: number }> {
  const data = await call<any>('/api/admin/investments', { action: 'payout_all' });
  return data?.ok ? { ok: true, processed: Number(data.processed || 0) } : { ok: false, error: data?.error || 'Payout failed.' };
}

// ---------- Vault Catalog (admin) ----------
export async function adminUpdateVault(vaultId: string, updates: Record<string, unknown>): Promise<{ ok: boolean; error?: string; vault?: any }> {
  const data = await call<any>('/api/admin/vaults', { action: 'update', vaultId, payload: updates });
  if (!data?.ok) return { ok: false, error: data?.error || 'Unable to update vault.' };
  return { ok: true, vault: data.vault ? mapVault(data.vault) : undefined };
}

export async function adminAddVault(payload: Record<string, unknown>): Promise<{ ok: boolean; error?: string; id?: string }> {
  const data = await call<any>('/api/admin/vaults', { action: 'add', payload });
  return data?.ok ? { ok: true, id: data.id } : { ok: false, error: data?.error || 'Unable to add vault.' };
}

export async function adminDeleteVault(vaultId: string): Promise<{ ok: boolean; error?: string }> {
  const data = await call<any>('/api/admin/vaults', { action: 'delete', vaultId });
  return data?.ok ? { ok: true } : { ok: false, error: data?.error || 'Unable to delete vault.' };
}

// ---------- Withdrawals ----------
export async function createWithdrawalRequest(payload: Record<string, unknown>): Promise<{ ok: boolean; error?: string; request?: any }> {
  const data = await call<any>('/api/withdrawals/create', { payload });
  if (!data?.ok) return { ok: false, error: data?.error || 'Unable to submit withdrawal.' };
  return { ok: true, request: data.request };
}

export async function adminDecideWithdrawal(requestId: string, decision: 'approved' | 'rejected', note?: string): Promise<{ ok: boolean; error?: string }> {
  const data = await call<any>('/api/withdrawals/decide', { requestId, decision, note: note || null });
  return data?.ok ? { ok: true } : { ok: false, error: data?.error || 'Unable to update request.' };
}

// ---------- Payments (Express routes) ----------
export async function flutterwaveInitialize(amountNgn: number): Promise<{ ok: boolean; error?: string; reference?: string; txRef?: string; paymentLink?: string; publicKey?: string }> {
  const data = await call<any>('/api/flutterwave/initialize', { amountNgn });
  if (!data?.ok) return { ok: false, error: data?.error || 'Unable to initialize payment.' };
  return {
    ok: true,
    reference: data.reference,
    txRef: data.tx_ref,
    paymentLink: data.payment_link,
    publicKey: data.public_key,
  };
}

export async function flutterwaveVerify(txRef: string): Promise<{ ok: boolean; error?: string; xena?: number }> {
  const data = await call<any>('/api/flutterwave/verify', { tx_ref: txRef });
  if (!data?.ok) return { ok: false, error: data?.error || 'Payment not confirmed.' };
  return { ok: true, xena: Number(data.xena || 0) };
}

// Legacy aliases for compatibility
export const paystackInitialize = flutterwaveInitialize;
export const paystackVerify = flutterwaveVerify;

export async function cryptoCreateInvoice(coin: string, amountUsd: number): Promise<{ ok: boolean; error?: string; invoice?: any }> {
  const data = await call<any>('/api/crypto/create', { coin, amountUsd });
  if (!data?.ok) return { ok: false, error: data?.error || 'Unable to create invoice.' };
  return { ok: true, invoice: data };
}

export async function cryptoCheckDeposit(paymentId: string): Promise<{ ok: boolean; status?: string; xena?: number; error?: string }> {
  const data = await call<any>('/api/crypto/status', { payment_id: paymentId });
  if (!data?.ok) return { ok: false, status: data?.status, error: data?.error || 'Unable to check payment.' };
  return { ok: true, status: data?.status || 'waiting', xena: data?.xena != null ? Number(data.xena) : undefined };
}

export { mapVault };