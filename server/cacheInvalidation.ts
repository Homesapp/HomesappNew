import { cache, CacheKeys } from './cache';

/**
 * Cache invalidation helpers for different resource types
 * Call these after successful CUD (Create, Update, Delete) operations
 */

export async function invalidateCondominiumCache(): Promise<void> {
  await cache.invalidate(CacheKeys.condominiumsApproved());
}

export async function invalidateColonyCache(): Promise<void> {
  await cache.invalidate(CacheKeys.coloniesApproved());
}

export async function invalidateAmenityCache(): Promise<void> {
  await cache.invalidate(CacheKeys.amenities());
}

export async function invalidatePropertyFeatureCache(): Promise<void> {
  await cache.invalidate(CacheKeys.propertyFeatures());
}

/**
 * Invalidate multiple cache keys at once
 */
export async function invalidateMultipleCaches(...cacheTypes: Array<'condominiums' | 'colonies' | 'amenities' | 'propertyFeatures'>): Promise<void> {
  const promises = [];
  
  for (const type of cacheTypes) {
    switch (type) {
      case 'condominiums':
        promises.push(invalidateCondominiumCache());
        break;
      case 'colonies':
        promises.push(invalidateColonyCache());
        break;
      case 'amenities':
        promises.push(invalidateAmenityCache());
        break;
      case 'propertyFeatures':
        promises.push(invalidatePropertyFeatureCache());
        break;
    }
  }
  
  await Promise.all(promises);
}
