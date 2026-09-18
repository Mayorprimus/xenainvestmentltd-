import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import {
  makePool,
  bootstrapDatabase,
  loadDocument,
  saveDocument,
} from './shared/bootstrap.js';
import {
  BASE_STATE,
  buildSeedDocument,
  makeShowcaseAccount,
  hashPassword,
  verifyPassword,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  XENA_NGN_RATE,
  DEFAULT_PRICE,
  MIN_NGN_DEPOSIT,
  MIN_USD_DEPOSIT,
} from './shared/seed-state.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// ---------- Token helpers ----------
let db = null;
function tokenForEmail(email) {
  return (db.tokens || {})[String(email).toLowerCase()] || null;
}
function setToken(email) {
  const token = crypto.randomBytes(32).toString('hex');
  db.tokens = db.tokens || {};
  db.tokens[String(email).toLowerCase()] = token;
  saveDb();
  return token;
}
function emailForToken(token) {
  if (!token || !db.tokens) return null;
  for (const email of Object.keys(db.tokens)) {
    if (db.tokens[email] === token) return email;
  }
  return null;
}

// ---------- Account helpers ----------
function sanitizeAccount(acc) {
  if (!acc) return acc;
  const { password, salt, hash, ...rest } = acc;
  return rest;
}

function baseAccount(data) {
  const ts = Date.now().toString();
  return {
    ...data,
    id: `acc-${ts.slice(-6)}`,
    xenaId: `XN-${Math.floor(1000000 + Math.random() * 9000000)}`,
    xenaCode: `xena-${Math.floor(10000000 + Math.random() * 89999999)}`,
    kycTier: 'Tier 1 (Pending)',
    status: 'Active',
    joined: new Date().toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
    twoFactorEnabled: false,
    pinSet: false,
    verifiedAccountsCount: 0,
    settings: {},
    balances: {
      totalXena: 0,
      totalBalance: 0,
      usdRate: 1,
      change24hAmount: 0,
      change24hPercent: 0,
      availableXena: 0,
      investedXena: 0,
      averageBuyPrice: 0,
      currentPrice: db ? db.xenaPrice || DEFAULT_PRICE : DEFAULT_PRICE,
      stakedXena: 0,
      lockedInOrders: 0,
      nairaBalance: 0,
      xenaNgnRate: db ? db.xenaNgnRate || XENA_NGN_RATE : XENA_NGN_RATE,
    },
    transactions: [],
    investments: [],
    notifications: [],
    redeemedBonusCodes: [],
    bankDetails: [],
    walletAddresses: [],
  };
}

// ---------- Admin check ----------
function isAdminToken(token) {
  return emailForToken(token) === ADMIN_EMAIL;
}
function requireAdminToken(token) {
  return !!token && isAdminToken(token);
}
function requireUserToken(token) {
  return !!emailForToken(token);
}

// ---------- Storage (PostgreSQL document store, JSON file fallback) ----------
let pool = null;
let usingFileStorage = false;
let saveChain = Promise.resolve();

function saveDb() {
  saveChain = saveChain
    .then(() => {
      if (pool) return saveDocument(pool, db);
      try {
        if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
        const tmp = DB_FILE + '.tmp';
        fs.writeFileSync(tmp, JSON.stringify(db, null, 2), 'utf8');
        fs.renameSync(tmp, DB_FILE);
      } catch (err) {
        console.error('Failed to persist data/db.json.', err);
      }
    })
    .catch((err) => console.error('Failed to persist state.', err));
  return saveChain;
}

function loadFileDb() {
  let parsed = null;
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      const candidate = JSON.parse(raw);
      if (candidate && typeof candidate === 'object') parsed = candidate;
    }
  } catch (err) {
    console.error('Failed to read data/db.json, re-seeding.', err);
  }
  // Merge over the canonical seed so new document keys are always present.
  return {
    ...structuredClone(BASE_STATE),
    ...(parsed || {}),
    accounts: Array.isArray(parsed?.accounts) ? parsed.accounts : [],
    tokens: parsed?.tokens && typeof parsed.tokens === 'object' ? parsed.tokens : {},
  };
}

async function initStorage() {
  pool = makePool();
  if (pool) {
    try {
      await bootstrapDatabase(pool);
      const loaded = await loadDocument(pool);
      if (loaded) {
        db = loaded;
        console.log('[xena] Storage: PostgreSQL document store ready.');
        return;
      }
      const seededAgain = await loadDocument(pool);
      if (seededAgain) {
        db = seededAgain;
        console.log('[xena] Storage: PostgreSQL seeded on startup.');
        return;
      }
      throw new Error('kv_store returned no state after bootstrap');
    } catch (err) {
      console.error('[xena] PostgreSQL unavailable, falling back to JSON file storage.', err?.message || err);
      pool = null;
    }
  }
  usingFileStorage = true;
  db = loadFileDb();
  console.log('[xena] Storage: JSON file storage in use (no DATABASE_URL).');
}

// Showcase account (also reflected in the seed document) so the demo login
// keeps working regardless of storage backend.
function ensureShowcase() {
  if ((db.accounts || []).some((a) => a && a.email === 'alex.morgan@xena.fi')) return;
  const acc = makeShowcaseAccount();
  db.accounts = [acc, ...(db.accounts || [])];
  const inv = acc.investments?.[0];
  if (inv && !(db.investments || []).some((i) => i && i.id === inv.id)) {
    db.investments = [inv, ...(db.investments || [])];
  }
  saveDb();
}

// ---------- App ----------
const app = express();
app.use(
  express.json({
    limit: '2mb',
    verify: (req, res, buf) => {
      if (buf && buf.length) req.rawBody = buf;
    },
  })
);

app.get('/api/health', (req, res) => {
  res.json({ ok: true, storage: pool ? 'postgres' : 'file', uptime: process.uptime() });
});

// Public boot state. Sensitive admin datasets are only attached when the
// request carries a valid admin token; account rows are always sanitized
// (no salt/hash) and only ever sent to admins.
app.get('/api/state', (req, res) => {
  res.set('Cache-Control', 'no-store');
  const admin = requireAdminToken(req.headers['x-auth-token']);
  const publicState = {
    xenaPrice: db.xenaPrice,
    xenaNgnRate: db.xenaNgnRate,
    limits: db.limits,
    settings: db.settings,
    escrow: db.escrow || {},
    announcements: db.announcements || [],
    vaultCatalog: db.vaultCatalog || [],
    p2pOffers: admin
      ? db.p2pOffers || []
      : (db.p2pOffers || []).filter((o) => o.status === 'approved'),
  };
  if (admin) {
    Object.assign(publicState, {
      users: db.users,
      txs: db.txs,
      deposits: db.deposits,
      referrals: db.referrals,
      bonusLog: db.bonusLog,
      merchants: db.merchants,
      disputes: db.disputes,
      tickets: db.tickets,
      promos: db.promos,
      audit: db.audit,
      accounts: (db.accounts || []).map(sanitizeAccount),
      investments: db.investments,
      p2pTrades: db.p2pTrades,
      withdrawals: db.withdrawals,
      payments: db.payments,
      supportConvs: db.supportConvs || [],
      conversations: db.supportConvs || [],
    });
  }
  res.json(publicState);
});

// Admin/global data mutations. Accounts are NEVER writable here — they only
// change through the authenticated account/login/register endpoints.
app.post('/api/state', (req, res) => {
  if (!requireAdminToken(req.headers['x-auth-token'])) {
    res.status(401).json({ ok: false, error: 'Admin access required.' });
    return;
  }
  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    res.status(400).json({ ok: false, error: 'Invalid payload' });
    return;
  }
  for (const key of Object.keys(body)) {
    if (key === 'accounts' || key === 'tokens' || key === 'p2pOffers' || key === 'p2pTrades') continue;
    db[key] = body[key];
  }
  saveDb();
  res.json({ ok: true });
});

