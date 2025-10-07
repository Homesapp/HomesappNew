import { RequestHandler } from "express";
import { storage } from "../storage";

/**
 * Middleware to verify resource ownership before allowing modifications
 * Admin and Master roles can access all resources
 */
export const requireResourceOwnership = (
  resourceType: 'appointment' | 'offer' | 'property' | 'rental-contract',
  ownerField: 'clientId' | 'ownerId' | 'sellerId' | 'tenantId' = 'ownerId'
): RequestHandler => {
  return async (req: any, res: any, next: any) => {
    try {
      const resourceId = req.params.id;
      const userId = req.user?.claims?.sub;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Get current user to check role
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Admin and Master can access all resources
      if (["admin", "master"].includes(user.role)) {
        return next();
      }

      // Get the resource
      let resource: any;
      switch (resourceType) {
        case 'appointment':
          resource = await storage.getAppointment(resourceId);
          break;
        case 'offer':
          resource = await storage.getOffer(resourceId);
          break;
        case 'property':
          resource = await storage.getProperty(resourceId);
          break;
        case 'rental-contract':
          resource = await storage.getRentalContract(resourceId);
          break;
        default:
          return res.status(400).json({ message: "Invalid resource type" });
      }

      if (!resource) {
        return res.status(404).json({ message: `${resourceType} not found` });
      }

      // Check ownership based on resource type and field
      const resourceOwnerId = resource[ownerField];
      
      // For appointments, check clientId, assignedToId, and property owner
      if (resourceType === 'appointment') {
        const isClient = resource.clientId === userId;
        const isAssigned = resource.assignedToId === userId;
        
        // Get property to check if user is the owner
        const property = await storage.getProperty(resource.propertyId);
        const isPropertyOwner = property?.ownerId === userId;
        
        if (!isClient && !isAssigned && !isPropertyOwner) {
          return res.status(403).json({ 
            message: "Forbidden: You don't have permission to modify this appointment" 
          });
        }
      } 
      // For offers, check both clientId and property owner
      else if (resourceType === 'offer') {
        const isClient = resource.clientId === userId;
        
        // Get property to check if user is the owner
        const property = await storage.getProperty(resource.propertyId);
        const isPropertyOwner = property?.ownerId === userId;
        
        if (!isClient && !isPropertyOwner) {
          return res.status(403).json({ 
            message: "Forbidden: You don't have permission to modify this offer" 
          });
        }
      }
      // For other resources, simple ownership check
      else {
        if (resourceOwnerId !== userId) {
          return res.status(403).json({ 
            message: `Forbidden: You don't have permission to modify this ${resourceType}` 
          });
        }
      }

      next();
    } catch (error) {
      console.error(`Error checking ${resourceType} ownership:`, error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
};
