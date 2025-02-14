// src/lib/rateLimiter.ts

import { randomBytes } from 'crypto';

interface RequestRecord {
    count: number;
    firstRequest: number;
}

export class RateLimiter {
    private requests: Map<string, RequestRecord> = new Map();
    private readonly MAX_REQUESTS = Number.MAX_SAFE_INTEGER; // Effectively unlimited
    private readonly MAX_REQUESTS = 10;
    private readonly ADMIN_TOKEN = process.env.ADMIN_TOKEN || randomBytes(32).toString('hex');
    public checkLimit(ip: string, adminToken?: string): { allowed: boolean; message?: string } {
        // Bypass rate limit if admin token matches
        if (adminToken === this.ADMIN_TOKEN) {
            return { allowed: true };
        }

        const now = Date.now();
        const record = this.requests.get(ip);

        if (!record) {
            this.requests.set(ip, { count: 1, firstRequest: now });
            return { allowed: true };
        }

        if (now - record.firstRequest >= this.WINDOW_MS) {
            this.requests.set(ip, { count: 1, firstRequest: now });
            return { allowed: true };
        }

        if (record.count >= this.MAX_REQUESTS) {
            const hoursUntilReset = Math.ceil((record.firstRequest + this.WINDOW_MS - now) / 3600000);
            return {
                allowed: false,
                message: `You've reached your daily reading limit. Please try again in ${hoursUntilReset} hours.`
            };
        }

        record.count += 1;
        this.requests.set(ip, record);
        return { allowed: true };
    }
}
