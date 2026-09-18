import crypto from 'crypto';

// Generate secure secrets for payment providers
const flutterwaveWebhookSecret = crypto.randomBytes(32).toString('hex');
const nowpaymentsIpnSecret = crypto.randomBytes(32).toString('hex');
const sessionSecret = crypto.randomBytes(32).toString('hex');

console.log('=== Generated Secrets (save these!) ===\n');
console.log('# Flutterwave Webhook Secret Hash');
console.log('# Configure in Flutterwave Dashboard > Settings > Webhooks > Secret Hash');
console.log(`FLUTTERWAVE_WEBHOOK_SECRET_HASH=${flutterwaveWebhookSecret}\n`);

console.log('# NOWPayments IPN Secret');
console.log('# Configure in NOWPayments Dashboard > Settings > IPN Secret');
console.log(`NOWPAYMENTS_IPN_SECRET=${nowpaymentsIpnSecret}\n`);

console.log('# Session Secret (for Express session signing)');
console.log(`SESSION_SECRET=${sessionSecret}\n`);

console.log('=== Add these to your Railway environment variables ===');