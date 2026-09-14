import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const barcode = req.query.barcode as string

  if (!barcode) {
    return res.status(400).json({ error: "barcode query parameter is required" })
  }

  try {
    const query = req.scope.resolve("query")

    // Query products with variants, filtering by barcode
    const { data: products } = await query.graph({
      entity: "product",
      fields: [
        "id",
        "title",
        "handle",
        "thumbnail",
        "status",
        "variants.*",
      ],
      filters: {
        variants: {
          barcode: barcode,
        },
      },
    })

    // Find the specific variant with matching barcode
    const results: any[] = []
    for (const product of products) {
      for (const variant of (product as any).variants || []) {
        if (variant.barcode === barcode) {
          results.push({
            product_id: (product as any).id,
            product_title: (product as any).title,
            product_handle: (product as any).handle,
            product_thumbnail: (product as any).thumbnail,
            product_status: (product as any).status,
            variant_id: variant.id,
            variant_title: variant.title,
            variant_sku: variant.sku,
            variant_barcode: variant.barcode,
            variant_prices: variant.prices,
          })
        }
      }
    }

    return res.json({ results, count: results.length })
  } catch (error: any) {
    console.error("Barcode search error:", error)
    return res.status(500).json({ error: error.message || "Failed to search barcodes" })
  }
}
