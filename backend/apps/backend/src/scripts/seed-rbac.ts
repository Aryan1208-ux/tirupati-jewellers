import { ExecArgs } from "@medusajs/framework/types"
import { seedRbacWorkflow } from "../workflows/seed-rbac"

export default async function seedRbac({ container }: ExecArgs) {
  console.log("Starting RBAC seeding...")
  try {
    const { result } = await seedRbacWorkflow(container).run({
      input: {}
    })
    console.log("RBAC seeding complete!", result)
  } catch (err) {
    console.error("RBAC seeding failed:", err)
    process.exit(1)
  }
}
