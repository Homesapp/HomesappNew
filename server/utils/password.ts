import crypto from "crypto";

/**
 * Generates a secure random temporary password
 * Format: 4 words of 4 characters each, separated by hyphens
 * Example: "Xk7m-Pq2w-Ry5t-Bn8v"
 */
export function generateTemporaryPassword(): string {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const segments = 4;
  const segmentLength = 4;
  
  const password = [];
  for (let i = 0; i < segments; i++) {
    let segment = "";
    for (let j = 0; j < segmentLength; j++) {
      const randomIndex = crypto.randomInt(0, characters.length);
      segment += characters[randomIndex];
    }
    password.push(segment);
  }
  
  return password.join("-");
}

/**
 * Validates password strength
 * Requirements:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 */
export function validatePasswordStrength(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: "Password must be at least 8 characters long" };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one uppercase letter" };
  }
  
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one lowercase letter" };
  }
  
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: "Password must contain at least one number" };
  }
  
  return { valid: true };
}
