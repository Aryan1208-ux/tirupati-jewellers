

async function run() {
  console.log("--- Testing /api/auth/login ---");
  const res = await fetch("http://localhost:3002/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@tirupatijewellers.in", password: "password123" }) // Dummy credentials if not seeded
  });
  
  console.log("Login Status:", res.status);
  
  const setCookie = res.headers.getSetCookie();
  console.log("Set-Cookie Header:", setCookie);
  
  const data = await res.json();
  console.log("Response Body:", data);
  
  if (!setCookie) return;
  
  // Extract token from cookie string (naive split for testing)
  const cookieHeader = setCookie[0].split(";")[0];
  
  console.log("\n--- Testing /api/medusa/admin/my-access ---");
  const accessRes = await fetch("http://localhost:3002/api/medusa/admin/my-access", {
    headers: {
      "Cookie": cookieHeader
    }
  });
  
  console.log("Proxy Access Status:", accessRes.status);
  const accessData = await accessRes.json();
  console.log("Proxy Response:", accessData);
}

run();
