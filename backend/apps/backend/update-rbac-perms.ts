import { seedRbacWorkflow } from "./src/workflows/seed-rbac"
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export default async function myScript({ container }: { container: any }) {
  console.log("Starting RBAC seeding...")
  try {
    const { result } = await seedRbacWorkflow(container).run()
    console.log("RBAC seeding complete:", result)
  } catch (err) {
    console.error("RBAC seeding failed:", err)
  }
}
