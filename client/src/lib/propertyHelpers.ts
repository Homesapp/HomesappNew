import type { Property } from "@shared/schema";

export function getPropertyTitle(property: Property | null | undefined): string {
  if (!property) {
    return "Propiedad";
  }

  if (property.condominiumName && property.unitNumber) {
    return `${property.condominiumName} - ${property.unitNumber}`;
  }

  return property.title || "Propiedad";
}
