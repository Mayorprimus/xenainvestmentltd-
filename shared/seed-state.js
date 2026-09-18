import crypto from 'crypto';

// ---------------------------------------------------------------------------
// Shared seed document + crypto helpers.
//
// Both `server.js` (in-memory + PostgreSQL document store) and
// `scripts/init-db.js` (PostgreSQL bootstrap) build their initial data from
// here, so the server, the DB and the deployed app all agree on the same seed.
// ---------------------------------------------------------------------------

export const ADMIN_EMAIL = 'admin12345@gmail.com';
export const ADMIN_PASSWORD = 'admin12345';

export const XENA_NGN_RATE = 1500; // 1 XENA = ₦1500
export const DEFAULT_PRICE = 2.85; // 1 XENA = $2.85
export const MIN_NGN_DEPOSIT = 3000;
export const MIN_USD_DEPOSIT = 10;

// ---------- Password hashing (Node built-in scrypt, no deps) ----------
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

export function verifyPassword(password, salt, hash) {
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(password, salt, 64).toString('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(candidate, 'hex'), Buffer.from(hash, 'hex'));
  } catch {
    return false;
  }
}

// ---------- Seed document (snake_case where downstream UI expects it) ----------
export const BASE_STATE = {
  users: [
    { id: 'u1', name: 'Alex Morgan', email: 'alex.morgan@xena.fi', country: 'Canada', kycTier: 'Tier 2', balance: 12840, status: 'Active' },
    { id: 'u2', name: 'Fatima Abubakar', email: 'fatima.a@xena.fi', country: 'Nigeria', kycTier: 'Tier 2', balance: 4520, status: 'Active' },
    { id: 'u3', name: 'David Chen', email: 'd.chen@xena.fi', country: 'Singapore', kycTier: 'Tier 1', balance: 980, status: 'Active' },
    { id: 'u4', name: 'Grace Okafor', email: 'grace.o@xena.fi', country: 'Ghana', kycTier: 'Tier 1', balance: 1210, status: 'Frozen' },
    { id: 'u5', name: 'Omar Hassan', email: 'omar.h@xena.fi', country: 'UAE', kycTier: 'Tier 3 (Institutional)', balance: 78200, status: 'Active' },
    { id: 'u6', name: 'Lina Kowalski', email: 'lina.k@xena.fi', country: 'Poland', kycTier: 'Tier 2', balance: 3360, status: 'Active' },
    { id: 'u7', name: 'Chen Wei', email: 'chen.wei@xena.fi', country: 'China', kycTier: 'Tier 1', balance: 540, status: 'Pending KYC' },
    { id: 'u8', name: 'Sara Mensah', email: 'sara.m@xena.fi', country: 'Kenya', kycTier: 'Tier 1', balance: 720, status: 'Active' },
  ],
  txs: [
    { id: 't1', user: 'Alex Morgan', type: 'Deposit', amount: 2500, unit: 'XENA', status: 'Completed', time: '2 min ago', method: 'USDT' },
    { id: 't2', user: 'Fatima Abubakar', type: 'Withdrawal', amount: 1500, unit: 'XENA', status: 'Pending', time: '8 min ago', method: 'NGN Bank' },
    { id: 't3', user: 'Omar Hassan', type: 'P2P Sell', amount: 5000, unit: 'XENA', status: 'Completed', time: '22 min ago', method: 'Escrow' },
    { id: 't4', user: 'David Chen', type: 'Deposit', amount: 400, unit: 'XENA', status: 'Completed', time: '1 hr ago', method: 'BTC' },
    { id: 't5', user: 'Lina Kowalski', type: 'Withdrawal', amount: 800, unit: 'XENA', status: 'Pending', time: '2 hrs ago', method: 'USDT' },
    { id: 't6', user: 'Grace Okafor', type: 'P2P Buy', amount: 200, unit: 'XENA', status: 'Failed', time: '3 hrs ago', method: 'Escrow' },
    { id: 't7', user: 'Sara Mensah', type: 'Investment', amount: 50, unit: 'XENA', status: 'Completed', time: '5 hrs ago', method: 'Vault' },
    { id: 't8', user: 'Chen Wei', type: 'Withdrawal', amount: 120, unit: 'XENA', status: 'Completed', time: '8 hrs ago', method: 'SOL' },
  ],
  merchants: [
    { id: 'm1', name: 'CryptoDesk NG', owner: 'Fatima Abubakar', verified: true, orders: 1240, rating: 98.6 },
    { id: 'm2', name: 'QuickXchange', owner: 'David Chen', verified: false, orders: 312, rating: 92.1 },
    { id: 'm3', name: 'AfriTrade Hub', owner: 'Sara Mensah', verified: true, orders: 860, rating: 97.2 },
    { id: 'm4', name: 'Gulf Prime', owner: 'Omar Hassan', verified: true, orders: 2210, rating: 99.1 },
    { id: 'm5', name: 'EuroBridge', owner: 'Lina Kowalski', verified: false, orders: 145, rating: 88.4 },
  ],
  disputes: [
    { id: 'd1', offer: 'CryptoDesk NG', buyer: 'User 8842', seller: 'Fatima Abubakar', amount: 1500, reason: 'Payment not received', status: 'Open' },
    { id: 'd2', offer: 'Gulf Prime', buyer: 'User 1201', seller: 'Omar Hassan', amount: 3200, reason: 'Wrong NGN amount credited', status: 'Open' },
    { id: 'd3', offer: 'AfriTrade Hub', buyer: 'User 5530', seller: 'Sara Mensah', amount: 800, reason: 'Seller wants release without proof', status: 'Escalated' },
  ],
  tickets: [
    { id: 's1', user: 'Alex Morgan', subject: 'Withdrawal stuck on Pending', status: 'Open', priority: 'High', time: '12 min ago' },
    { id: 's2', user: 'Omar Hassan', subject: 'KYC tier upgrade request', status: 'Open', priority: 'Medium', time: '45 min ago' },
    { id: 's3', user: 'Chen Wei', subject: 'Cannot verify identity documents', status: 'Pending', priority: 'High', time: '2 hrs ago' },
    { id: 's4', user: 'Grace Okafor', subject: 'Account frozen — appeal', status: 'Resolved', priority: 'Low', time: '1 day ago' },
  ],
  promos: [
    { id: 'p1', code: 'WELCOME50', value: 50, unit: 'XENA', used: 0, cap: 10000, active: true },
    { id: 'p2', code: 'XENA25', value: 25, unit: 'XENA', used: 0, cap: 10000, active: true },
    { id: 'p3', code: 'VIP100', value: 100, unit: 'XENA', used: 0, cap: 5000, active: true },
    { id: 'p4', code: 'P2PZERO', value: 15, unit: 'XENA', used: 0, cap: 10000, active: true },
  ],
  audit: [
    { id: 'a1', action: 'Admin login', actor: 'Super Admin', detail: 'Signed in from 192.168.1.4', time: '2 min ago' },
    { id: 'a2', action: 'Wallet freeze', actor: ADMIN_EMAIL, detail: 'Froze account Grace Okafor', time: '1 hr ago' },
    { id: 'a3', action: 'KYC approval', actor: 'KYC Officer', detail: 'Upgraded Chen Wei to Tier 1', time: '3 hrs ago' },
    { id: 'a4', action: 'Payout run', actor: 'System', detail: 'Auto-compounded 1,240 vaults', time: '6 hrs ago' },
    { id: 'a5', action: 'Settings change', actor: 'Super Admin', detail: 'Maintenance mode disabled', time: '1 day ago' },
  ],
  deposits: [
    { id: 'dep1', user: 'Alex Morgan', email: 'alex.morgan@xena.fi', method: 'USDT (TRC-20)', amount: 2500, unit: 'USD', xena: 8750, status: 'Completed', time: '2 min ago' },
    { id: 'dep2', user: 'Omar Hassan', email: 'omar.h@xena.fi', method: 'Bank Transfer (AED)', amount: 8000, unit: 'USD', xena: 28000, status: 'Completed', time: '22 min ago' },
    { id: 'dep3', user: 'David Chen', email: 'd.chen@xena.fi', method: 'BTC', amount: 400, unit: 'USD', xena: 1400, status: 'Completed', time: '1 hr ago' },
    { id: 'dep4', user: 'Sara Mensah', email: 'sara.m@xena.fi', method: 'M-Pesa', amount: 200, unit: 'USD', xena: 700, status: 'Pending', time: '4 hrs ago' },
    { id: 'dep5', user: 'Lina Kowalski', email: 'lina.k@xena.fi', method: 'EUR SEPA', amount: 1200, unit: 'USD', xena: 4200, status: 'Completed', time: '6 hrs ago' },
    { id: 'dep6', user: 'Fatima Abubakar', email: 'fatima.a@xena.fi', method: 'NGN Bank Transfer', amount: 900, unit: 'USD', xena: 3150, status: 'Pending', time: '9 hrs ago' },
  ],
  referrals: [
    { id: 'r1', user: 'Fatima Abubakar', refCode: 'FATIMA-X', count: 24, earned: 360 },
    { id: 'r2', user: 'Omar Hassan', refCode: 'OMAR-X', count: 41, earned: 615 },
    { id: 'r3', user: 'Alex Morgan', refCode: 'ALEX-X', count: 18, earned: 270 },
    { id: 'r4', user: 'Sara Mensah', refCode: 'SARA-X', count: 12, earned: 180 },
    { id: 'r5', user: 'David Chen', refCode: 'DAVID-X', count: 6, earned: 90 },
    { id: 'r6', user: 'Lina Kowalski', refCode: 'LINA-X', count: 9, earned: 135 },
  ],
  bonusLog: [],
  p2pOffers: [
    {
      id: 'p2p-ad-pending',
      merchantName: 'MexiTrade_Official',
      merchantTier: 'Pro Merchant',
      completionRate: 99.1,
      completedOrders: 1240,
      ordersCount: 1240,
      type: 'SELL',
      pricePerXena: 2.86,
      currency: 'USD',
      minLimit: 100,
      maxLimit: 2500,
      availableXena: 5200,
      paymentMethods: ['Bank Transfer', 'P2P Wallet'],
      paymentMethod: 'Bank Transfer, P2P Wallet',
      responseTimeMinutes: 3,
      isOnline: true,
      status: 'pending',
      listedBy: 'Justin Reyes',
      listedEmail: 'justin.r@xena.fi',
      listedAt: null,
      sortOrder: 1000,
    },
    {
      id: 'p2p-ad-01',
      merchantName: 'NordicPay_Official',
      merchantTier: 'VIP Merchant',
      completionRate: 100.0,
      completedOrders: 1842,
      ordersCount: 1842,
      type: 'BUY',
      pricePerXena: 2.85,
      currency: 'USD',
      minLimit: 50,
      maxLimit: 5000,
      availableXena: 8400,
      paymentMethods: ['Bank Transfer', 'Revolut', 'Wise'],
      paymentMethod: 'Bank Transfer, Revolut, Wise',
      responseTimeMinutes: 2,
      isOnline: true,
      status: 'approved',
      listedBy: 'Admin',
      listedEmail: ADMIN_EMAIL,
      listedAt: null,
      sortOrder: 1,
    },
    {
      id: 'p2p-ad-02',
      merchantName: 'CryptoExpress_EU',
      merchantTier: 'Pro Merchant',
      completionRate: 99.6,
      completedOrders: 954,
      ordersCount: 954,
      type: 'BUY',
      pricePerXena: 2.845,
      currency: 'USD',
      minLimit: 100,
      maxLimit: 3000,
      availableXena: 4200,
      paymentMethods: ['SEPA Instant', 'Revolut', 'PayPal'],
      paymentMethod: 'SEPA Instant, Revolut, PayPal',
      responseTimeMinutes: 3,
      isOnline: true,
      status: 'approved',
      listedBy: 'Admin',
      listedEmail: ADMIN_EMAIL,
      listedAt: null,
      sortOrder: 2,
    },
  ],
  p2pTrades: [],
  supportConvs: [],
  announcements: [
    {
      id: 'ann-1',
      title: 'Zero-Fee P2P Trading Carnival is Now Live!',
      date: 'May 24, 2026',
      tag: 'Promotion',
      tagColor: 'bg-emerald-50 text-[#16A34A] border-emerald-100',
      summary: 'Trade fiat-to-XENA with 0% maker and taker fees through our verified peer-to-peer network. Over 40 fiat payment channels supported with instant smart escrow protection.',
      actionText: 'Start P2P Trading',
      actionId: 'p2p',
    },
    {
      id: 'ann-2',
      title: 'New High-Yield 180-Day Institutional Staking Vault (52.0% APY)',
      date: 'May 20, 2026',
      tag: 'Staking',
      tagColor: 'bg-purple-50 text-[#6D28D9] border-purple-100',
      summary: 'We have expanded our decentralized validator delegation pools. Lock your XENA tokens to earn up to 52% APY with daily compounded payouts and automated slashing protection.',
      actionText: 'View Staking Vaults',
      actionId: 'staking',
    },
    {
      id: 'ann-3',
      title: 'XENA Network Upgrades to Mainnet v2.4 (Sub-Second Finality)',
      date: 'May 15, 2026',
      tag: 'System Upgrade',
      tagColor: 'bg-blue-50 text-blue-600 border-blue-100',
      summary: 'The XENA blockchain layer has successfully transitioned to consensus v2.4, achieving sub-second block finality and gas fee reductions of over 70% across all decentralized transactions.',
      actionText: 'Explore System Details',
    },
    {
      id: 'ann-4',
      title: 'CertiK Complete Security Audit & Proof-of-Reserves Verification',
      date: 'May 10, 2026',
      tag: 'Security',
      tagColor: 'bg-purple-50 text-[#6D28D9] border-purple-100',
      summary: 'CertiK has completed its formal verification of all XENA smart contracts with a 99/100 security score. Proof-of-Reserves merkle trees are now updated live on-chain every 6 hours.',
      actionText: 'View Security Audit',
    },
  ],
  settings: { maintenanceMode: false, p2pZeroFee: true, withdrawApproval: true },
  xenaPrice: DEFAULT_PRICE,
  xenaNgnRate: XENA_NGN_RATE,
  limits: { min_deposit_ngn: MIN_NGN_DEPOSIT, min_withdrawal_ngn: MIN_NGN_DEPOSIT },
  vaultCatalog: [
    { id: 'cat-flex', name: 'Micro Starter', category: 'Flexible', apy: 12, duration: 'Flexible', days: 0, minDeposit: 1.05, badge: 'Instant Redeem', risk: 'Low Risk', description: 'A tiny low-pressure entry point. Withdraw any time, yield compounds daily.', active: true, sortOrder: 1 },
    { id: 'cat-2wk-sprint', name: '2-Week Sprint', category: '2-Week (14D)', apy: 20, duration: '2-Week Lock', days: 14, minDeposit: 3.51, badge: '⚡ 2-Week', risk: 'Audited', description: 'A fast 14-day lock with a friendly APY boost on your starter amount.', active: true, sortOrder: 2 },
    { id: 'cat-2wk-surge', name: '2-Week Surge', category: '2-Week (14D)', apy: 24, duration: '2-Week Lock', days: 14, minDeposit: 5.26, badge: 'High Yield', risk: 'Protected', description: 'Proof-of-stake delegation with 14-day compounding and payout at maturity.', active: true, sortOrder: 3 },
    { id: 'cat-30d', name: '30-Day Growth', category: 'Fixed Term', apy: 28, duration: '30-Day Lock', days: 30, minDeposit: 8.07, badge: 'Popular', risk: 'Audited Strategy', description: 'A balanced one-month vault routing liquidity for steady amplified yield.', active: true, sortOrder: 4 },
    { id: 'cat-45d', name: '45-Day Momentum', category: 'Fixed Term', apy: 34, duration: '45-Day Lock', days: 45, minDeposit: 12.28, badge: 'Trending', risk: 'Hedged', description: 'A mid-term play blending validator yield with defensive hedging.', active: true, sortOrder: 5 },
    { id: 'cat-90d', name: 'VIP Boost', category: 'VIP Tier', apy: 42, duration: '90-Day Lock', days: 90, minDeposit: 14.04, badge: 'High APY', risk: 'Protected', description: 'The top tier — institutional revenue share with maximum compounding power.', active: true, sortOrder: 6 },
  ],
  investments: [
    {
      id: 'inv-demo-1',
      email: 'alex.morgan@xena.fi',
      user_name: 'Alex Morgan',
      plan_name: '30-Day Growth',
      category: 'Fixed Term',
      invested_xena: 23,
      apy: 28,
      earned_xena: 0,
      total_days: 30,
      days_remaining: 30,
      progress_percent: 0,
      started_at: '',
      ended_at: null,
      restarted_at: null,
      canceled_at: null,
      status: 'active',
      admin_note: '',
      daily_yield_xena: 0.0176,
    },
  ],
  withdrawals: [],
  payments: [],
  pendingPayments: [],
  accounts: [],
  tokens: {},
};

