import { describe, it, expect, vi } from 'vitest';

describe('PR-to-Payout Contract Governance Simulation', () => {
    it('should correctly handle bounty cancellation (Sponsor only)', async () => {
        const bounty = {
            id: '1',
            status: 'funded',
            sponsor: '0xSponsor',
            latest_submission_id: '0'
        };

        const cancelBounty = (caller: string) => {
            if (caller !== bounty.sponsor) throw new Error('Only sponsor can cancel');
            if (bounty.latest_submission_id !== '0') throw new Error('Active submissions');
            bounty.status = 'cancelled';
        };

        // Try unauthorized cancel
        expect(() => cancelBounty('0xHacker')).toThrow('Only sponsor can cancel');
        
        // Try authorized cancel
        cancelBounty('0xSponsor');
        expect(bounty.status).toBe('cancelled');
    });

    it('should correctly handle refunds after rejection', async () => {
        const bounty = {
            id: '1',
            status: 'rejected',
            sponsor: '0xSponsor'
        };

        const requestRefund = (caller: string) => {
            if (caller !== bounty.sponsor) throw new Error('Only sponsor can refund');
            if (bounty.status !== 'rejected') throw new Error('Not eligible');
            bounty.status = 'refunded';
            return true;
        };

        const success = requestRefund('0xSponsor');
        expect(success).toBe(true);
        expect(bounty.status).toBe('refunded');
    });

    it('should allow building to appeal a rejection', async () => {
        const submission = {
            id: '1',
            builder: '0xBuilder',
            appeal_used: false,
            verdict: 'rejected'
        };

        const appeal = (caller: string) => {
            if (caller !== submission.builder) throw new Error('Only builder can appeal');
            if (submission.appeal_used) throw new Error('Already used');
            submission.appeal_used = true;
            // logic would then trigger _run_evaluation again
        };

        appeal('0xBuilder');
        expect(submission.appeal_used).toBe(true);
        expect(() => appeal('0xBuilder')).toThrow('Already used');
    });
});
