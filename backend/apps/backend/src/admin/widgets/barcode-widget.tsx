import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text, Badge } from "@medusajs/ui"
import { DetailWidgetProps, AdminProduct } from "@medusajs/framework/types"

const BarcodeWidget = ({ data }: DetailWidgetProps<AdminProduct>) => {
  const variants = data.variants || []

  return (
    <Container className="p-6">
      <div className="mb-4">
        <Heading level="h2">Jewellery Identification — Barcodes</Heading>
        <Text className="text-ui-fg-subtle mt-1">
          Barcode assignments for each variant of this product.
        </Text>
      </div>

      {variants.length === 0 ? (
        <Text className="text-ui-fg-muted">No variants found.</Text>
      ) : (
        <div className="space-y-3">
          {variants.map((variant: any) => (
            <div
              key={variant.id}
              className="flex items-center justify-between p-3 border border-ui-border-base rounded-lg bg-ui-bg-subtle"
            >
              <div>
                <Text className="font-medium">{variant.title || "Default"}</Text>
                <Text className="text-ui-fg-subtle text-xs mt-0.5">
                  SKU: {variant.sku || "—"}
                </Text>
              </div>
              <div className="text-right">
                {variant.barcode ? (
                  <Badge color="green">{variant.barcode}</Badge>
                ) : (
                  <Badge color="grey">No barcode</Badge>
                )}
              </div>
            </div>
          ))}
          <Text className="text-ui-fg-muted text-xs mt-2">
            For full barcode management (generate, print, scan), use the{" "}
            <a
              href="http://localhost:3002/admin/barcodes"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ui-fg-interactive underline"
            >
              Tirupati Admin Portal → Barcodes
            </a>
          </Text>
        </div>
      )}
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default BarcodeWidget