// ---------- Authentication ----------
app.post('/api/register', (req, res) => {
  const { name, email, password, country, phone, dob, referrer } = req.body || {};
  const e = String(email || '').trim().toLowerCase();
  if (!name || !e || !password) {
    res.status(400).json({ ok: false, error: 'Missing required fields.' });
    return;
  }
  if (String(password).length < 8) {
    res.status(400).json({ ok: false, error: 'Password must be at least 8 characters long.' });
    return;
  }
  if (e === ADMIN_EMAIL) {
    res.status(400).json({ ok: false, error: 'That email is reserved.' });
    return;
  }
  const existing = (db.accounts || []).find((a) => a.email === e);
  if (existing) {
    res.status(400).json({ ok: false, error: 'An account with this email already exists.' });
    return;
  }
  const { salt, hash } = hashPassword(String(password));
  const acc = baseAccount({ name, email: e, country, phone, dob, referrer });
  acc.salt = salt;
  acc.hash = hash;
  db.accounts = [acc, ...(db.accounts || [])];
  const token = setToken(e);
  saveDb();
  res.set('Cache-Control', 'no-store');
  res.json({ ok: true, account: sanitizeAccount(acc), token });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body || {};
  const e = String(email || '').trim().toLowerCase();
  if (!e || !password) {
    res.status(400).json({ ok: false, error: 'Missing email or password.' });
    return;
  }
  if (e === ADMIN_EMAIL && String(password) === ADMIN_PASSWORD) {
    const token = setToken(e);
    saveDb();
    res.set('Cache-Control', 'no-store');
    res.json({ ok: true, role: 'admin', token });
    return;
  }
  const acc = (db.accounts || []).find((a) => a.email === e);
  if (!acc) {
    res.status(400).json({ ok: false, error: 'No account found with that email.' });
    return;
  }
  if (!verifyPassword(String(password), acc.salt, acc.hash)) {
    res.status(400).json({ ok: false, error: 'Incorrect password. Please try again.' });
    return;
  }
  const token = tokenForEmail(e) || setToken(e);
  saveDb();
  res.set('Cache-Control', 'no-store');
  res.json({ ok: true, role: 'user', account: sanitizeAccount(acc), token });
});

// Signed-in session snapshot (used after refresh, replaces the Supabase RPC).
app.post('/api/me', (req, res) => {
  const { token } = req.body || {};
  const email = emailForToken(token);
  if (!email) {
    res.status(401).json({ ok: false, error: 'Session invalid. Please sign in again.' });
    return;
  }
  res.set('Cache-Control', 'no-store');
  if (email === ADMIN_EMAIL) {
    res.json({
      ok: true,
      role: 'admin',
      profile: {
        role: 'admin',
        name: 'Administrator',
        email: ADMIN_EMAIL,
        kycTier: 'Staff',
        xenaId: 'XN-ADMIN-01',
        xenaCode: 'xena-admin',
      },
      investments: [],
      p2pTrades: [],
      payments: [],
      withdrawals: [],
      conversations: db.supportConvs || [],
    });
    return;
  }
  const acc = (db.accounts || []).find((a) => a.email === email);
  if (!acc) {
    res.status(404).json({ ok: false, error: 'Account not found.' });
    return;
  }
  const safe = sanitizeAccount(acc);
  res.json({
    ok: true,
    role: 'user',
    profile: { ...safe, role: 'user' },
    account: safe,
    investments: acc.investments || [],
    p2pTrades: (db.p2pTrades || []).filter((t) => t.buyerEmail === email),
    payments: (db.payments || []).filter((p) => p.email === email),
    withdrawals: (db.withdrawals || []).filter((w) => w.email === email),
    conversations: (db.supportConvs || []).filter((c) => c.email === email),
  });
});

// Persist the signed-in account's mutable session data (bal/transactions/...).
const ALLOWED_ACCOUNT_KEYS = new Set([
  'name', 'email', 'country', 'phone', 'dob', 'referrer', 'kycTier', 'status',
  'twoFactorEnabled', 'pinSet', 'verifiedAccountsCount', 'balances',
  'transactions', 'investments', 'notifications', 'redeemedBonusCodes',
  'bankDetails', 'walletAddresses',
]);

app.post('/api/account/save', (req, res) => {
  const { token, updates } = req.body || {};
  const email = emailForToken(token);
  if (!email) {
    res.status(401).json({ ok: false, error: 'Session invalid. Please sign in again.' });
    return;
  }
  if (email === ADMIN_EMAIL) {
    res.set('Cache-Control', 'no-store');
    res.json({ ok: true });
    return;
  }
  const idx = (db.accounts || []).findIndex((a) => a.email === email);
  if (idx === -1) {
    res.status(404).json({ ok: false, error: 'Account not found.' });
    return;
  }
  if (updates && typeof updates === 'object') {
    const sanitized = {};
    for (const key of Object.keys(updates)) {
      if (ALLOWED_ACCOUNT_KEYS.has(key)) sanitized[key] = updates[key];
    }
    db.accounts[idx] = { ...db.accounts[idx], ...sanitized };
  }
  saveDb();
  res.set('Cache-Control', 'no-store');
  res.json({ ok: true });
});

app.post('/api/account/password', (req, res) => {
  const { token, currentPassword, newPassword } = req.body || {};
  const email = emailForToken(token);
  if (!email) {
    res.status(401).json({ ok: false, error: 'Session invalid. Please sign in again.' });
    return;
  }
  const acc = (db.accounts || []).find((a) => a.email === email);
  if (!acc) {
    res.status(404).json({ ok: false, error: 'Account not found.' });
    return;
  }
  if (!verifyPassword(String(currentPassword || ''), acc.salt, acc.hash)) {
    res.status(400).json({ ok: false, error: 'Current password is incorrect.' });
    return;
  }
  if (!newPassword || String(newPassword).length < 8) {
    res.status(400).json({ ok: false, error: 'New password must be at least 8 characters long.' });
    return;
  }
  const { salt, hash } = hashPassword(String(newPassword));
  acc.salt = salt;
  acc.hash = hash;
  saveDb();
  res.json({ ok: true });
});

// ---------- Admin: Set XENA Price / NGN rate ----------
app.post('/api/admin/price', (req, res) => {
  const { token, price, ngnRate } = req.body || {};
  if (!requireAdminToken(token)) {
    res.status(401).json({ ok: false, error: 'Admin access required.' });
    return;
  }
  const p = Number(price);
  if (!p || p <= 0) {
    res.status(400).json({ ok: false, error: 'Enter a valid price greater than 0.' });
    return;
  }
  db.xenaPrice = Math.round(p * 10000) / 10000;
  if (ngnRate != null && Number(ngnRate) > 0) {
    db.xenaNgnRate = Math.round(Number(ngnRate) * 100) / 100;
  }
  saveDb();
  res.json({ ok: true, price: db.xenaPrice, xenaNgnRate: db.xenaNgnRate });
});

// ---------- Admin: Limits ----------
app.post('/api/admin/limits', (req, res) => {
  const { token, minDeposit, minWithdrawal } = req.body || {};
  if (!requireAdminToken(token)) {
    res.status(401).json({ ok: false, error: 'Admin access required.' });
    return;
  }
  db.limits = db.limits || {};
  if (Number(minDeposit) > 0) db.limits.min_deposit_ngn = Number(minDeposit);
  if (Number(minWithdrawal) > 0) db.limits.min_withdrawal_ngn = Number(minWithdrawal);
  saveDb();
  res.json({ ok: true, limits: db.limits });
});

// ---------- Admin: Settings flags ----------
app.post('/api/admin/settings', (req, res) => {
  const { token, flags } = req.body || {};
  if (!requireAdminToken(token)) {
    res.status(401).json({ ok: false, error: 'Admin access required.' });
    return;
  }
  db.settings = db.settings || {};
  Object.assign(db.settings, flags || {});
  saveDb();
  res.json({ ok: true, settings: db.settings });
});

// ---------- Admin: Announcements / Promos ----------
app.post('/api/admin/announcements', (req, res) => {
  const { token, items } = req.body || {};
  if (!requireAdminToken(token)) {
    res.status(401).json({ ok: false, error: 'Admin access required.' });
    return;
  }
  db.announcements = Array.isArray(items) ? items : [];
  saveDb();
  res.json({ ok: true });
});

