import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { twoFactor } from 'better-auth/plugins';
import { prisma } from '../../database/prisma';
import { env } from '../../config/env';

/**
 * Better Auth instance (email/password). Handles sign-up, sign-in, sessions
 * and issues JWT-signed session tokens. Mounted at /api/auth via expressPlugin.
 */
export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  baseURL: env.BETTER_AUTH_URL,
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
    defaultCookieAttributes: {
      sameSite: 'lax',
      httpOnly: true,
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
