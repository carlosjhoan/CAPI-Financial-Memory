import type { Pocket } from '../types/pocket.types';

export interface PocketMood {
  image: string;
  status: string;
  message: string;
  glowColor: string;
  glowColorDark: string;
}

/**
 * Calcula el estado emocional de la CAPI basado en el ratio de ahorro del bolsillo.
 *
 * Reglas:
 * - Sin movimientos: CAPI_Dudoso (invitación a usar el bolsillo)
 * - Ratio >= 70%: CAPI_Feliz (Saludable)
 * - Ratio >= 60%: CAPI_Dudoso (Alerta)
 * - Ratio < 60%:  CAPI_Enojado (Crítico)
 *
 * CAPI_Furia.png NO se usa en bolsillos (reservado para módulo de deudas).
 */
export function getPocketMood(pocket: Pocket): PocketMood {
  const totalDeposited = (pocket.incomes || []).reduce((sum, inc) => sum + inc.amount, 0);
  const totalWithdrawn = pocket.expenses?.reduce((sum, e) => sum + e.amount, 0) || 0;
  const totalMovement = totalDeposited + totalWithdrawn;

  if (totalMovement === 0) {
    return {
      image: '/assets/CAPI_Dudoso.png',
      status: 'Sin movimientos',
      message: '¡Empieza a usar tu bolsillo!',
      glowColor: 'rgba(249,115,22,0.15)',
      glowColorDark: 'rgba(249,115,22,0.25)',
    };
  }

  const ratio = (totalDeposited / totalMovement) * 100;

  if (ratio >= 70) {
    return {
      image: '/assets/CAPI_Feliz.png',
      status: 'Saludable',
      message: '¡Tu Capi está muy feliz con tu ahorro!',
      glowColor: 'rgba(34,197,94,0.25)',
      glowColorDark: 'rgba(34,197,94,0.4)',
    };
  }
  if (ratio >= 60) {
    return {
      image: '/assets/CAPI_Dudoso.png',
      status: 'Alerta',
      message: 'Cuidado: tus gastos están creciendo.',
      glowColor: 'rgba(249,115,22,0.2)',
      glowColorDark: 'rgba(249,115,22,0.35)',
    };
  }
  return {
    image: '/assets/CAPI_Enojado.png',
    status: 'Crítico',
    message: '¡Tu Capi está enojado! Reduce los retiros.',
    glowColor: 'rgba(239,68,68,0.25)',
      glowColorDark: 'rgba(239,68,68,0.4)',
  };
}
