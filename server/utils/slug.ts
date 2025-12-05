export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .trim();
}

export function generatePropertySlug(condoName: string, unitNumber: string): string {
  const condoSlug = generateSlug(condoName);
  const unitSlug = generateSlug(unitNumber);
  return `${condoSlug}-${unitSlug}`;
}

export function generateShortId(uuid: string): string {
  return uuid.replace(/-/g, '').substring(0, 8);
}

export function generatePropertyTypeSlug(propertyType: string): string {
  const typeMapping: Record<string, string> = {
    'Departamento': 'departamento',
    'departamento': 'departamento',
    'Casa': 'casa',
    'casa': 'casa',
    'Estudio': 'estudio',
    'estudio': 'estudio',
    'Studio': 'estudio',
    'Penthouse': 'penthouse',
    'penthouse': 'penthouse',
    'Loft': 'loft',
    'loft': 'loft',
    'Villa': 'villa',
    'villa': 'villa',
    'Terreno': 'terreno',
    'terreno': 'terreno',
    'Local': 'local',
    'local': 'local',
    'Local Comercial': 'local-comercial',
    'Oficina': 'oficina',
    'oficina': 'oficina',
    'Bodega': 'bodega',
    'bodega': 'bodega',
    'Edificio': 'edificio',
    'edificio': 'edificio',
  };
  return typeMapping[propertyType] || generateSlug(propertyType || 'propiedad');
}

export function generateOperationSlug(listingType: string, hasSalePrice: boolean): string {
  if (listingType === 'sale' || (listingType === 'both' && hasSalePrice)) {
    return 'venta';
  }
  return 'renta';
}

export interface SEOUrlParams {
  agencySlug: string;
  operation: 'renta' | 'venta';
  propertyTypeSlug: string;
  zoneSlug: string;
  unitSlug: string;
  shortId: string;
}

export function buildSEOFriendlyUrl(params: SEOUrlParams): string {
  const { agencySlug, operation, propertyTypeSlug, zoneSlug, unitSlug, shortId } = params;
  return `/${agencySlug}/${operation}/${propertyTypeSlug}/${zoneSlug}/${unitSlug}-${shortId}`;
}

export function buildShortUrl(shortId: string): string {
  return `/p/${shortId}`;
}

export function generateUnitSlugWithShortId(unitTitle: string, shortId: string): string {
  const baseSlug = generateSlug(unitTitle);
  return `${baseSlug}-${shortId}`;
}

export function parseSEOUrl(path: string): {
  agencySlug: string;
  operation: string;
  propertyTypeSlug: string;
  zoneSlug: string;
  unitSlugWithShortId: string;
  shortId: string;
} | null {
  const parts = path.split('/').filter(Boolean);
  if (parts.length !== 5) return null;
  
  const [agencySlug, operation, propertyTypeSlug, zoneSlug, unitSlugWithShortId] = parts;
  
  if (!['renta', 'venta'].includes(operation)) return null;
  
  const lastDashIndex = unitSlugWithShortId.lastIndexOf('-');
  if (lastDashIndex === -1) return null;
  
  const shortId = unitSlugWithShortId.substring(lastDashIndex + 1);
  if (shortId.length !== 8) return null;
  
  return {
    agencySlug,
    operation,
    propertyTypeSlug,
    zoneSlug,
    unitSlugWithShortId,
    shortId,
  };
}
