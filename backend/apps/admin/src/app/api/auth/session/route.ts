import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('medusa_admin_token')?.value;

  if (!token) {
    return NextResponse.json({ authenticated: false });
  }

  // To check if the token is valid, you would ideally verify it here
  // or proxy a request to Medusa.
  // For a simple session check, presence of the cookie is a start,
  // but it's safer to verify it with Medusa.
  
  const MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000";
  
  try {
    const res = await fetch(`${MEDUSA_BACKEND_URL}/admin/my-access`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.ok) {
      return NextResponse.json({ authenticated: true });
    }
  } catch (err) {
    // network error
  }

  // If token is invalid or request failed with 401
  return NextResponse.json({ authenticated: false });
}