// Showcase account (rich seeded profile) with a real scrypt hash so the demo
// login works through the normal auth flow.
export function makeShowcaseAccount() {
  const { salt, hash } = hashPassword('xena-user-demo');
  const now = new Date();
  const startedAt = new Date(now.getTime() - 3 * 86400000).toISOString();
  const balance = {
    totalXena: 2850.5,
    totalBalance: 2850.5,
    usdRate: 1.0,
    change24hAmount: 320.5,
    change24hPercent: 12.65,
    availableXena: 2850.5,
    investedXena: 23,
    averageBuyPrice: 2.15,
    currentPrice: DEFAULT_PRICE,
    stakedXena: 0,
    lockedInOrders: 0,
    nairaBalance: 2450000,
    xenaNgnRate: XENA_NGN_RATE,
  };
  return {
    name: 'Alex Morgan',
    email: 'alex.morgan@xena.fi',
    country: 'Canada',
    phone: '+1 416 555 0198',
    dob: '1991-04-18',
    referrer: '',
    id: 'acct-alex',
    xenaId: 'XN-000001',
    xenaCode: 'ALEX-X',
    kycTier: 'Tier 2',
    status: 'Active',
    joined: new Date().toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
    twoFactorEnabled: true,
    pinSet: true,
    verifiedAccountsCount: 2,
    salt,
    hash,
    balances: balance,
    transactions: [
      { id: 'tx-seed-1', title: 'Deposit', type: 'deposit', amount: 500, unit: 'XENA', status: 'Completed', timestamp: 'Today, 14:23', paymentMethod: 'Instant SEPA Bank Transfer', fee: 0 },
      { id: 'tx-seed-2', title: 'P2P Sell', type: 'p2p', amount: 120, unit: 'XENA', status: 'Completed', timestamp: 'Yesterday, 09:12', paymentMethod: 'NGN Bank Transfer', fee: 0, counterparty: 'CryptoDesk NG' },
      { id: 'tx-seed-3', title: 'Staking Yield', type: 'yield', amount: 38.25, unit: 'XENA', status: 'Completed', timestamp: 'May 22, 2026', paymentMethod: 'Auto-compound', fee: 0 },
    ],
    investments: [
      {
        id: 'inv-demo-1',
        plan_name: '30-Day Growth',
        category: 'Fixed Term',
        invested_xena: 23,
        apy: 28,
        earned_xena: 0,
        total_days: 30,
        days_remaining: 30,
        progress_percent: 0,
        started_at: startedAt,
        ended_at: null,
        restarted_at: null,
        canceled_at: null,
        status: 'active',
        admin_note: '',
        daily_yield_xena: 0.0176,
      },
    ],
    notifications: [
      { id: 'n-seed-1', title: 'Welcome to XENA', message: 'Your secure exchange account is ready. Set up 2FA for extra protection.', timestamp: 'Just now', read: false, type: 'general' },
    ],
    redeemedBonusCodes: [],
    bankDetails: [],
    walletAddresses: [],
  };
}

export function buildSeedDocument() {
  const doc = structuredClone(BASE_STATE);
  const now = Date.now();
  doc.p2pOffers = doc.p2pOffers.map((o) => ({ ...o, listedAt: now }));
  const account = makeShowcaseAccount();
  const inv = account.investments[0];
  doc.investments = [{
    id: inv.id,
    email: account.email,
    user_name: account.name,
    plan_name: inv.plan_name,
    category: inv.category,
    invested_xena: inv.invested_xena,
    apy: inv.apy,
    earned_xena: inv.earned_xena,
    total_days: inv.total_days,
    days_remaining: inv.days_remaining,
    progress_percent: inv.progress_percent,
    started_at: inv.started_at,
    ended_at: null,
    restarted_at: null,
    canceled_at: null,
    status: 'active',
    admin_note: '',
    daily_yield_xena: inv.daily_yield_xena,
  }];
  doc.accounts.unshift(account);
  return doc;
}