app.post('/api/admin/promos', (req, res) => {
  const { token, items } = req.body || {};
  if (!requireAdminToken(token)) {
    res.status(401).json({ ok: false, error: 'Admin access required.' });
    return;
  }
  db.promos = Array.isArray(items) ? items : [];
  saveDb();
  res.json({ ok: true, promos: db.promos });
});

// ---------- Admin: Reset user password ----------
app.post('/api/admin/reset-password', (req, res) => {
  const { token, email, password } = req.body || {};
  if (!requireAdminToken(token)) {
    res.status(401).json({ ok: false, error: 'Admin access required.' });
    return;
  }
  const e = String(email || '').trim().toLowerCase();
  const pwd = String(password || '');
  if (!e || pwd.length < 8) {
    res.status(400).json({ ok: false, error: 'Password must be at least 8 characters long.' });
    return;
  }
  if (e === ADMIN_EMAIL) {
    res.json({ ok: true });
    return;
  }
  const acc = (db.accounts || []).find((a) => a.email === e);
  if (!acc) {
    res.status(404).json({ ok: false, error: 'No account found with that email.' });
    return;
  }
  const { salt, hash } = hashPassword(pwd);
  acc.salt = salt;
  acc.hash = hash;
  saveDb();
  res.json({ ok: true });
});

// ---------- Admin: Adjust User Balance ----------
app.post('/api/admin/adjust-balance', (req, res) => {
  const { token, targetEmail, amount, memo } = req.body || {};
  if (!requireAdminToken(token)) {
    res.status(401).json({ ok: false, error: 'Admin access required.' });
    return;
  }
  const e = String(targetEmail || '').trim().toLowerCase();
  const adj = Number(amount) || 0;
  if (!e || !adj) {
    res.status(400).json({ ok: false, error: 'Missing target email or amount.' });
    return;
  }
  const acc = (db.accounts || []).find((a) => a.email === e);
  if (!acc) {
    res.status(404).json({ ok: false, error: 'No account found with that email.' });
    return;
  }
  acc.balances = acc.balances || {};
  acc.balances.availableXena = Math.max(0, (acc.balances.availableXena || 0) + adj);
  acc.balances.totalBalance = Math.max(0, (acc.balances.totalBalance || 0) + adj);
  acc.transactions = acc.transactions || [];
  acc.transactions.unshift({
    id: `tx-admin-${Date.now()}-${Math.floor(Math.random() * 999)}`,
    title: adj >= 0 ? `Admin Credit — ${memo || 'Balance adjustment'}` : `Admin Debit — ${memo || 'Balance adjustment'}`,
    type: adj >= 0 ? 'deposit' : 'withdrawal',
    amount: Math.abs(adj),
    unit: 'XENA',
    status: 'Completed',
    timestamp: new Date().toLocaleString(),
    counterparty: 'XENA Admin',
    paymentMethod: 'Admin Adjustment',
    fee: 0,
  });
  acc.notifications = acc.notifications || [];
  acc.notifications.unshift({
    id: `notif-admin-${Date.now()}`,
    title: adj >= 0 ? 'Balance Credited by Admin' : 'Balance Debited by Admin',
    message: adj >= 0
      ? `Admin added ${Math.abs(adj)} XENA to your balance. ${memo ? `Reason: ${memo}` : ''}`
      : `Admin removed ${Math.abs(adj)} XENA from your balance. ${memo ? `Reason: ${memo}` : ''}`,
    timestamp: 'Just now',
    read: false,
    type: 'transaction',
  });
  saveDb();
  res.json({ ok: true, newBalance: acc.balances.availableXena });
});

// ---------- Admin: Delete User Account ----------
app.post('/api/admin/delete-account', (req, res) => {
  const { token, targetEmail } = req.body || {};
  if (!requireAdminToken(token)) {
    res.status(401).json({ ok: false, error: 'Admin access required.' });
    return;
  }
  const e = String(targetEmail || '').trim().toLowerCase();
  if (!e) {
    res.status(400).json({ ok: false, error: 'Missing target email.' });
    return;
  }
  const idx = (db.accounts || []).findIndex((a) => a.email === e);
  if (idx === -1) {
    res.status(404).json({ ok: false, error: 'No account found with that email.' });
    return;
  }
  db.accounts.splice(idx, 1);
  if (db.tokens && db.tokens[e]) delete db.tokens[e];
  db.supportConvs = (db.supportConvs || []).filter((c) => c.email !== e);
  db.withdrawals = (db.withdrawals || []).filter((w) => w.email !== e);
  saveDb();
  res.json({ ok: true });
});

// ---------- Support Conversations ----------
const convFor = (email) => (db.supportConvs || []).find((c) => c.email === email);

app.post('/api/support/conversations', (req, res) => {
  const { token } = req.body || {};
  const email = emailForToken(token);
  if (!email) {
    res.status(401).json({ ok: false, error: 'Session invalid. Please sign in again.' });
    return;
  }
  let list = db.supportConvs || [];
  if (email !== ADMIN_EMAIL) {
    list = list.filter((c) => c.email === email);
    if (list.length === 0 && req.body.ensure !== false) {
      const acc = (db.accounts || []).find((a) => a.email === email);
      list = [{
        id: `cs-${Date.now()}-${Math.floor(Math.random() * 999)}`,
        email,
        userName: acc ? acc.name : '',
        status: 'open',
        createdAt: Date.now(),
        messages: [],
      }];
      db.supportConvs = db.supportConvs || [];
      db.supportConvs.push(list[0]);
      saveDb();
    }
  }
  res.set('Cache-Control', 'no-store');
  res.json({ ok: true, conversations: list });
});

app.post('/api/support/messages', (req, res) => {
  const { token, text } = req.body || {};
  const email = emailForToken(token);
  if (!email) {
    res.status(401).json({ ok: false, error: 'Session invalid. Please sign in again.' });
    return;
  }
  const t = String(text || '').trim();
  if (!t) {
    res.status(400).json({ ok: false, error: 'Message cannot be empty.' });
    return;
  }
  db.supportConvs = db.supportConvs || [];
  let conv = convFor(email);
  if (!conv) {
    const acc = (db.accounts || []).find((a) => a.email === email);
    conv = {
      id: `cs-${Date.now()}-${Math.floor(Math.random() * 999)}`,
      email,
      userName: acc ? acc.name : '',
      status: 'open',
      createdAt: Date.now(),
      messages: [],
    };
    db.supportConvs.push(conv);
  }
  conv.messages = conv.messages || [];
  conv.messages.push({ from: 'user', text: t, time: new Date().toLocaleString() });
  conv.status = 'open';
  conv.updatedAt = Date.now();
  saveDb();
  res.set('Cache-Control', 'no-store');
  res.json({ ok: true, conversation: conv });
});

app.post('/api/support/reply', (req, res) => {
  const { token, email, text } = req.body || {};
  if (!requireAdminToken(token)) {
    res.status(401).json({ ok: false, error: 'Admin access required.' });
    return;
  }
  const e = String(email || '').trim().toLowerCase();
  const t = String(text || '').trim();
  if (!e || !t) {
    res.status(400).json({ ok: false, error: 'Missing email or reply text.' });
    return;
  }
  db.supportConvs = db.supportConvs || [];
  let conv = convFor(e);
  if (!conv) {
    const acc = (db.accounts || []).find((a) => a.email === e);
    conv = {
      id: `cs-${Date.now()}-${Math.floor(Math.random() * 999)}`,
      email: e,
      userName: acc ? acc.name : e,
      status: 'open',
      createdAt: Date.now(),
      messages: [],
    };
    db.supportConvs.push(conv);
  }
  conv.messages = conv.messages || [];
  conv.messages.push({ from: 'agent', text: t, time: new Date().toLocaleString() });
  conv.status = 'open';
  conv.updatedAt = Date.now();
  saveDb();
  res.set('Cache-Control', 'no-store');
  res.json({ ok: true, conversation: conv });
});

