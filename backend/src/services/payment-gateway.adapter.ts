export type ChargeRequest = {
  userId: string;
  amount: number;
  dueDate: Date;
  description: string;
  metadata?: Record<string, unknown>;
};

export type ChargeResponse = {
  invoiceId: string;
  pixCopyPaste?: string;
  boletoUrl?: string;
  qrCodeUrl?: string;
};

export interface PaymentGatewayAdapter {
  createCharge(input: ChargeRequest): Promise<ChargeResponse>;
  cancelCharge(invoiceId: string): Promise<void>;
  getStatus(invoiceId: string): Promise<'pending' | 'paid' | 'failed' | 'cancelled' | 'expired'>;
}

export class MercadoPagoAdapter implements PaymentGatewayAdapter {
  async createCharge(_input: ChargeRequest): Promise<ChargeResponse> {
    // TODO: implement real API calls; placeholder for now
    return { invoiceId: `INV-${Date.now()}` };
  }
  async cancelCharge(_invoiceId: string): Promise<void> {}
  async getStatus(_invoiceId: string) {
    return 'pending' as const;
  }
}





