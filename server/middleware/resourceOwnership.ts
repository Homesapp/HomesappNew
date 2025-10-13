import { RequestHandler } from "express";
import { storage } from "../storage";

/**
 * Middleware to verify resource ownership before allowing modifications
 * Admin and Master roles can access all resources
 */
export const requireResourceOwnership = (
  resourceType: 'appointment' | 'offer' | 'property' | 'rental-contract' | 'rental-application' | 'service-provider' | 'service' | 'service-booking' | 'presentation-card' | 'notification' | 'budget' | 'task' | 'conversation' | 'property-draft' | 'favorite' | 'blocked-slot' | 'property-recommendation' | 'auto-suggestion' | 'checklist-item' | 'alert',
  ownerField: 'clientId' | 'ownerId' | 'sellerId' | 'tenantId' | 'applicantId' | 'userId' | 'providerId' | 'staffId' | 'assignedToId' | 'conciergeId' = 'ownerId'
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

      // Admin, Admin Jr, and Master can access all resources
      if (["admin", "admin_jr", "master"].includes(user.role)) {
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
        case 'rental-application':
          resource = await storage.getRentalApplication(resourceId);
          break;
        case 'service-provider':
          resource = await storage.getServiceProvider(resourceId);
          break;
        case 'service':
          resource = await storage.getService(resourceId);
          break;
        case 'service-booking':
          resource = await storage.getServiceBooking(resourceId);
          break;
        case 'presentation-card':
          resource = await storage.getPresentationCard(resourceId);
          break;
        case 'notification':
          resource = await storage.getNotification(resourceId);
          break;
        case 'budget':
          resource = await storage.getBudget(resourceId);
          break;
        case 'task':
          resource = await storage.getTask(resourceId);
          break;
        case 'conversation':
          resource = await storage.getChatConversation(resourceId);
          break;
        case 'property-draft':
          resource = await storage.getPropertySubmissionDraft(resourceId);
          break;
        case 'favorite':
          resource = await storage.getFavorite(resourceId);
          break;
        case 'blocked-slot':
          resource = await storage.getConciergeBlockedSlot(resourceId);
          break;
        case 'property-recommendation':
          resource = await storage.getPropertyRecommendation(resourceId);
          break;
        case 'auto-suggestion':
          resource = await storage.getAutoSuggestion(resourceId);
          break;
        case 'checklist-item':
          resource = await storage.getContractChecklistItem(resourceId);
          break;
        case 'alert':
          resource = await storage.getSystemAlert(resourceId);
          break;
        default:
          return res.status(400).json({ message: "Invalid resource type" });
      }

      if (!resource) {
        return res.status(404).json({ message: `${resourceType} not found` });
      }

      // Check ownership based on resource type and field
      const resourceOwnerId = resource[ownerField];
      
      // For appointments, check clientId, assignedToId, property owner, and lead owner (for sellers)
      if (resourceType === 'appointment') {
        const isClient = resource.clientId === userId;
        const isAssigned = resource.assignedToId === userId;
        
        // Get property to check if user is the owner (only if propertyId exists)
        let isPropertyOwner = false;
        if (resource.propertyId) {
          const property = await storage.getProperty(resource.propertyId);
          isPropertyOwner = property?.ownerId === userId;
        }
        
        // Check if user is a seller who owns the lead associated with this appointment
        let isLeadOwner = false;
        if (resource.leadId && (user.role === "seller" || user.role === "management")) {
          const lead = await storage.getLead(resource.leadId);
          isLeadOwner = lead?.registeredById === userId;
        }
        
        if (!isClient && !isAssigned && !isPropertyOwner && !isLeadOwner) {
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
      // For rental contracts, check ownerId, tenantId, and sellerId
      else if (resourceType === 'rental-contract') {
        const isOwner = resource.ownerId === userId;
        const isTenant = resource.tenantId === userId;
        const isSeller = resource.sellerId === userId;
        
        if (!isOwner && !isTenant && !isSeller) {
          return res.status(403).json({ 
            message: "Forbidden: You don't have permission to modify this rental contract" 
          });
        }
      }
      // For rental applications, check applicantId and property owner
      else if (resourceType === 'rental-application') {
        const isApplicant = resource.applicantId === userId;
        
        // Get property to check if user is the owner
        const property = await storage.getProperty(resource.propertyId);
        const isPropertyOwner = property?.ownerId === userId;
        
        if (!isApplicant && !isPropertyOwner) {
          return res.status(403).json({ 
            message: "Forbidden: You don't have permission to modify this rental application" 
          });
        }
      }
      // For services, check providerId
      else if (resourceType === 'service') {
        // Get the service provider to check ownership
        const service = resource;
        const provider = await storage.getServiceProvider(service.providerId);
        
        if (!provider) {
          return res.status(404).json({ message: "Service provider not found" });
        }
        
        const isProviderOwner = provider.userId === userId;
        
        if (!isProviderOwner) {
          return res.status(403).json({ 
            message: "Forbidden: You don't have permission to modify this service" 
          });
        }
      }
      // For service bookings, check both clientId and service provider
      else if (resourceType === 'service-booking') {
        const isClient = resource.clientId === userId;
        
        // Get service and then provider to check if user is the provider
        const service = await storage.getService(resource.serviceId);
        if (service) {
          const provider = await storage.getServiceProvider(service.providerId);
          const isProvider = provider?.userId === userId;
          
          if (!isClient && !isProvider) {
            return res.status(403).json({ 
              message: "Forbidden: You don't have permission to modify this service booking" 
            });
          }
        } else {
          // If service not found, only allow client
          if (!isClient) {
            return res.status(403).json({ 
              message: "Forbidden: You don't have permission to modify this service booking" 
            });
          }
        }
      }
      // For conversations, check if user is a participant
      else if (resourceType === 'conversation') {
        const participants = await storage.getChatParticipants(resourceId);
        const isParticipant = participants.some(p => p.userId === userId);
        
        if (!isParticipant) {
          return res.status(403).json({ 
            message: "Forbidden: You don't have permission to modify this conversation" 
          });
        }
      }
      // For checklist items, verify contract ownership
      else if (resourceType === 'checklist-item') {
        const item = resource;
        const contract = await storage.getRentalContract(item.contractId);
        
        if (!contract) {
          return res.status(404).json({ message: "Rental contract not found" });
        }
        
        // Check if user is a stakeholder in the contract
        const isOwner = contract.ownerId === userId;
        const isTenant = contract.tenantId === userId;
        const isSeller = contract.sellerId === userId;
        
        if (!isOwner && !isTenant && !isSeller) {
          return res.status(403).json({ 
            message: "Forbidden: You don't have permission to modify this checklist item" 
          });
        }
      }
      // For property recommendations, allow both client (recipient) and seller
      else if (resourceType === 'property-recommendation') {
        const isClient = resource.clientId === userId;
        const isSeller = resource.sellerId === userId;
        
        if (!isClient && !isSeller) {
          return res.status(403).json({ 
            message: "Forbidden: You don't have permission to modify this property recommendation" 
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
