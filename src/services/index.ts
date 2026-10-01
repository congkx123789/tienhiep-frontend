/**
 * ═════════════════════════════════════════════════════════════════════════════
 *  BARREL EXPORT: src/services/index.ts (FRACTAL DOMAIN-DRIVEN)
 * ═════════════════════════════════════════════════════════════════════════════
 */

// 1. Cụm Core Client
export * from './core';
export { default } from './core/api';

// 2. Cụm Reader, Translation & TTS
export * from './reader';

// 3. Cụm Community & Sects
export * from './community';

// 4. Cụm User & Account
export * from './user';

// 5. Constants & Endpoints
export * from '../constants/endpoints';
