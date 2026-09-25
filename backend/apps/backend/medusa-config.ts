import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  projectConfig: {
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
    }
  },
  modules: [
    {
      resolve: "./src/modules/rbac",
    },
    {
      resolve: "./src/modules/billing",
    },
    {
      resolve: "./src/modules/metal-rates",
    },
    {
      resolve: "./src/modules/analytics",
    },
    {
      resolve: "@medusajs/payment",
      options: {
        providers: [
          {
            resolve: "./src/modules/payment-razorpay",
            id: "razorpay",
            options: {
              key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_dummykey",
              key_secret: process.env.RAZORPAY_KEY_SECRET || "dummysecret",
            }
          },
          {
            resolve: "./src/modules/payment-cod",
            id: "cod",
          }
        ]
      }
    }
  ]
})
