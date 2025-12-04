import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface PredictiveAnalysisResult {
  prediction: any;
  confidence: number;
  recommendedAction: string;
  factors: any;
}

export interface LegalDocumentResult {
  content: string;
  metadata: any;
}

export interface TenantScreeningResult {
  riskScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  aiAnalysis: any;
  fraudDetection: any;
  incomeVerification: any;
  creditAnalysis: any;
  rentalHistory: any;
  recommendations: string;
  flags: any[];
}

export class OpenAIService {
  // Generic chat method for flexible AI interactions
  async chat(messages: { role: "system" | "user" | "assistant"; content: string }[]): Promise<string> {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
    });
    
    return completion.choices[0].message.content || "";
  }

  // Predictive Analytics: Analyze property rental probability
  async analyzeRentalProbability(propertyData: any): Promise<PredictiveAnalysisResult> {
    const prompt = `Analyze this property's rental probability:
    
Property Details:
- Title: ${propertyData.title}
- Price: $${propertyData.rentPrice || propertyData.salePrice}
- Bedrooms: ${propertyData.bedrooms}
- Bathrooms: ${propertyData.bathrooms}
- Zone: ${propertyData.zone}
- Amenities: ${JSON.stringify(propertyData.amenities || [])}

Provide a JSON response with:
1. probability (0-100): Likelihood of being rented within 30 days
2. confidence (0-100): Confidence in this prediction
3. recommendedAction: What owner should do
4. factors: Key factors affecting rentability`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a real estate market analyst expert in Tulum, Quintana Roo." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(completion.choices[0].message.content || "{}");
    
    return {
      prediction: { probability: result.probability },
      confidence: result.confidence || 75,
      recommendedAction: result.recommendedAction || "Monitor market trends",
      factors: result.factors || {},
    };
  }

  // Predictive Analytics: Price recommendations
  async analyzePriceRecommendation(propertyData: any): Promise<PredictiveAnalysisResult> {
    const prompt = `Recommend optimal pricing for this property:
    
Property Details:
- Current Price: $${propertyData.rentPrice || propertyData.salePrice}
- Bedrooms: ${propertyData.bedrooms}
- Bathrooms: ${propertyData.bathrooms}
- Zone: ${propertyData.zone}
- Status: ${propertyData.status}

Provide a JSON response with:
1. recommendedPrice: Optimal price
2. priceRange: { min, max }
3. confidence (0-100): Confidence in this recommendation
4. recommendedAction: Pricing strategy
5. factors: Market factors considered`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a real estate pricing expert specializing in Tulum vacation rentals." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(completion.choices[0].message.content || "{}");
    
    return {
      prediction: { 
        recommendedPrice: result.recommendedPrice,
        priceRange: result.priceRange 
      },
      confidence: result.confidence || 80,
      recommendedAction: result.recommendedAction || "Adjust pricing based on market",
      factors: result.factors || {},
    };
  }

  // Legal Document Generation
  async generateRentalContract(parties: any, propertyData: any): Promise<LegalDocumentResult> {
    const prompt = `Generate a professional rental contract for a property in Tulum, Mexico:

Parties:
- Owner: ${parties.owner.name}
- Tenant: ${parties.tenant.name}

Property:
- Address: ${propertyData.address}
- Monthly Rent: $${propertyData.monthlyRent}
- Deposit: $${propertyData.deposit}
- Start Date: ${parties.startDate}
- Duration: ${parties.duration} months

Generate a complete, legally-sound rental contract in Spanish for Mexican law, including:
1. Identification of parties
2. Property description
3. Rental terms and payment
4. Deposit and guarantees
5. Maintenance responsibilities
6. Termination clauses
7. Signatures section

Also provide metadata with key terms extracted.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a Mexican real estate lawyer specializing in rental contracts." },
        { role: "user", content: prompt },
      ],
    });

    const content = completion.choices[0].message.content || "";
    
    // Extract key terms
    const metadata = {
      monthlyRent: propertyData.monthlyRent,
      deposit: propertyData.deposit,
      duration: parties.duration,
      startDate: parties.startDate,
      parties: [parties.owner.name, parties.tenant.name],
    };

    return { content, metadata };
  }

  async generateLeaseRenewal(existingContract: any): Promise<LegalDocumentResult> {
    const prompt = `Generate a lease renewal document based on this existing contract:

Original Contract Terms:
${existingContract.content.substring(0, 500)}...

New Terms:
- New Rent: $${existingContract.newRent}
- New Duration: ${existingContract.newDuration} months
- Start Date: ${existingContract.newStartDate}

Generate a lease renewal document in Spanish following Mexican rental law.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a Mexican real estate lawyer." },
        { role: "user", content: prompt },
      ],
    });

    const content = completion.choices[0].message.content || "";
    
    const metadata = {
      newRent: existingContract.newRent,
      newDuration: existingContract.newDuration,
      renewalDate: new Date().toISOString(),
    };

    return { content, metadata };
  }

  // Tenant Screening
  async screenTenant(applicationData: any): Promise<TenantScreeningResult> {
    const prompt = `Analyze this rental application for potential risks:

Applicant Information:
- Name: ${applicationData.applicantName}
- Employment: ${applicationData.employment}
- Previous Addresses: ${JSON.stringify(applicationData.previousAddresses || [])}
- References: ${JSON.stringify(applicationData.references || [])}

Documents Provided:
${JSON.stringify(applicationData.documents || [])}

Provide a JSON response with:
1. riskScore (0-100): Overall risk score (0=highest risk, 100=lowest risk)
2. riskLevel: "low", "medium", "high", or "critical"
3. aiAnalysis: Detailed analysis
4. fraudDetection: Any fraud indicators found
5. rentalHistory: Rental history analysis
6. recommendations: Action recommendations
7. flags: Array of red flags found`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an expert tenant screening specialist with expertise in fraud detection and risk assessment." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(completion.choices[0].message.content || "{}");
    
    return {
      riskScore: result.riskScore || 50,
      riskLevel: result.riskLevel || "medium",
      aiAnalysis: result.aiAnalysis || {},
      fraudDetection: result.fraudDetection || {},
      incomeVerification: {},
      creditAnalysis: {},
      rentalHistory: result.rentalHistory || {},
      recommendations: result.recommendations || "Conduct additional verification",
      flags: result.flags || [],
    };
  }
}

export const openAIService = new OpenAIService();
