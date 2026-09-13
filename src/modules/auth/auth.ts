import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { twoFactor } from 'better-auth/plugins';
import { prisma } from '../../database/prisma';
import { env } from '../../config/env';

/**
 * Better Auth instance (email/password). Handles sign-up, sign-in, sessions
 * and issues JWT-signed session tokens. Mounted at /api/auth via expressPlugin.
 */
const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL ?? null;
const vercelOrigin = vercelHost ? `https://${vercelHost}` : null;
// ponytail: dev works (localhost default) but prod 500s when BETTER_AUTH_URL is unset — fall back to Vercel URL.
const baseURL = !env.BETTER_AUTH_URL.includes('localhost') ? env.BETTER_AUTH_URL : (vercelOrigin ?? env.BETTER_AUTH_URL);

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  baseURL,
  trustedOrigins: [baseURL, ...(vercelOrigin && vercelOrigin !== baseURL ? [vercelOrigin] : [])],
  secret: env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // refresh once a day
  },
  advanced: {
    cookiePrefix: 'linkpilot',
    useSecureCookies: process.env.NODE_ENV === 'production',
    defaultCookieAttributes: {
      sameSite: 'lax',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    },
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 20,
  },
  plugins: [
    twoFactor({
      issuer: 'LinkPilot',
      totpOptions: {
        period: 30,
        digits: 6,
      },
    }),
  ],
});
