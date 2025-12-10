import { Injectable, Logger } from '@nestjs/common';

interface LoginAttempt {
    count: number;
    lastAttempt: number;
    lockedUntil?: number;
}

@Injectable()
export class RateLimitService {
    private readonly logger = new Logger(RateLimitService.name);
    private readonly attempts = new Map<string, LoginAttempt>();
    private readonly MAX_ATTEMPTS = 5;
    private readonly LOCK_DURATION = 5 * 60 * 1000; // 5分钟
    private readonly RESET_DURATION = 15 * 60 * 1000; // 15分钟后重置计数

    checkRateLimit(ip: string): { allowed: boolean; remainingTime?: number } {
        const now = Date.now();
        const attempt = this.attempts.get(ip);

        if (!attempt) {
            return { allowed: true };
        }

        // 检查是否在锁定期
        if (attempt.lockedUntil && now < attempt.lockedUntil) {
            const remainingTime = Math.ceil((attempt.lockedUntil - now) / 1000);
            this.logger.warn(`IP ${ip} 已被锁定,剩余时间: ${remainingTime}秒`);
            return { allowed: false, remainingTime };
        }

        // 如果超过重置时间,清除记录
        if (now - attempt.lastAttempt > this.RESET_DURATION) {
            this.attempts.delete(ip);
            return { allowed: true };
        }

        return { allowed: true };
    }

    recordFailedAttempt(ip: string): void {
        const now = Date.now();
        const attempt = this.attempts.get(ip);

        if (!attempt) {
            this.attempts.set(ip, {
                count: 1,
                lastAttempt: now,
            });
            this.logger.warn(`IP ${ip} 登录失败 (1/${this.MAX_ATTEMPTS})`);
            return;
        }

        attempt.count += 1;
        attempt.lastAttempt = now;

        if (attempt.count >= this.MAX_ATTEMPTS) {
            attempt.lockedUntil = now + this.LOCK_DURATION;
            this.logger.error(
                `IP ${ip} 登录失败次数过多,已锁定 ${this.LOCK_DURATION / 1000} 秒`,
            );
        } else {
            this.logger.warn(
                `IP ${ip} 登录失败 (${attempt.count}/${this.MAX_ATTEMPTS})`,
            );
        }
    }

    resetAttempts(ip: string): void {
        this.attempts.delete(ip);
        this.logger.log(`IP ${ip} 登录成功,重置失败计数`);
    }

    // 定期清理过期记录
    cleanup(): void {
        const now = Date.now();
        for (const [ip, attempt] of this.attempts.entries()) {
            if (now - attempt.lastAttempt > this.RESET_DURATION) {
                this.attempts.delete(ip);
            }
        }
    }
}
