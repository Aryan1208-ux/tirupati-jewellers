export interface IRNResponse {
  Success: "Y" | "N";
  AckNo: string | null;
  AckDt: string | null;
  Irn: string | null;
  SignedInvoice: string | null;
  SignedQRCode: string | null;
  Status: string | null;
  ErrorDetails: any | null;
  InfoDetails: any | null;
}

export interface IEInvoiceProvider {
  /**
   * Generates an IRN by submitting the invoice payload to the IRP.
   */
  generateIRN(payload: any, gstin: string): Promise<IRNResponse>;

  /**
   * Cancels an existing IRN.
   */
  cancelIRN(irn: string, cancelReason: string, cancelRemark: string, gstin: string): Promise<IRNResponse>;
}

/**
 * A mock provider for sandbox/development testing until the final IRP is selected.
 */
export class MockEInvoiceProvider implements IEInvoiceProvider {
  async generateIRN(payload: any, gstin: string): Promise<IRNResponse> {
    console.log("[Mock IRP] Generating IRN for payload:", JSON.stringify(payload, null, 2));

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    return {
      Success: "Y",
      AckNo: "123456789012345",
      AckDt: new Date().toISOString().replace("T", " ").substring(0, 19),
      Irn: "MOCKIRN" + Math.random().toString(36).substring(2, 15).toUpperCase() + Math.random().toString(36).substring(2, 15).toUpperCase(),
      SignedInvoice: "MOCK_SIGNED_INVOICE_DATA",
      SignedQRCode: "MOCK_SIGNED_QR_CODE_DATA_FOR_TESTING_PURPOSES",
      Status: "ACT",
      ErrorDetails: null,
      InfoDetails: null,
    };
  }

  async cancelIRN(irn: string, cancelReason: string, cancelRemark: string, gstin: string): Promise<IRNResponse> {
    console.log(`[Mock IRP] Cancelling IRN: ${irn} for reason: ${cancelReason}`);
    
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      Success: "Y",
      AckNo: null,
      AckDt: null,
      Irn: irn,
      SignedInvoice: null,
      SignedQRCode: null,
      Status: "CNL",
      ErrorDetails: null,
      InfoDetails: null,
    };
  }
}
