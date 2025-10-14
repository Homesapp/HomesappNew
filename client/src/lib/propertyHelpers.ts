import type { Property } from "@shared/schema";

export function getPropertyTitle(property: Property | null | undefined): string {
  if (!property) {
    return "Propiedad";
  }

  if (property.condoName && property.unitNumber) {
    return `${property.condoName} - ${property.unitNumber}`;
  }

  return property.title || "Propiedad";
}
