/**
 * Lead Management Library
 * 
 * Functions for registering and managing demo leads
 * 
 * @version 0.7.8.5
 */

export interface LeadData {
  leadId?: string;
  email: string;
  company: string;
  role?: string;
  useCase?: string;
  source?: string;
  registeredAt?: string;
}

const STORAGE_KEY = "leadData";

/**
 * Register a lead with the server API
 */
export async function registerLead(data: {
  email: string;
  companyName: string;
  role?: string;
  useCase?: string;
  source?: string;
}): Promise<{ leadId: string; email: string }> {
  // Use relative URL to go through demo app's API route
  // which proxies to the main API
  const response = await fetch("/api/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to register lead");
  }

  return response.json();
}

/**
 * Store lead data in localStorage
 */
export function storeLead(data: LeadData): void {
  if (typeof window === "undefined") return;
  
  const leadData: LeadData = {
    ...data,
    registeredAt: data.registeredAt || new Date().toISOString(),
  };
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(leadData));
  console.log("📝 Lead data stored");
}

/**
 * Get lead data from localStorage
 */
export function getLead(): LeadData | null {
  if (typeof window === "undefined") return null;
  
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    return JSON.parse(data) as LeadData;
  } catch (error) {
    console.error("Failed to load lead data:", error);
    return null;
  }
}

/**
 * Check if we have valid lead data
 */
export function hasValidLead(): boolean {
  const lead = getLead();
  return !!(lead?.email && lead?.company);
}

/**
 * Clear lead data from localStorage
 */
export function clearLead(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  console.log("🗑️ Lead data cleared");
}

/**
 * Update lead data
 */
export function updateLead(updates: Partial<LeadData>): void {
  const current = getLead();
  if (!current) return;
  
  storeLead({ ...current, ...updates });
}

/**
 * Get lead ID for API calls
 */
export function getLeadId(): string | undefined {
  return getLead()?.leadId;
}

/**
 * Get lead email for email delivery
 */
export function getLeadEmail(): string | undefined {
  return getLead()?.email;
}

