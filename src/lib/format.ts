import type {
  Account,
  Announcement,
  InvestmentPlan,
  NotificationItem,
  P2POffer,
  P2PTrade,
  Transaction,
  UserBalances,
} from '../types';

export const XENA_NGN_RATE = 1500;
export const DEFAULT_PRICE = 2.85;

export function mapBalances(b: any): UserBalances {
  return {
    totalXena: Number(b?.totalXena || 0),
    totalBalance: Number(b?.totalBalance ?? b?.totalXena ?? 0),
    usdRate: Number(b?.usdRate || 1),
    change24hAmount: Number(b?.change24hAmount || 0),
    change24hPercent: Number(b?.change24hPercent || 0),
    availableXena: Number(b?.availableXena || 0),
    investedXena: Number(b?.investedXena || 0),
    averageBuyPrice: Number(b?.averageBuyPrice || 0),
    currentPrice: Number(b?.currentPrice || DEFAULT_PRICE),
    stakedXena: Number(b?.stakedXena || 0),
    lockedInOrders: Number(b?.lockedInOrders || 0),
    nairaBalance: Number(b?.nairaBalance || 0),
    xenaNgnRate: Number(b?.xenaNgnRate || XENA_NGN_RATE),
  };
}

export function mapTransactions(txs: any[]): Transaction[] {
  return Array.isArray(txs) ? (txs as Transaction[]) : [];
}

export function mapNotifications(ns: any[]): NotificationItem[] {
  return Array.isArray(ns) ? (ns as NotificationItem[]) : [];
}

export function mapInvestment(i: any): InvestmentPlan {
  const status = String(i?.status || 'active');
  return {
    id: i.id,
    name: i.plan_name || i.planName || 'Vault',
    category: i.category || 'Flexible',
    investedAmount: Number(i.invested_xena || i.investedXena || 0),
    projectedReturnPercent: Number(i.apy ?? i.projectedReturnPercent ?? 0),
    earnedAmount: Number(i.earned_xena || i.earnedAmount || 0),
    progressPercent: Number(i.progress_percent ?? i.progressPercent ?? 0),
    daysRemaining: Number(i.days_remaining ?? i.daysRemaining ?? 0),
    totalDays: Number(i.total_days ?? i.totalDays ?? 0),
    startDate: i.started_at || i.startDate,
    endDate: i.ended_at || i.endDate,
    status: status === 'canceled' ? 'Pending' : status === 'matured' ? 'Matured' : 'Active',
    dailyYieldXena: Number(i.daily_yield_xena || i.dailyYieldXena || 0),
  };
}

export function mapVault(v: any) {
  return {
    id: v.id,
    name: v.name,
    category: v.category || 'Flexible',
    apy: Number(v.apy || 0),
    duration: v.duration || 'Flexible',
    days: Number(v.days || 0),
    minDeposit: Number(v.min_deposit ?? v.minDeposit ?? 1),
    badge: v.badge || '',
    risk: v.risk || 'Low Risk',
    description: v.description || '',
    active: v.active !== false,
    sortOrder: Number(v.sort_order || v.sortOrder || 0),
  };
}