app.post('/api/support/resolve', (req, res) => {
  const { token, conversationId, status } = req.body || {};
  if (!requireAdminToken(token)) {
    res.status(401).json({ ok: false, error: 'Admin access required.' });
    return;
  }
  const conv = (db.supportConvs || []).find((c) => c.id === conversationId);
  if (!conv) {
    res.status(404).json({ ok: false, error: 'Conversation not found.' });
    return;
  }
  conv.status = status === 'resolved' ? 'resolved' : 'open';
  saveDb();
  res.json({ ok: true, status: conv.status });
});

// ---------- P2P Listings & Payment Validation ----------
app.post('/api/p2p/offer', (req, res) => {
  const { token, offer } = req.body || {};
  const email = emailForToken(token);
  if (!requireUserToken(token)) {
    res.status(401).json({ ok: false, error: 'You must be signed in to post an ad.' });
    return;
  }
  const newOffer = {
    id: offer.id || `p2p-ad-${Date.now()}`,
    merchantName: offer.merchantName || email,
    merchantTier: offer.merchantTier || 'Verified Trader',
    completionRate: offer.completionRate ?? 100,
    completedOrders: offer.completedOrders ?? 0,
    ordersCount: offer.ordersCount ?? 0,
    type: offer.type,
    pricePerXena: Number(offer.pricePerXena) || 2.85,
    currency: offer.currency || 'USD',
    minLimit: Number(offer.minLimit) || 50,
    maxLimit: Number(offer.maxLimit) || 2500,
    availableXena: Number(offer.availableXena) || 1000,
    paymentMethods: offer.paymentMethods || ['Bank Transfer'],
    paymentMethod: offer.paymentMethod || (offer.paymentMethods || []).join(', '),
    responseTimeMinutes: offer.responseTimeMinutes ?? 2,
    isOnline: true,
    status: 'pending',
    listedBy: offer.merchantName || email,
    listedEmail: email,
    listedAt: Date.now(),
    sortOrder: offer.sortOrder ?? 1000,
  };
  db.p2pOffers = [newOffer, ...(db.p2pOffers || [])];
  saveDb();
  res.set('Cache-Control', 'no-store');
  res.json({ ok: true, offer: newOffer });
});

app.post('/api/p2p/offer/approve', (req, res) => {
  const { token, offerId } = req.body || {};
  if (!requireAdminToken(token)) {
    res.status(401).json({ ok: false, error: 'Admin access required.' });
    return;
  }
  const offer = (db.p2pOffers || []).find((o) => o.id === offerId);
  if (!offer) {
    res.status(404).json({ ok: false, error: 'Offer not found.' });
    return;
  }
  offer.status = 'approved';
  offer.sortOrder = 1;
  saveDb();
  res.json({ ok: true });
});

app.post('/api/p2p/offer/reject', (req, res) => {
  const { token, offerId } = req.body || {};
  if (!requireAdminToken(token)) {
    res.status(401).json({ ok: false, error: 'Admin access required.' });
    return;
  }
  const offer = (db.p2pOffers || []).find((o) => o.id === offerId);
  if (!offer) {
    res.status(404).json({ ok: false, error: 'Offer not found.' });
    return;
  }
  offer.status = 'rejected';
  saveDb();
  res.json({ ok: true });
});

app.post('/api/p2p/offer/move', (req, res) => {
  const { token, offerId, direction } = req.body || {};
  if (!requireAdminToken(token)) {
    res.status(401).json({ ok: false, error: 'Admin access required.' });
    return;
  }
  const approved = (db.p2pOffers || []).filter((o) => o.status === 'approved');
  const idx = approved.findIndex((o) => o.id === offerId);
  if (idx === -1) {
    res.status(404).json({ ok: false, error: 'Offer not found.' });
    return;
  }
  const moved = approved.splice(idx, 1)[0];
  if (direction === 'up') approved.unshift(moved);
  else approved.push(moved);
  approved.forEach((o, i) => { o.sortOrder = i + 1; });
  saveDb();
  res.json({ ok: true });
});

app.post('/api/p2p/payment', (req, res) => {
  const { token, trade } = req.body || {};
  const email = emailForToken(token);
  if (!requireUserToken(token)) {
    res.status(401).json({ ok: false, error: 'You must be signed in to submit payment.' });
    return;
  }
  const newTrade = {
    id: trade.id || `p2p-tx-${Date.now()}`,
    offerId: trade.offerId,
    merchantName: trade.merchantName,
    type: trade.type || 'BUY',
    method: trade.method,
    fiatAmount: Number(trade.fiatAmount) || 0,
    currency: trade.currency || 'USD',
    xenaAmount: Number(trade.xenaAmount) || 0,
    pricePerXena: Number(trade.pricePerXena) || 2.85,
    buyerEmail: email,
    status: 'awaiting_validation',
    reference: trade.reference || `XN-${Math.floor(10000 + Math.random() * 90000)}-P2P`,
    time: 'Just now',
    submittedAt: Date.now(),
  };
  db.p2pTrades = [newTrade, ...(db.p2pTrades || [])];
  saveDb();
  res.set('Cache-Control', 'no-store');
  res.json({ ok: true, trade: newTrade });
});

