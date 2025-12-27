export interface AppConfig {
  cleaningStartOffsetMinutes: number;
  cleaningDurationMinutes: number;
  cleaningVerificationFrequencyMinutes: number;
  cleaningLookAheadMinutes: number;
  lastCleaningVerificationAt: string | null;
}