export function mapOffer(o: any): P2POffer {
  return {
    id: o.id,
    merchantName: o.merchant_name || o.merchantName || '',
    merchantTier: o.merchant_tier || o.merchantTier || 'Verified Trader',
    completionRate: Number(o.completion_rate ?? o.completionRate ?? 100),
    completedOrders: Number(o.completed_orders ?? o.completedOrders ?? 0),
    ordersCount: Number(o.orders_count ?? o.ordersCount ?? 0),
    type: o.type,
    pricePerXena: Number(o.price_per_xena ?? o.pricePerXena ?? DEFAULT_PRICE),
    currency: o.currency || 'USD',
    minLimit: Number(o.min_limit ?? o.minLimit ?? 50),
    maxLimit: Number(o.max_limit ?? o.maxLimit ?? 2500),
    availableXena: Number(o.available_xena ?? o.availableXena ?? 1000),
    paymentMethods: o.payment_methods || o.paymentMethods || ['Bank Transfer'],
    paymentMethod: o.payment_method || o.paymentMethod || 'Bank Transfer',
    responseTimeMinutes: Number(o.response_time_minutes ?? o.responseTimeMinutes ?? 2),
    isOnline: o.is_online !== false,
    status: o.status || 'pending',
    listedBy: o.listed_by || o.listedBy || '',
    listedEmail: o.listed_email || o.listedEmail || '',
    sortOrder: Number(o.sort_order ?? o.sortOrder ?? 1000),
    listedAt: o.listed_at ? Number(o.listed_at) : undefined,
  };
}

export function mapTrade(t: any): P2PTrade {
  return {
    id: t.id,
    offerId: t.offer_id || t.offerId || '',
    merchantName: t.merchant_name || t.merchantName || '',
    type: t.type || 'BUY',
    method: t.method || '',
    fiatAmount: Number(t.fiat_amount ?? t.fiatAmount ?? 0),
    currency: t.currency || 'USD',
    xenaAmount: Number(t.xena_amount ?? t.xenaAmount ?? 0),
    pricePerXena: Number(t.price_per_xena ?? t.pricePerXena ?? DEFAULT_PRICE),
    buyerEmail: t.buyer_email || t.buyerEmail || '',
    status: t.status || 'awaiting_validation',
    reference: t.reference || '',
    time: t.time || 'Just now',
  };
}

export function mapAnnouncement(a: any): Announcement {
  return {
    id: a.id,
    title: a.title,
    date: a.date,
    tag: a.tag || 'News',
    tagColor: a.tag_color || a.tagColor || 'bg-emerald-50 text-[#16A34A] border-emerald-100',
    summary: a.summary,
    actionText: a.action_text || a.actionText,
    actionId: a.action_id || a.actionId,
    publishedBy: a.published_by || a.publishedBy,
  };
}

export function mapConversation(c: any) {
  return {
    id: c.id,
    email: c.email,
    userName: c.user_name || c.userName || c.email,
    status: c.status === 'resolved' ? 'resolved' : ('open' as const),
    createdAt: Number(c.created_at ?? c.createdAt ?? 0),
    updatedAt: c.updated_at ? Number(c.updated_at) : undefined,
    messages: Array.isArray(c.messages) ? c.messages : [],
  };
}

// Server accounts are already camelCase; this normalizes the shapes the
// signed-in user profile expects (snake_case rows -> typed client objects).
export function mapProfileToAccount(p: any, investments: InvestmentPlan[] = []): Account {
  return {
    id: p.id || '',
    name: p.name || '',
    email: p.email || '',
    password: '',
    country: p.country || 'Nigeria',
    phone: p.phone || '',
    dob: p.dob || '',
    referrer: p.referrer || '',
    xenaId: p.xenaId || '',
    xenaCode: p.xenaCode || '',
    kycTier: p.kycTier || 'Tier 1 (Pending)',
    status: p.status || 'active',
    joined: p.joined || '',
    twoFactorEnabled: !!p.twoFactorEnabled,
    pinSet: !!p.pinSet,
    verifiedAccountsCount: Number(p.verifiedAccountsCount || 0),
    balances: mapBalances(p.balances),
    transactions: mapTransactions(p.transactions),
    investments: investments.length > 0 ? investments : (p.investments || []).map(mapInvestment),
    notifications: mapNotifications(p.notifications),
    redeemedBonusCodes: Array.isArray(p.redeemedBonusCodes) ? p.redeemedBonusCodes : [],
    bankDetails: Array.isArray(p.bankDetails) ? p.bankDetails : [],
    walletAddresses: Array.isArray(p.walletAddresses) ? p.walletAddresses : [],
  };
}