app.post('/api/p2p/payment/approve', (req, res) => {
  const { token, tradeId } = req.body || {};
  if (!requireAdminToken(token)) {
    res.status(401).json({ ok: false, error: 'Admin access required.' });
    return;
  }
  const trade = (db.p2pTrades || []).find((t) => t.id === tradeId);
  if (!trade) {
    res.status(404).json({ ok: false, error: 'Trade not found.' });
    return;
  }
  trade.status = 'approved';
  let credited = false;
  const buyer = (db.accounts || []).find((a) => a.email === trade.buyerEmail);
  if (buyer) {
    buyer.balances = buyer.balances || {};
    buyer.balances.availableXena = (buyer.balances.availableXena || 0) + trade.xenaAmount;
    buyer.balances.totalBalance = (buyer.balances.totalBalance || 0) + trade.xenaAmount;
    buyer.transactions = buyer.transactions || [];
    buyer.transactions.unshift({
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 999)}`,
      title: `P2P Purchase (${trade.method})`,
      type: 'p2p_buy',
      amount: trade.xenaAmount,
      unit: 'XENA',
      status: 'Completed',
      timestamp: new Date().toLocaleString(),
      counterparty: trade.merchantName,
      paymentMethod: trade.method,
      fee: 0,
    });
    buyer.notifications = buyer.notifications || [];
    buyer.notifications.unshift({
      id: `notif-p2p-${Date.now()}`,
      title: 'P2P Payment Approved',
      message: `Admin validated your ${trade.method} payment. ${trade.xenaAmount} XENA has been released to your balance.`,
      timestamp: 'Just now',
      read: false,
      type: 'transaction',
    });
    credited = true;
  }
  saveDb();
  res.json({ ok: true, credited });
});

app.post('/api/p2p/payment/reject', (req, res) => {
  const { token, tradeId } = req.body || {};
  if (!requireAdminToken(token)) {
    res.status(401).json({ ok: false, error: 'Admin access required.' });
    return;
  }
  const trade = (db.p2pTrades || []).find((t) => t.id === tradeId);
  if (!trade) {
    res.status(404).json({ ok: false, error: 'Trade not found.' });
    return;
  }
  trade.status = 'rejected';
  saveDb();
  res.json({ ok: true });
});

// ---------- Investments (user) ----------
app.post('/api/invest/stake', (req, res) => {
  const { token, vaultId } = req.body || {};
  const email = emailForToken(token);
  if (!email) {
    res.status(401).json({ ok: false, error: 'Session invalid. Please sign in again.' });
    return;
  }
  const acc = (db.accounts || []).find((a) => a.email === email);
  if (!acc) {
    res.status(404).json({ ok: false, error: 'Account not found.' });
    return;
  }
  const vault = (db.vaultCatalog || []).find((v) => v.id === vaultId);
  if (!vault || vault.active === false) {
    res.status(404).json({ ok: false, error: 'Vault not found or unavailable.' });
    return;
  }
  const amount = Number(vault.minDeposit) > 0 ? Number(vault.minDeposit) : 1;
  if ((acc.balances?.availableXena || 0) < amount) {
    res.status(400).json({ ok: false, error: `Insufficient available XENA. Required minimum: ${amount.toFixed(2)} XENA` });
    return;
  }
  const inv = {
    id: `inv-${Date.now()}-${Math.floor(Math.random() * 999)}`,
    email,
    user_name: acc.name,
    plan_name: vault.name,
    category: vault.category || 'Flexible',
    invested_xena: amount,
    apy: Number(vault.apy) || 0,
    earned_xena: 0,
    total_days: Number(vault.days) || 0,
    days_remaining: Number(vault.days) || 0,
    progress_percent: 0,
    started_at: new Date().toISOString(),
    ended_at: null,
    restarted_at: null,
    canceled_at: null,
    status: 'active',
    admin_note: '',
    daily_yield_xena: Math.round((amount * (Number(vault.apy) || 0) / 100 / 365) * 10000) / 10000,
  };
  acc.balances = acc.balances || {};
  acc.balances.availableXena = Math.max(0, (acc.balances.availableXena || 0) - amount);
  acc.balances.investedXena = (acc.balances.investedXena || 0) + amount;
  acc.balances.totalBalance = (acc.balances.investedXena || 0) + (acc.balances.availableXena || 0);
  acc.investments = [inv, ...(acc.investments || [])];
  db.investments = db.investments || [];
  db.investments.unshift({ ...inv, user_name: acc.name });
  acc.transactions = acc.transactions || [];
  acc.transactions.unshift({
    id: `tx-inv-${Date.now()}`,
    title: `Staked ${vault.name}`,
    type: 'investment',
    amount,
    unit: 'XENA',
    status: 'Completed',
    timestamp: new Date().toLocaleString(),
    paymentMethod: `${vault.duration || 'Fixed Term'} vault`,
    fee: 0,
  });
  acc.notifications = acc.notifications || [];
  acc.notifications.unshift({
    id: `notif-inv-${Date.now()}`,
    title: 'Vault Staked Successfully',
    message: `${amount.toFixed(2)} XENA locked in ${vault.name} (+${vault.apy}% APY). Yield accrues daily.`,
    timestamp: 'Just now',
    read: false,
    type: 'transaction',
  });
  saveDb();
  res.set('Cache-Control', 'no-store');
  res.json({ ok: true, investment: inv });
});

app.post('/api/invest/claim', (req, res) => {
  const { token, investmentId } = req.body || {};
  const email = emailForToken(token);
  if (!email) {
    res.status(401).json({ ok: false, error: 'Session invalid. Please sign in again.' });
    return;
  }
  const acc = (db.accounts || []).find((a) => a.email === email);
  if (!acc) {
    res.status(404).json({ ok: false, error: 'Account not found.' });
    return;
  }
  const inv = (acc.investments || []).find((i) => i.id === investmentId);
  if (!inv) {
    res.status(404).json({ ok: false, error: 'Investment not found.' });
    return;
  }
  if (inv.status !== 'active') {
    res.status(400).json({ ok: false, error: 'This vault is not accruing yield.' });
    return;
  }
  const amount = Number(inv.daily_yield_xena) > 0
    ? Number(inv.daily_yield_xena)
    : Math.round((Number(inv.invested_xena) * Number(inv.apy) / 100 / 365) * 10000) / 10000;
  acc.balances = acc.balances || {};
  acc.balances.availableXena = (acc.balances.availableXena || 0) + amount;
  acc.balances.totalBalance = (acc.balances.investedXena || 0) + (acc.balances.availableXena || 0);
  inv.earned_xena = Math.round(((Number(inv.earned_xena) || 0) + amount) * 10000) / 10000;
  acc.transactions = acc.transactions || [];
  acc.transactions.unshift({
    id: `tx-yield-${Date.now()}`,
    title: `Yield — ${inv.plan_name}`,
    type: 'yield',
    amount,
    unit: 'XENA',
    status: 'Completed',
    timestamp: new Date().toLocaleString(),
    paymentMethod: 'Auto-compound',
    fee: 0,
  });
  saveDb();
  res.json({ ok: true, amount });
});

// ---------- Admin: Investment management ----------
app.post('/api/admin/investments', (req, res) => {
  const { token, action, investmentId, note } = req.body || {};
  if (!requireAdminToken(token)) {
    res.status(401).json({ ok: false, error: 'Admin access required.' });
    return;
  }
  const now = new Date().toISOString();
  if (action === 'payout_all') {
    let processed = 0;
    for (const inv of (db.investments || [])) {
      if (inv.status === 'matured') {
        inv.status = 'active';
        inv.progress_percent = 0;
        inv.earned_xena = Number(inv.earned_xena) || 0;
        inv.days_remaining = Number(inv.total_days) || 0;
        inv.restarted_at = now;
        processed += 1;
      }
    }
    saveDb();
    res.json({ ok: true, processed });
    return;
  }
  const inv = (db.investments || []).find((i) => i.id === investmentId);
  if (!inv) {
    res.status(404).json({ ok: false, error: 'Investment not found.' });
    return;
  }
  if (action === 'restart') {
    inv.status = 'active';
    inv.progress_percent = 0;
    inv.earned_xena = 0;
    inv.days_remaining = Number(inv.total_days) || 0;
    inv.restarted_at = now;
    inv.admin_note = note || '';
  } else if (action === 'cancel') {
    inv.status = 'canceled';
    inv.canceled_at = now;
    inv.admin_note = note || '';
  } else if (action === 'payout') {
    inv.status = 'matured';
    inv.progress_percent = 100;
    inv.ended_at = now;
    inv.admin_note = note || '';
  } else {
    res.status(400).json({ ok: false, error: 'Unknown action.' });
    return;
  }
  // Keep the user's copy in sync.
  const acc = (db.accounts || []).find((a) => a.email === inv.email);
  if (acc) {
    const mine = (acc.investments || []).find((i) => i.id === inv.id);
    if (mine) {
      Object.assign(mine, {
        status: inv.status,
        progress_percent: inv.progress_percent,
        earned_xena: inv.earned_xena,
        days_remaining: inv.days_remaining,
        restarted_at: inv.restarted_at,
        canceled_at: inv.canceled_at,
        ended_at: inv.ended_at,
        admin_note: inv.admin_note,
      });
    }
  }
  saveDb();
  res.json({ ok: true, processed: 1 });
});

// ---------- Admin: Vault catalog ----------
app.post('/api/admin/vaults', (req, res) => {
  const { token, action, vaultId, payload } = req.body || {};
  if (!requireAdminToken(token)) {
    res.status(401).json({ ok: false, error: 'Admin access required.' });
    return;
  }
  db.vaultCatalog = db.vaultCatalog || [];
  if (action === 'update') {
    const vault = db.vaultCatalog.find((v) => v.id === vaultId);
    if (!vault) {
      res.status(404).json({ ok: false, error: 'Vault not found.' });
      return;
    }
    Object.assign(vault, {
      name: payload?.name != null ? payload.name : vault.name,
      category: payload?.category != null ? payload.category : vault.category,
      apy: payload?.apy != null ? Number(payload.apy) : vault.apy,
      duration: payload?.duration != null ? payload.duration : vault.duration,
      days: payload?.days != null ? Number(payload.days) : vault.days,
      minDeposit: payload?.minDeposit != null ? Number(payload.minDeposit) : vault.minDeposit,
      badge: payload?.badge != null ? payload.badge : vault.badge,
      risk: payload?.risk != null ? payload.risk : vault.risk,
      description: payload?.description != null ? payload.description : vault.description,
      active: payload?.active != null ? !!payload.active : vault.active,
    });
    saveDb();
    res.json({ ok: true, vault });
    return;
  }
  if (action === 'add') {
    const id = `cat-${Date.now()}`;
    const vault = {
      id,
      name: payload?.name || 'New Vault',
      category: payload?.category || 'Flexible',
      apy: Number(payload?.apy) || 0,
      duration: payload?.duration || 'Fixed Term',
      days: Number(payload?.days) || 0,
      minDeposit: Number(payload?.minDeposit) || 1,
      badge: payload?.badge || '',
      risk: payload?.risk || 'Low Risk',
      description: payload?.description || '',
      active: payload?.active !== false,
      sortOrder: Number(payload?.sortOrder) || db.vaultCatalog.length + 1,
    };
    db.vaultCatalog.unshift(vault);
    saveDb();
    res.json({ ok: true, id });
    return;
  }
  if (action === 'delete') {
    db.vaultCatalog = db.vaultCatalog.filter((v) => v.id !== vaultId);
    saveDb();
    res.json({ ok: true });
    return;
  }
  res.status(400).json({ ok: false, error: 'Unknown action.' });
});

// ---------- Promo codes ----------
app.post('/api/promo/redeem', (req, res) => {
  const { token, code } = req.body || {};
  const email = emailForToken(token);
  if (!email) {
    res.status(401).json({ ok: false, error: 'Session invalid. Please sign in again.' });
    return;
  }
  const acc = (db.accounts || []).find((a) => a.email === email);
  if (!acc) {
    res.status(404).json({ ok: false, error: 'Account not found.' });
    return;
  }
  const normalized = String(code || '').trim().toUpperCase();
  if (!normalized) {
    res.status(400).json({ ok: false, error: 'Enter a valid code.' });
    return;
  }
  if ((acc.redeemedBonusCodes || []).includes(normalized)) {
    res.status(400).json({ ok: false, error: 'You have already redeemed this code.' });
    return;
  }
  const promo = (db.promos || []).find(
    (p) => p && String(p.code || '').toUpperCase() === normalized
  );
  if (!promo || promo.active === false) {
    res.status(400).json({ ok: false, error: 'Invalid or inactive promo code.' });
    return;
  }
  if (promo.cap && Number(promo.used) >= Number(promo.cap)) {
    res.status(400).json({ ok: false, error: 'This promo code has reached its redemption cap.' });
    return;
  }
  const amount = Math.round(Number(promo.value) * 10000) / 10000;
  acc.balances = acc.balances || {};
  acc.balances.availableXena = (acc.balances.availableXena || 0) + amount;
  acc.balances.totalBalance = (acc.balances.totalBalance || 0) + amount;
  acc.redeemedBonusCodes = acc.redeemedBonusCodes || [];
  acc.redeemedBonusCodes.push(normalized);
  promo.used = Number(promo.used) + 1;
  acc.transactions = acc.transactions || [];
  acc.transactions.unshift({
    id: `tx-bonus-${Date.now()}`,
    title: `Bonus Code Claimed (${normalized})`,
    type: 'yield',
    amount,
    unit: 'XENA',
    status: 'Completed',
    timestamp: new Date().toLocaleString(),
    counterparty: 'XENA Community Reward Desk',
    fee: 0,
  });
  acc.notifications = acc.notifications || [];
  acc.notifications.unshift({
    id: `notif-bonus-${Date.now()}`,
    title: 'Bonus Voucher Claimed!',
    message: `+${amount.toFixed(2)} XENA has been credited to your available balance via promo code ${normalized}.`,
    timestamp: 'Just now',
    read: false,
    type: 'transaction',
  });
  db.bonusLog = db.bonusLog || [];
  db.bonusLog.unshift({
    id: `bl-${Date.now()}-${Math.floor(Math.random() * 999)}`,
    code: normalized,
    name: acc.name || acc.email,
    xena: amount,
    time: new Date().toLocaleString(),
  });
  saveDb();
  res.set('Cache-Control', 'no-store');
  res.json({ ok: true, amount, code: normalized, title: `Bonus Code Claimed (${normalized})` });
});

// ---------- Withdrawals ----------
app.post('/api/withdrawals/create', (req, res) => {
  const { token, payload } = req.body || {};
  const email = emailForToken(token);
  if (!email) {
    res.status(401).json({ ok: false, error: 'Session invalid. Please sign in again.' });
    return;
  }
  const acc = (db.accounts || []).find((a) => a.email === email);
  if (!acc) {
    res.status(404).json({ ok: false, error: 'Account not found.' });
    return;
  }
  const row = {
    id: `w-${Date.now()}-${Math.floor(Math.random() * 999)}`,
    email,
    user_name: acc.name || acc.email,
    method: payload?.method || 'ngn',
    amount_xena: Number(payload?.amount_xena) || 0,
    amount_ngn: Number(payload?.amount_ngn) || 0,
    fee: Number(payload?.fee) || 0,
    bank: payload?.bank || '',
    account_number: payload?.account_number || '',
    account_name: payload?.account_name || '',
    address: payload?.address || '',
    reference: payload?.reference || `WD-${Date.now().toString().slice(-8)}`,
    status: 'pending',
    admin_note: '',
    created_at: new Date().toISOString(),
  };
  db.withdrawals = [row, ...(db.withdrawals || [])];
  saveDb();
  res.set('Cache-Control', 'no-store');
  res.json({ ok: true, request: row });
});

app.post('/api/withdrawals/decide', (req, res) => {
  const { token, requestId, decision, note } = req.body || {};
  if (!requireAdminToken(token)) {
    res.status(401).json({ ok: false, error: 'Admin access required.' });
    return;
  }
  const row = (db.withdrawals || []).find((w) => w.id === requestId);
  if (!row) {
    res.status(404).json({ ok: false, error: 'Request not found.' });
    return;
  }
  row.status = decision === 'approved' ? 'approved' : 'rejected';
  row.admin_note = note || '';
  row.decided_at = new Date().toISOString();
  saveDb();
  res.json({ ok: true, status: row.status });
});

// ---------- Payments: shared helpers (Flutterwave / NOWPayments) ----------
const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY || '';
const FLUTTERWAVE_PUBLIC_KEY = process.env.FLUTTERWAVE_PUBLIC_KEY || '';
const FLUTTERWAVE_WEBHOOK_SECRET_HASH = process.env.FLUTTERWAVE_WEBHOOK_SECRET_HASH || '';
const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY || '';
const NOWPAYMENTS_IPN_SECRET = process.env.NOWPAYMENTS_IPN_SECRET || '';
const APP_ORIGIN = (process.env.APP_URL || `http://localhost:${PORT}`).replace(/\/+$/, '');

// Prefer the caller's own origin (from the browser via the Vite proxy in dev,
// or the app's public domain in production) so payment redirects always land
// on the correct frontend, regardless of how the server is reached.
function frontendOrigin(req) {
  const o = String(req.headers.origin || req.headers.referer || '').replace(/\/+$/, '');
  return o || APP_ORIGIN;
}

function rateNgn() {
  return Number(db?.xenaNgnRate) > 0 ? Number(db.xenaNgnRate) : XENA_NGN_RATE;
}
function priceUsd() {
  return Number(db?.xenaPrice) > 0 ? Number(db.xenaPrice) : DEFAULT_PRICE;
}
function xenaForNgn(amount) {
  return Math.round((Number(amount) / rateNgn()) * 10000) / 10000;
}
function xenaForUsd(amount) {
  return Math.round((Number(amount) / priceUsd()) * 10000) / 10000;
}

function pendingList() {
  db.pendingPayments = Array.isArray(db.pendingPayments) ? db.pendingPayments : [];
  return db.pendingPayments;
}

// Idempotently credit a confirmed payment row once.
function finalizeDeposit(pay, xena, opts = {}) {
  if (!pay) return false;
  if (pay.status === 'confirmed') return true;
  const acc = (db.accounts || []).find((a) => a.email === pay.email);
  if (!acc) return false;
  acc.balances = acc.balances || {};
  acc.balances.availableXena = (acc.balances.availableXena || 0) + xena;
  acc.balances.totalBalance = (acc.balances.totalBalance || 0) + xena;
  acc.transactions = acc.transactions || [];
  acc.transactions.unshift({
    id: `tx-${Date.now()}-${Math.floor(Math.random() * 999)}`,
    title: opts.title || 'Deposit',
    type: 'deposit',
    amount: xena,
    unit: 'XENA',
    status: 'Completed',
    timestamp: new Date().toLocaleString(),
    paymentMethod: opts.method || 'Payment',
    fee: 0,
  });
  acc.notifications = acc.notifications || [];
  acc.notifications.unshift({
    id: `notif-dep-${Date.now()}`,
    title: opts.notifTitle || 'Deposit Confirmed',
    message: opts.notifMessage || `${xena.toLocaleString()} XENA has been credited to your balance.`,
    timestamp: 'Just now',
    read: false,
    type: 'transaction',
  });
  pay.status = 'confirmed';
  pay.xena = xena;
  db.deposits = db.deposits || [];
  db.deposits.unshift({
    id: `dep-${Date.now()}`,
    user: acc.name || acc.email,
    email: pay.email,
    method: opts.method || pay.provider,
    amount: pay.amount,
    unit: pay.currency || 'USD',
    xena,
    status: 'Completed',
    time: 'Just now',
    reference: pay.reference,
  });
  saveDb();
  return true;
}

// ---------- Flutterwave (NGN deposits) ----------
app.post('/api/flutterwave/initialize', async (req, res) => {
  const { token, amountNgn } = req.body || {};
  const email = emailForToken(token);
  if (!email) {
    res.status(401).json({ ok: false, error: 'Session invalid. Please sign in again.' });
    return;
  }
  const acc = (db.accounts || []).find((a) => a.email === email);
  if (!acc) {
    res.status(404).json({ ok: false, error: 'Account not found.' });
    return;
  }
  const amount = Math.round(Number(amountNgn) || 0);
  if (!(amount > 0)) {
    res.status(400).json({ ok: false, error: 'Enter a valid deposit amount.' });
    return;
  }
  if (amount < MIN_NGN_DEPOSIT) {
    res.status(400).json({ ok: false, error: `Minimum deposit is ₦${MIN_NGN_DEPOSIT.toLocaleString()}.` });
    return;
  }
  if (!FLUTTERWAVE_SECRET_KEY) {
    res.status(500).json({ ok: false, error: 'Flutterwave is not configured.' });
    return;
  }
  const txRef = 'xena-' + crypto.randomBytes(12).toString('hex');
  const payload = {
    tx_ref: txRef,
    amount,
    currency: 'NGN',
    redirect_url: `${frontendOrigin(req)}/wallet?flutterwave_status=success`,
    payment_options: 'banktransfer,card,ussd',
    customer: { email, name: acc.name || 'XENA User' },
    customizations: { title: 'XENA Deposit', description: `Deposit ₦${amount.toLocaleString()} via Flutterwave`, logo: '' },
    meta: { email },
  };
  let fwData = {};
  try {
    const fw = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: { Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    fwData = await fw.json();
    if (!fw.ok || fwData?.status !== 'success') {
      res.status(502).json({ ok: false, error: fwData?.message || 'Unable to initialize Flutterwave payment.' });
      return;
    }
  } catch (err) {
    res.status(502).json({ ok: false, error: 'Unable to reach Flutterwave.' });
    return;
  }
  pendingList().unshift({
    id: `pp-${Date.now()}`,
    reference: txRef,
    provider: 'flutterwave',
    email,
    name: acc.name || '',
    amount,
    currency: 'NGN',
    status: 'pending',
    createdAt: new Date().toISOString(),
    meta: { tx_ref: txRef, payment_link: fwData.data?.link },
  });
  saveDb();
  res.set('Cache-Control', 'no-store');
  res.json({
    ok: true,
    reference: txRef,
    tx_ref: txRef,
    payment_link: fwData.data?.link,
    public_key: FLUTTERWAVE_PUBLIC_KEY,
  });
});

app.post('/api/flutterwave/webhook', async (req, res) => {
  const signature = req.headers['verif-hash'] || req.headers['x-flutterwave-signature'] || '';
  if (FLUTTERWAVE_WEBHOOK_SECRET_HASH && signature !== FLUTTERWAVE_WEBHOOK_SECRET_HASH) {
    res.status(401).json({ ok: false, error: 'Invalid signature.' });
    return;
  }
  const body = req.body || {};
  if (body.event !== 'charge.completed') {
    res.json({ ok: true });
    return;
  }
  const tx = body.data;
  if (!tx || tx.status !== 'successful' || tx.currency !== 'NGN') {
    res.json({ ok: true });
    return;
  }
  const pay = pendingList().find(
    (p) => p.provider === 'flutterwave' && (p.reference === tx.tx_ref || p.reference === String(tx.id || ''))
  );
  if (pay && pay.status === 'confirmed') {
    res.json({ ok: true });
    return;
  }
  let amount = Number(tx.amount || 0);
  let verified = false;
  if (FLUTTERWAVE_SECRET_KEY && tx.id) {
    try {
      const v = await fetch(`https://api.flutterwave.com/v3/transactions/${tx.id}/verify`, {
        headers: { Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}` },
      });
      const vd = await v.json();
      if (vd?.status === 'success' && vd?.data?.status === 'successful') {
        amount = Number(vd.data.amount || amount);
        verified = true;
      }
    } catch (err) {
      verified = false;
    }
  }
  if (verified && pay) {
    const xena = xenaForNgn(amount);
    finalizeDeposit(pay, xena, {
      title: 'Naira Deposit (Flutterwave)',
      method: 'Flutterwave · NGN',
      notifTitle: 'Flutterwave Deposit Confirmed',
      notifMessage: `Your NGN deposit was verified. ${xena.toLocaleString()} XENA has been credited to your balance.`,
    });
  }
  res.json({ ok: true });
});

app.post('/api/flutterwave/verify', async (req, res) => {
  const { token, tx_ref } = req.body || {};
  const email = emailForToken(token);
  if (!email) {
    res.status(401).json({ ok: false, error: 'Session invalid. Please sign in again.' });
    return;
  }
  const txRef = String(tx_ref || '').trim();
  if (!txRef) {
    res.status(400).json({ ok: false, error: 'Missing transaction reference.' });
    return;
  }
  const pay = pendingList().find((p) => p.provider === 'flutterwave' && p.reference === txRef && p.email === email);
  if (!pay) {
    res.status(404).json({ ok: false, error: 'Payment not found.' });
    return;
  }
  if (pay.status === 'confirmed') {
    res.json({ ok: true, xena: pay.xena || 0, duplicate: true });
    return;
  }
  if (!FLUTTERWAVE_SECRET_KEY) {
    res.status(500).json({ ok: false, error: 'Flutterwave is not configured.' });
    return;
  }
  let verifyData = {};
  try {
    const v = await fetch(`https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(txRef)}`, {
      headers: { Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}` },
    });
    verifyData = await v.json();
    if (!v.ok || verifyData?.status !== 'success') {
      res.status(400).json({ ok: false, error: verifyData?.message || 'Payment not confirmed yet. Try again in a few seconds.' });
      return;
    }
  } catch (err) {
    res.status(502).json({ ok: false, error: 'Unable to reach Flutterwave.' });
    return;
  }
  const tx = verifyData.data;
  if (!tx || tx.status !== 'successful') {
    res.status(400).json({ ok: false, error: `Payment status: ${tx?.status || 'unknown'}` });
    return;
  }
  const amount = Number(tx.amount || pay.amount || 0);
  const xena = xenaForNgn(amount);
  finalizeDeposit(pay, xena, {
    title: 'Naira Deposit (Flutterwave)',
    method: 'Flutterwave · NGN',
    notifTitle: 'Flutterwave Deposit Confirmed',
    notifMessage: `Your NGN deposit was verified. ${xena.toLocaleString()} XENA has been credited to your balance.`,
  });
  res.set('Cache-Control', 'no-store');
  res.json({ ok: true, xena });
});

// ---------- NOWPayments (crypto deposits) ----------
const CRYPTO_CURRENCIES = { usdt: 'usdttrc20', usdc: 'usdctrc20', btc: 'btc', sol: 'sol', eth: 'eth' };

app.post('/api/crypto/create', async (req, res) => {
  const { token, coin, amountUsd } = req.body || {};
  const email = emailForToken(token);
  if (!email) {
    res.status(401).json({ ok: false, error: 'Session invalid. Please sign in again.' });
    return;
  }
  const acc = (db.accounts || []).find((a) => a.email === email);
  if (!acc) {
    res.status(404).json({ ok: false, error: 'Account not found.' });
    return;
  }
  const coinKey = String(coin || '').toLowerCase();
  const payCurrency = CRYPTO_CURRENCIES[coinKey];
  if (!payCurrency) {
    res.status(400).json({ ok: false, error: 'Unsupported coin.' });
    return;
  }
  const usd = Number(amountUsd) || 0;
  if (!(usd > 0)) {
    res.status(400).json({ ok: false, error: 'Enter a valid USD amount.' });
    return;
  }
  if (usd < MIN_USD_DEPOSIT) {
    res.status(400).json({ ok: false, error: `Minimum deposit is $${MIN_USD_DEPOSIT}.` });
    return;
  }
  if (!NOWPAYMENTS_API_KEY) {
    res.status(500).json({ ok: false, error: 'NOWPayments is not configured.' });
    return;
  }
  let invoice = {};
  try {
    const inv = await fetch('https://api.nowpayments.io/v1/invoice', {
      method: 'POST',
      headers: { 'x-api-key': NOWPAYMENTS_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        price_amount: usd,
        price_currency: 'usd',
        pay_currency: payCurrency,
        order_id: `xena-${String(email).replace(/[^a-z0-9@._-]/gi, '')}-${Date.now()}`,
        order_description: `XENA deposit via ${coinKey.toUpperCase()}`,
        ipn_callback_url: `${APP_ORIGIN}/api/crypto/ipn`,
        success_url: `${frontendOrigin(req)}/wallet`,
        cancel_url: `${frontendOrigin(req)}/wallet`,
      }),
    });
    invoice = await inv.json();
    if (!inv.ok || !invoice?.id) {
      res.status(502).json({ ok: false, error: invoice?.message || 'NOWPayments rejected the invoice.' });
      return;
    }
  } catch (err) {
    res.status(502).json({ ok: false, error: 'Unable to reach NOWPayments.' });
    return;
  }
  const reference = String(invoice.payment_id || invoice.id);
  pendingList().unshift({
    id: `pp-${Date.now()}`,
    reference,
    provider: 'nowpayments',
    email,
    name: acc.name || '',
    amount: usd,
    currency: 'USD',
    status: 'pending',
    createdAt: new Date().toISOString(),
    meta: { coin: coinKey, invoice_id: String(invoice.id) },
  });
  saveDb();
  res.set('Cache-Control', 'no-store');
  res.json({
    ok: true,
    payment_id: reference,
    pay_address: invoice.pay_address || null,
    pay_amount: Number(invoice.pay_amount || usd),
    pay_currency: invoice.pay_currency || payCurrency,
    status: invoice.payment_status || 'waiting',
    invoice_url: invoice.invoice_url || null,
  });
});

app.post('/api/crypto/ipn', async (req, res) => {
  const signature = req.headers['x-nowpayments-sig'] || '';
  if (!NOWPAYMENTS_IPN_SECRET || !signature) {
    res.status(401).json({ ok: false, error: 'Missing signature.' });
    return;
  }
  const raw = Buffer.isBuffer(req.rawBody) ? req.rawBody.toString('utf8') : JSON.stringify(req.body || {});
  const expected = crypto.createHmac('sha512', NOWPAYMENTS_IPN_SECRET).update(raw).digest('hex');
  const a = Buffer.from(signature, 'hex');
  const b = Buffer.from(expected, 'hex');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    res.status(401).json({ ok: false, error: 'Invalid signature.' });
    return;
  }
  const parsed = req.body || {};
  const paymentId = String(parsed.payment_id || parsed.id || '');
  if (!paymentId) return res.json({ ok: true });
  const status = String(parsed.payment_status || parsed.status || '');
  if (!['confirmed', 'finished'].includes(status)) return res.json({ ok: true });
  const pay = pendingList().find((p) => p.provider === 'nowpayments' && p.reference === paymentId);
  if (!pay) return res.json({ ok: true });
  if (pay.status === 'confirmed') return res.json({ ok: true });
  const amount = Number(parsed.fiat_amount || parsed.price_amount || pay.amount || 0);
  const xena = xenaForUsd(amount);
  const coinLabel = String(pay.meta?.coin || '').toUpperCase() || 'Crypto';
  finalizeDeposit(pay, xena, {
    title: 'Crypto Deposit (NOWPayments)',
    method: `NOWPayments · ${coinLabel}`,
    notifTitle: 'Crypto Deposit Confirmed',
    notifMessage: `Your ${coinLabel} payment was confirmed. ${xena.toLocaleString()} XENA has been credited to your balance.`,
  });
  res.json({ ok: true });
});

app.post('/api/crypto/status', async (req, res) => {
  const { token, payment_id } = req.body || {};
  const email = emailForToken(token);
  if (!email) {
    res.status(401).json({ ok: false, error: 'Session invalid. Please sign in again.' });
    return;
  }
  const paymentId = String(payment_id || '').trim();
  if (!paymentId) {
    res.status(400).json({ ok: false, error: 'Missing payment id.' });
    return;
  }
  const pay = pendingList().find((p) => p.provider === 'nowpayments' && p.reference === paymentId && p.email === email);
  if (!pay) {
    res.status(404).json({ ok: false, error: 'Payment not found.' });
    return;
  }
  if (pay.status === 'confirmed') {
    res.json({ ok: true, status: 'confirmed', xena: pay.xena || 0, duplicate: true });
    return;
  }
  if (!NOWPAYMENTS_API_KEY) {
    res.status(500).json({ ok: false, error: 'NOWPayments is not configured.' });
    return;
  }
  let data = {};
  try {
    const sres = await fetch(`https://api.nowpayments.io/v1/payment/${encodeURIComponent(paymentId)}`, {
      headers: { 'x-api-key': NOWPAYMENTS_API_KEY },
    });
    data = await sres.json();
  } catch (err) {
    res.status(502).json({ ok: false, error: 'Unable to reach NOWPayments.' });
    return;
  }
  const status = String(data.payment_status || pay.status || 'waiting');
  if (!['confirmed', 'finished'].includes(status)) {
    res.json({ ok: true, status });
    return;
  }
  const amount = Number(data.fiat_amount || data.price_amount || pay.amount || 0);
  const xena = xenaForUsd(amount);
  const coinLabel = String(pay.meta?.coin || '').toUpperCase() || 'Crypto';
  finalizeDeposit(pay, xena, {
    title: 'Crypto Deposit (NOWPayments)',
    method: `NOWPayments · ${coinLabel}`,
    notifTitle: 'Crypto Deposit Confirmed',
    notifMessage: `Your ${coinLabel} payment was confirmed. ${xena.toLocaleString()} XENA has been credited to your balance.`,
  });
  res.set('Cache-Control', 'no-store');
  res.json({ ok: true, status: 'confirmed', xena });
});

// ---------- Static client ----------
const DIST_DIR = path.join(__dirname, 'dist');
const INDEX_HTML = path.join(DIST_DIR, 'index.html');

if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get(/^(?!\/api\/).*/, (req, res) => {
    res.sendFile(INDEX_HTML, (err) => {
      if (err) res.status(404).end();
    });
  });
} else {
  app.get('/', (req, res) => {
    res.type('text/plain').send('XENA Exchange API is running. Build the client with `npm run build` first.');
  });
}

// ---------- Boot ----------
initStorage()
  .then(() => {
    ensureShowcase();
    app.listen(PORT, () => {
      console.log(`XENA Exchange server listening on http://localhost:${PORT}`);
      console.log(`Storage: ${usingFileStorage || !pool ? 'JSON file (data/db.json)' : 'PostgreSQL'}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });