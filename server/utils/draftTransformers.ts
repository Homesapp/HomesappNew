/**
 * Utility functions to transform property submission draft data
 * into property records for admin approval workflow
 */

import type { PropertySubmissionDraft } from "@shared/schema";

type DraftServicesInfo = {
  basicServices?: {
    water?: {
      included: boolean;
      provider?: string;
      cost?: string;
    };
    electricity?: {
      included: boolean;
      provider?: string;
      cost?: string;
    };
    internet?: {
      included: boolean;
      provider?: string;
      cost?: string;
    };
  };
  additionalServices?: Array<{
    type: "pool_cleaning" | "garden" | "gas";
    provider?: string;
    cost?: string;
  }>;
  acceptedLeaseDurations?: string[];
};

type PropertyIncludedServices = {
  basicServices?: {
    water?: {
      included: boolean;
      provider?: string;
      cost?: string;
    };
    electricity?: {
      included: boolean;
      provider?: string;
      cost?: string;
    };
    internet?: {
      included: boolean;
      provider?: string;
      cost?: string;
    };
  };
  additionalServices?: Array<{
    type: "pool_cleaning" | "garden" | "gas";
    provider?: string;
    cost?: string;
  }>;
};

/**
 * Transform servicesInfo from draft format to includedServices for property
 */
export function transformServicesInfo(servicesInfo?: any): PropertyIncludedServices | null {
  if (!servicesInfo) return null;
  
  const draftServices = servicesInfo as DraftServicesInfo;
  const includedServices: PropertyIncludedServices = {};

  // Copy basic services
  if (draftServices.basicServices) {
    includedServices.basicServices = draftServices.basicServices;
  }

  // Copy additional services
  if (draftServices.additionalServices && draftServices.additionalServices.length > 0) {
    includedServices.additionalServices = draftServices.additionalServices;
  }

  // Return null if no services are configured
  return Object.keys(includedServices).length > 0 ? includedServices : null;
}

/**
 * Transform complete draft into property insert data
 */
export function draftToPropertyData(draft: PropertySubmissionDraft, adminId: string) {
  const basicInfo = draft.basicInfo as any || {};
  const locationInfo = draft.locationInfo as any || {};
  const details = draft.details as any || {};
  const media = draft.media as any || {};
  const commercialTerms = draft.commercialTerms as any || {};
  const servicesInfo = draft.servicesInfo as any || {};
  const ownerData = draft.ownerData as any || {};

  // Transform included services
  const includedServices = transformServicesInfo(servicesInfo);

  // Map operation type to status
  let status = "available";
  if (draft.isForRent && !draft.isForSale) {
    status = "rent";
  } else if (draft.isForSale && !draft.isForRent) {
    status = "sale";
  } else if (draft.isForRent && draft.isForSale) {
    status = "both";
  }

  // Build property data
  const propertyData = {
    title: basicInfo.title || "Sin título",
    description: basicInfo.description,
    customListingTitle: basicInfo.customListingTitle,
    propertyType: basicInfo.propertyType || "house",
    price: basicInfo.price || "0",
    salePrice: basicInfo.salePrice,
    currency: basicInfo.currency || "MXN",
    
    // Location
    location: locationInfo.location || "Tulum, Quintana Roo",
    colonyId: locationInfo.colonyId,
    colonyName: locationInfo.colonyName,
    condominiumId: locationInfo.condominiumId,
    condoName: locationInfo.condoName,
    unitType: locationInfo.unitType || "private",
    unitNumber: locationInfo.unitNumber,
    showCondoInListing: locationInfo.showCondoInListing !== false,
    showUnitNumberInListing: locationInfo.showUnitNumberInListing !== false,
    googleMapsUrl: locationInfo.googleMapsUrl,
    latitude: locationInfo.latitude,
    longitude: locationInfo.longitude,
    
    // Details
    bedrooms: details.bedrooms || 0,
    bathrooms: details.bathrooms || "0",
    area: details.area || "0",
    amenities: details.amenities || [],
    specifications: details.specifications,
    
    // Media
    primaryImages: media.primaryImages || [],
    secondaryImages: media.secondaryImages || [],
    coverImageIndex: media.coverImageIndex || 0,
    videos: media.videos || [],
    virtualTourUrl: media.virtualTourUrl,
    requestVirtualTour: media.requestVirtualTour || false,
    
    // Services and lease info
    includedServices: includedServices,
    acceptedLeaseDurations: servicesInfo.acceptedLeaseDurations || [],
    
    // Owner and status
    ownerId: draft.userId,
    managementId: adminId,
    status: status as any,
    approvalStatus: "approved" as const,
    active: true,
    published: true,
    
    // Commercial terms
    allowsSubleasing: commercialTerms.allowsSubleasing || false,
    
    // Owner private data
    ownerFirstName: ownerData.ownerFirstName,
    ownerLastName: ownerData.ownerLastName,
    ownerPhone: ownerData.ownerPhone,
    ownerEmail: ownerData.ownerEmail || null,
    
    // Referral data (if provided)
    referredByName: ownerData.hasReferral ? ownerData.referredByName : null,
    referredByLastName: ownerData.hasReferral ? ownerData.referredByLastName : null,
    referredByPhone: ownerData.hasReferral ? ownerData.referredByPhone : null,
    referredByEmail: ownerData.hasReferral ? (ownerData.referredByEmail || null) : null,
  };

  return propertyData;
}
