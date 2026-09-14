import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import crypto from "crypto"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body as any

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: "Missing required Razorpay parameters" })
  }

  const secret = process.env.RAZORPAY_KEY_SECRET || "dummysecret"

  const generated_signature = crypto
    .createHmac("sha256", secret)
    .update(razorpay_order_id + "|" + razorpay_payment_id)
    .digest("hex")

  if (generated_signature === razorpay_signature) {
    return res.status(200).json({ success: true, message: "Payment verified successfully" })
  } else {
    return res.status(400).json({ success: false, error: "Invalid signature" })
  }
}
