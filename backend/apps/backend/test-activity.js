async function verify() {
  console.log("1. Simulating Website Activity from Storefront")
  
  // We need to pass the cookie, but fetch doesn't maintain cookies automatically in node
  // We'll capture the set-cookie header.
  
  const pubKey = "pk_590c4cf136467921ded373e89ab6466e22e1196cd0aa934eed8413ffb719df01"
  const res1 = await fetch("http://localhost:9000/store/activity", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "x-publishable-api-key": pubKey
    },
    body: JSON.stringify({
      event_type: "PAGE_VIEW",
      page_path: "/test-page"
    })
  })
  
  const setCookie = res1.headers.get("set-cookie")
  const data1 = await res1.json()
  console.log("PAGE_VIEW response:", data1)
  console.log("Set-Cookie:", setCookie)
  
  let cookieHeader = "";
  if (setCookie) {
    const parts = setCookie.split(";")
    cookieHeader = parts[0]
  }

  // Simulate Add to Cart
  const res2 = await fetch("http://localhost:9000/store/activity", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "x-publishable-api-key": pubKey,
      "Cookie": cookieHeader 
    },
    body: JSON.stringify({
      event_type: "ADD_TO_CART",
      product_id: "prod_test123",
      metadata: { source: "test_script" }
    })
  })
  
  console.log("ADD_TO_CART response:", await res2.json())

  // To test Admin reading, we need an admin token
  console.log("\n2. Admin Authentication")
  const loginRes = await fetch("http://localhost:9000/auth/user/emailpass", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "demo@tirupati.com", password: "demo123" })
  })
  
  const { token } = await loginRes.json()
  console.log("Logged in:", !!token)
  
  console.log("\n3. Fetching a Customer")
  const custRes = await fetch("http://localhost:9000/admin/customers", {
    headers: { "Authorization": `Bearer ${token}` }
  })
  const { customers } = await custRes.json()
  
  if (customers && customers.length > 0) {
    const custId = customers[0].id
    console.log("Found Customer:", custId)
    
    console.log("\n4. Injecting Activity for Customer")
    // Force a DB insert using Medusa container (via another script, or we can just fetch the activity)
    console.log("Testing Admin GET Activity route...")
    const actRes = await fetch(`http://localhost:9000/admin/customers/${custId}/activity`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
    console.log("Admin Activity Status:", actRes.status)
    const actData = await actRes.json()
    console.log("Admin Activity Data:", actData)
  }
}
verify()
