export interface CommissionCalculationInput {
  monthlyRent: number;
  leaseDurationMonths: number;
  referralPercent?: number; // Porcentaje del referido (default 20 si hay referido)
  hasReferral: boolean; // Si la propiedad tiene referido
}

export interface CommissionCalculationResult {
  totalCommissionMonths: number;
  totalCommissionAmount: number;
  sellerCommissionPercent: number;
  referralCommissionPercent: number;
  homesappCommissionPercent: number;
  sellerCommissionAmount: number;
  referralCommissionAmount: number;
  homesappCommissionAmount: number;
}

export function calculateCommissionMonths(leaseDurationMonths: number): number {
  // Según términos del contrato de propietario:
  if (leaseDurationMonths >= 60) {
    // 5 años o más = 3 meses de renta
    return 3.0;
  } else if (leaseDurationMonths >= 48) {
    // 4 años = 2.5 meses de renta
    return 2.5;
  } else if (leaseDurationMonths >= 36) {
    // 3 años = 2 meses de renta
    return 2.0;
  } else if (leaseDurationMonths >= 24) {
    // 2 años = 1.5 meses de renta
    return 1.5;
  } else if (leaseDurationMonths >= 12) {
    // 1 año = 1 mes de renta
    return 1.0;
  } else if (leaseDurationMonths >= 6) {
    // 6 meses = 1/2 mes de renta
    return 0.5;
  } else {
    // Menos de 6 meses = modalidad vacacional (se maneja por separado con 15%)
    return 0;
  }
}

export function calculateRentalCommissions(input: CommissionCalculationInput): CommissionCalculationResult {
  const { monthlyRent, leaseDurationMonths, referralPercent = 20, hasReferral } = input;
  
  if (referralPercent < 0 || referralPercent > 100) {
    throw new Error("Referral percent must be between 0 and 100");
  }
  
  let totalCommissionAmount: number;
  let commissionMonths: number;
  
  // Modalidad vacacional: menos de 6 meses = 15% del total de la reserva
  if (leaseDurationMonths < 6) {
    const totalReservationAmount = monthlyRent * leaseDurationMonths;
    totalCommissionAmount = totalReservationAmount * 0.15;
    commissionMonths = 0.15 * leaseDurationMonths; // Para registro
  } else {
    commissionMonths = calculateCommissionMonths(leaseDurationMonths);
    totalCommissionAmount = monthlyRent * commissionMonths;
  }
  
  let sellerPercent: number;
  let referralPercentActual: number;
  let homesappPercent: number;
  
  if (hasReferral) {
    referralPercentActual = referralPercent;
    const sellerReduction = referralPercent / 2;
    const homesappReduction = referralPercent / 2;
    
    sellerPercent = 50 - sellerReduction;
    homesappPercent = 50 - homesappReduction;
  } else {
    sellerPercent = 50;
    referralPercentActual = 0;
    homesappPercent = 50;
  }
  
  const sellerAmount = (totalCommissionAmount * sellerPercent) / 100;
  const referralAmount = (totalCommissionAmount * referralPercentActual) / 100;
  const homesappAmount = (totalCommissionAmount * homesappPercent) / 100;
  
  return {
    totalCommissionMonths: commissionMonths,
    totalCommissionAmount: totalCommissionAmount,
    sellerCommissionPercent: sellerPercent,
    referralCommissionPercent: referralPercentActual,
    homesappCommissionPercent: homesappPercent,
    sellerCommissionAmount: sellerAmount,
    referralCommissionAmount: referralAmount,
    homesappCommissionAmount: homesappAmount,
  };
}

export type ExternalCommissionType = 'completa' | 'referido';

export function normalizeCommissionType(value: string | null | undefined): ExternalCommissionType {
  if (!value) return 'completa';
  const normalized = value.toLowerCase().trim();
  if (normalized.includes('referido') || normalized.includes('referid')) {
    return 'referido';
  }
  return 'completa';
}

export interface ExternalCommissionInput {
  monthlyRent: number;
  leaseDurationMonths: number;
  commissionType: string | null | undefined;
  referrerName?: string | null;
  referrerPhone?: string | null;
  referrerEmail?: string | null;
}

export interface ExternalCommissionResult {
  commissionMonths: number;
  totalCommissionAmount: number;
  agencyPercent: number;
  referrerPercent: number;
  agencyAmount: number;
  referrerAmount: number;
  commissionTypeNormalized: ExternalCommissionType;
  referrer?: {
    name: string | null;
    phone: string | null;
    email: string | null;
  };
}

export function calculateExternalCommission(input: ExternalCommissionInput): ExternalCommissionResult {
  const { monthlyRent, leaseDurationMonths, commissionType, referrerName, referrerPhone, referrerEmail } = input;
  
  const normalizedType = normalizeCommissionType(commissionType);
  
  let totalCommissionAmount: number;
  let commissionMonths: number;
  
  if (leaseDurationMonths < 6) {
    const totalReservationAmount = monthlyRent * leaseDurationMonths;
    totalCommissionAmount = totalReservationAmount * 0.15;
    commissionMonths = 0.15 * leaseDurationMonths;
  } else {
    commissionMonths = calculateCommissionMonths(leaseDurationMonths);
    totalCommissionAmount = monthlyRent * commissionMonths;
  }
  
  let agencyPercent: number;
  let referrerPercent: number;
  
  if (normalizedType === 'referido') {
    agencyPercent = 80;
    referrerPercent = 20;
  } else {
    agencyPercent = 100;
    referrerPercent = 0;
  }
  
  const agencyAmount = (totalCommissionAmount * agencyPercent) / 100;
  const referrerAmount = (totalCommissionAmount * referrerPercent) / 100;
  
  const result: ExternalCommissionResult = {
    commissionMonths,
    totalCommissionAmount,
    agencyPercent,
    referrerPercent,
    agencyAmount,
    referrerAmount,
    commissionTypeNormalized: normalizedType,
  };
  
  if (normalizedType === 'referido') {
    result.referrer = {
      name: referrerName ?? null,
      phone: referrerPhone ?? null,
      email: referrerEmail ?? null,
    };
  }
  
  return result;
}
