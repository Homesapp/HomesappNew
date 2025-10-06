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
  if (leaseDurationMonths >= 1 && leaseDurationMonths <= 6) {
    return 1.0;
  } else if (leaseDurationMonths >= 7 && leaseDurationMonths <= 11) {
    return 1.2;
  } else if (leaseDurationMonths >= 12) {
    return 1.5;
  }
  return 1.0;
}

export function calculateRentalCommissions(input: CommissionCalculationInput): CommissionCalculationResult {
  const { monthlyRent, leaseDurationMonths, referralPercent = 20, hasReferral } = input;
  
  if (referralPercent < 0 || referralPercent > 100) {
    throw new Error("Referral percent must be between 0 and 100");
  }
  
  const commissionMonths = calculateCommissionMonths(leaseDurationMonths);
  const totalCommissionAmount = monthlyRent * commissionMonths;
  
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
