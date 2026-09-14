import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

function generateEAN13(): string {
  // Generate a valid EAN-13 barcode
  // Prefix 890 = India
  const prefix = "890"
  let digits = prefix
  for (let i = 0; i < 9; i++) {
    digits += Math.floor(Math.random() * 10).toString()
  }

  // Calculate check digit
  let sum = 0
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(digits[i])
    sum += i % 2 === 0 ? digit : digit * 3
  }
  const checkDigit = (10 - (sum % 10)) % 10
  return digits + checkDigit.toString()
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { variant_id, product_id } = req.body as any

  if (!variant_id || !product_id) {
    return res.status(400).json({ error: "variant_id and product_id are required" })
  }

  try {
    const productService = req.scope.resolve(Modules.PRODUCT)
    const query = req.scope.resolve("query")

    // Check existing barcode on this variant
    const { data: existingProducts } = await query.graph({
      entity: "product",
      fields: ["variants.*"],
      filters: { id: product_id },
    })

    const existingVariant = (existingProducts as any)?.[0]?.variants?.find(
      (v: any) => v.id === variant_id
    )

    if (existingVariant?.barcode) {
      return res.status(409).json({
        error: "This variant already has a barcode. Use regenerate if you want a new one.",
        existing_barcode: existingVariant.barcode,
      })
    }

    // Generate a unique barcode, check for duplicates
    let barcode = ""
    let attempts = 0
    const maxAttempts = 10

    while (attempts < maxAttempts) {
      barcode = generateEAN13()

      // Check if this barcode already exists on any variant
      const { data: dupeCheck } = await query.graph({
        entity: "product",
        fields: ["variants.barcode"],
        filters: {
          variants: { barcode },
        },
      })

      if (!dupeCheck || dupeCheck.length === 0) {
        break // Unique barcode found
      }
      attempts++
    }

    if (attempts >= maxAttempts) {
      return res.status(500).json({ error: "Could not generate a unique barcode. Try again." })
    }

    // Update the variant with the new barcode
    await (productService as any).updateProductVariants(variant_id, {
      barcode,
    })

    return res.json({
      success: true,
      barcode,
      variant_id,
      product_id,
    })
  } catch (error: any) {
    console.error("Barcode generation error:", error)
    return res.status(500).json({ error: error.message || "Failed to generate barcode" })
  }
}
