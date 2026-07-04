import { Clinic } from '../types';

// Mirrors the server's AI_TRIAL_MS gate in server.ts (getClinicAiTrialAndTier).
// AI Yordamchi is a Premium-only feature with a one-time 10-day free trial per clinic.
const AI_TRIAL_DAYS = 10;

export interface AiAccessStatus {
  eligible: boolean;
  tier: 'basic' | 'premium';
  daysLeft: number;
}

export function getAiAccessStatus(clinic?: Clinic | null): AiAccessStatus {
  if (!clinic) return { eligible: false, tier: 'basic', daysLeft: 0 };
  const tier: 'basic' | 'premium' = clinic.subscriptionTier === 'premium' ? 'premium' : 'basic';
  if (tier === 'premium') return { eligible: true, tier, daysLeft: 0 };

  if (!clinic.aiTrialStartDate) {
    // Server stamps this on clinic creation and lazily on first AI access — until
    // that first request lands, assume the full trial window is still available.
    return { eligible: true, tier, daysLeft: AI_TRIAL_DAYS };
  }
  const elapsedDays = (Date.now() - new Date(clinic.aiTrialStartDate).getTime()) / (24 * 60 * 60 * 1000);
  const daysLeft = Math.max(0, Math.ceil(AI_TRIAL_DAYS - elapsedDays));
  return { eligible: daysLeft > 0, tier, daysLeft };
}
