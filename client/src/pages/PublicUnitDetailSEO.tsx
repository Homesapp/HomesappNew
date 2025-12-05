import { useEffect, useState } from "react";
import { useRoute, useLocation, Redirect } from "wouter";
import { useQuery } from "@tanstack/react-query";
import PublicUnitDetail from "./PublicUnitDetail";
import { LoadingScreen } from "@/components/ui/loading-screen";

export default function PublicUnitDetailSEO() {
  const [, params] = useRoute("/:agencySlug/:operation/:propertyType/:zone/:unitSlugWithShortId");
  const { agencySlug, operation, propertyType, zone, unitSlugWithShortId } = params || {};
  
  const { data, isLoading, error } = useQuery<{ unitId: string }>({
    queryKey: ["/api/public/property/seo", agencySlug, operation, propertyType, zone, unitSlugWithShortId],
    queryFn: async () => {
      const response = await fetch(
        `/api/public/property/seo/${agencySlug}/${operation}/${propertyType}/${zone}/${unitSlugWithShortId}`
      );
      if (!response.ok) {
        throw new Error("Property not found");
      }
      return response.json();
    },
    enabled: !!(agencySlug && operation && propertyType && zone && unitSlugWithShortId),
    retry: false,
  });
  
  if (isLoading) {
    return <LoadingScreen className="h-screen" />;
  }
  
  if (error || !data?.unitId) {
    return <Redirect to="/buscar-propiedades" />;
  }
  
  return <PublicUnitDetail unitId={data.unitId} />;
}

export function PublicUnitDetailShort() {
  const [, params] = useRoute("/p/:shortId");
  const { shortId } = params || {};
  
  const { data, isLoading, error } = useQuery<{ unitId: string }>({
    queryKey: ["/api/public/property/short", shortId],
    queryFn: async () => {
      const response = await fetch(`/api/public/property/short/${shortId}`);
      if (!response.ok) {
        throw new Error("Property not found");
      }
      return response.json();
    },
    enabled: !!shortId,
    retry: false,
  });
  
  if (isLoading) {
    return <LoadingScreen className="h-screen" />;
  }
  
  if (error || !data?.unitId) {
    return <Redirect to="/buscar-propiedades" />;
  }
  
  return <PublicUnitDetail unitId={data.unitId} />;
}
