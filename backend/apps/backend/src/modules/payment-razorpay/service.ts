import {
  AbstractPaymentProvider,
  PaymentSessionStatus,
  PaymentActions,
  BigNumber,
} from "@medusajs/framework/utils"
import type {
  InitiatePaymentInput,
  InitiatePaymentOutput,
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  RefundPaymentInput,
  RefundPaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  ProviderWebhookPayload,
  WebhookActionResult,
} from "@medusajs/framework/types"
import Razorpay from "razorpay"

export interface RazorpayOptions {
  key_id: string
  key_secret: string
}

export default class RazorpayProviderService extends AbstractPaymentProvider<RazorpayOptions> {
  static identifier = "razorpay"
  protected razorpay_: InstanceType<typeof Razorpay>

  constructor(container: Record<string, unknown>, options: RazorpayOptions) {
    super(container, options)

    this.razorpay_ = new Razorpay({
      key_id: options.key_id,
      key_secret: options.key_secret,
    })
  }

  async initiatePayment(
    input: InitiatePaymentInput
  ): Promise<InitiatePaymentOutput> {
    const { amount, currency_code } = input

    try {
      // Amount in smallest unit (paise for INR)
      const order = await this.razorpay_.orders.create({
        amount: Math.round(Number(amount)),
        currency: currency_code.toUpperCase(),
        receipt: `rcpt_${Date.now()}`,
      })

      return {
        id: order.id,
        data: {
          id: order.id,
          amount: order.amount,
          currency: order.currency,
        },
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to initiate Razorpay payment"
      throw new Error(message)
    }
  }

  async authorizePayment(
    input: AuthorizePaymentInput
  ): Promise<AuthorizePaymentOutput> {
    // Razorpay payments are authorized by the client (verify API signature)
    // We assume if it reaches here and the status passed from verify is successful, it's authorized.
    return {
      data: input.data || {},
      status: PaymentSessionStatus.AUTHORIZED,
    }
  }

  async cancelPayment(
    input: CancelPaymentInput
  ): Promise<CancelPaymentOutput> {
    return {
      data: input.data || {},
    }
  }

  async capturePayment(
    input: CapturePaymentInput
  ): Promise<CapturePaymentOutput> {
    // Can optionally call razorpay API to capture if not auto-captured
    return {
      data: input.data || {},
    }
  }

  async deletePayment(
    input: DeletePaymentInput
  ): Promise<DeletePaymentOutput> {
    return {
      data: input.data || {},
    }
  }

  async getPaymentStatus(
    input: GetPaymentStatusInput
  ): Promise<GetPaymentStatusOutput> {
    const orderId = input.data?.id as string | undefined

    if (orderId) {
      try {
        const order = await this.razorpay_.orders.fetch(orderId)
        switch (order.status) {
          case "paid":
            return { status: PaymentSessionStatus.CAPTURED }
          case "attempted":
            return { status: PaymentSessionStatus.AUTHORIZED }
          case "created":
            return { status: PaymentSessionStatus.PENDING }
          default:
            return { status: PaymentSessionStatus.PENDING }
        }
      } catch {
        return { status: PaymentSessionStatus.AUTHORIZED }
      }
    }

    return { status: PaymentSessionStatus.AUTHORIZED }
  }

  async refundPayment(
    input: RefundPaymentInput
  ): Promise<RefundPaymentOutput> {
    // You could implement Razorpay refunds API here
    // e.g., await this.razorpay_.payments.refund(paymentId, { amount })
    return {
      data: input.data || {},
    }
  }

  async retrievePayment(
    input: RetrievePaymentInput
  ): Promise<RetrievePaymentOutput> {
    const orderId = input.data?.id as string | undefined

    if (orderId) {
      try {
        const order = await this.razorpay_.orders.fetch(orderId)
        return {
          data: order as unknown as Record<string, unknown>,
        }
      } catch {
        return {
          data: input.data || {},
        }
      }
    }

    return {
      data: input.data || {},
    }
  }

  async updatePayment(
    input: UpdatePaymentInput
  ): Promise<UpdatePaymentOutput> {
    // Re-initiate payment with new amount
    const result = await this.initiatePayment(input as InitiatePaymentInput)
    return {
      data: result.data,
    }
  }

  /**
   * Extract the Razorpay payment entity from the webhook payload.
   *
   * Razorpay webhook bodies have the shape:
   * { event: "payment.authorized", payload: { payment: { entity: { id, amount, notes, ... } } } }
   *
   * The Medusa framework parses the raw body into `data` as Record<string, unknown>.
   */
  private extractRazorpayPaymentEntity(
    webhookData: Record<string, unknown>
  ): Record<string, unknown> | undefined {
    const payload = webhookData.payload as Record<string, unknown> | undefined
    if (!payload) return undefined

    const paymentWrapper = payload.payment as Record<string, unknown> | undefined
    if (!paymentWrapper) return undefined

    return paymentWrapper.entity as Record<string, unknown> | undefined
  }

  async getWebhookActionAndData(
    data: ProviderWebhookPayload["payload"]
  ): Promise<WebhookActionResult> {
    const { data: webhookData } = data

    try {
      const event = webhookData.event as string | undefined
      const payment = this.extractRazorpayPaymentEntity(webhookData)
      const notes = payment?.notes as Record<string, unknown> | undefined
      const sessionId = (notes?.session_id as string) || ""
      const amount = new BigNumber(Number(payment?.amount) || 0)

      if (event === "payment.authorized") {
        return {
          action: PaymentActions.AUTHORIZED,
          data: {
            session_id: sessionId,
            amount,
          },
        }
      }

      if (event === "payment.captured") {
        return {
          action: PaymentActions.SUCCESSFUL,
          data: {
            session_id: sessionId,
            amount,
          },
        }
      }

      if (event === "payment.failed") {
        return {
          action: PaymentActions.FAILED,
          data: {
            session_id: sessionId,
            amount,
          },
        }
      }

      return {
        action: PaymentActions.NOT_SUPPORTED,
      }
    } catch {
      return {
        action: PaymentActions.NOT_SUPPORTED,
      }
    }
  }
}
