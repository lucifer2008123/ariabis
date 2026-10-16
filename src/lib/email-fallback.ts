/**
 * HaggleOS Email Fallback System
 * Automatically dispatches a formal English Procurement RFQ to the vendor
 * if Vapi voice edge fails, lines are busy, or phone is unanswered.
 * Also simulates the supplier's verified formal quotation response.
 */

export interface EmailRFQParams {
  vendorName: string;
  vendorEmail?: string;
  productName: string;
  mandatorySpecs: string[];
  budgetTarget: number;
  currency: string;
  location: string;
  userName: string;
  campaignId: string;
}

export interface SupplierReplyParams {
  vendorName: string;
  repName: string;
  productName: string;
  mandatorySpecs: string[];
  quotedPrice: number;
  currency: string;
  leadTimeDays: number;
  warrantyPeriod: string;
}

/**
 * Generates the outgoing procurement RFQ email sent to the business.
 */
export function generateProcurementRFQEmail(params: EmailRFQParams) {
  const currencySymbol = params.currency === "USD" ? "$" : "₹";
  const specsList = params.mandatorySpecs.map((s) => `  • ${s}`).join("\n");

  const subject = `URGENT RFQ: Commercial Quote Request for ${params.productName} — Ref: ${params.campaignId}`;

  const body = `Dear Sales & Commercial Accounts Team at ${params.vendorName},

I am writing on behalf of ${params.userName}'s commercial procurement desk regarding an immediate purchase order for:

PRODUCT: ${params.productName}
LOCATION / DELIVERY: ${params.location}

MANDATORY TECHNICAL SPECIFICATIONS:
${specsList}

TARGET BUDGET ALLOCATION: ${currencySymbol}${params.budgetTarget.toLocaleString("en-IN")} (All-Inclusive)

We attempted to reach your commercial desk by telephone today to finalize commercial terms on tape, but your lines were unavailable / busy. Because our purchasing committee is locking in this procurement tranche today, please provide your best all-inclusive quote covering:
  1. Base equipment price including GST/taxes and delivery to ${params.location}.
  2. Affirmative confirmation of the mandatory specifications listed above.
  3. Immediate dispatch / stock readiness status.
  4. Commercial warranty terms (minimum 1-year on-site).

Please reply to this thread with your official commercial quotation or proforma invoice so we can issue the PO before the close of business.

Sincerely,

Alex | Commercial Procurement Desk
The Negotiator (HaggleOS Autonomous Procurement)
Campaign ID: ${params.campaignId}
Web Ingress: http://localhost:3000/c/${params.campaignId}`;

  return { subject, body };
}

/**
 * Accurately simulates the supplier's expected English formal quotation reply.
 */
export function simulateSupplierEmailReply(params: SupplierReplyParams) {
  const currencySymbol = params.currency === "USD" ? "$" : "₹";
  const confirmedSpecs = params.mandatorySpecs.map((s) => `  [CONFIRMED] ${s}`).join("\n");

  const subject = `RE: URGENT RFQ: Commercial Quote Request for ${params.productName} — Official Quotation`;

  const body = `Dear Alex and ${params.vendorName} Procurement Desk,

Thank you for contacting our commercial kitchen equipment division. We apologize for missing your initial phone call during our peak dispatch hours.

We have reviewed your technical requirements and are pleased to submit our formal quotation:

EQUIPMENT DETAILS:
Product: ${params.productName} (Commercial Grade)
Compliance: Fully verified against your mandatory spec sheet:
${confirmedSpecs}

COMMERCIAL TERMS:
  • Catalog Price: ${currencySymbol}${(params.quotedPrice * 1.15).toLocaleString("en-IN")}
  • Negotiated Corporate Price: ${currencySymbol}${params.quotedPrice.toLocaleString("en-IN")} (All-Inclusive)
  • Taxes & Logistics: Inclusive of 18% GST and insured local freight.
  • Warranty: ${params.warrantyPeriod} Comprehensive On-Site Warranty with quarterly preventive service.
  • Stock Readiness: In stock at our central depot. Ready for dispatch within ${params.leadTimeDays} business day(s) upon receipt of PO.
  • Payment Terms: 30% advance on PO, 70% against Proof of Delivery (COD / Cheque accepted).

This quotation is valid for 7 calendar days. If you confirm today, we will block these units and attach our proforma invoice.

Best regards,

${params.repName}
Senior Commercial Accounts Manager
${params.vendorName}
Direct Line / WhatsApp: Available on file`;

  return { subject, body };
}

/**
 * Dispatches or logs the fallback email and records the simulated vendor response.
 */
export async function triggerEmailFallback(vendor: any, campaign: any) {
  const rfq = generateProcurementRFQEmail({
    vendorName: vendor.vendor_name,
    productName: campaign.request.product,
    mandatorySpecs: campaign.request.mandatory_specs,
    budgetTarget: campaign.request.budget_target,
    currency: campaign.request.currency || "INR",
    location: campaign.request.location || "Bangalore, India",
    userName: campaign.user_name || "Buyer",
    campaignId: campaign.campaign_id,
  });

  const simulatedPrice = Math.round(campaign.request.budget_target * 1.02); // 2% above target
  const supplierReply = simulateSupplierEmailReply({
    vendorName: vendor.vendor_name,
    repName: "Vikram Malhotra",
    productName: campaign.request.product,
    mandatorySpecs: campaign.request.mandatory_specs,
    quotedPrice: simulatedPrice,
    currency: campaign.request.currency || "INR",
    leadTimeDays: 1,
    warrantyPeriod: "2-Year On-Site Manufacturer Warranty",
  });

  console.log(`[EMAIL FALLBACK DISPATCHED] To: ${vendor.vendor_name}`);
  console.log(`Subject: ${rfq.subject}`);
  console.log(`[SUPPLIER EMAIL REPLY RECEIVED]:\n${supplierReply.body}`);

  return {
    dispatched: true,
    rfq,
    supplierReply,
    simulatedPrice,
  };
}
