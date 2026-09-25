import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Email and password are required" }, { status: 400 });
    }

    // 1. Authenticate with Medusa
    const loginRes = await fetch(`${MEDUSA_BACKEND_URL}/auth/user/emailpass`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), password }),
    });

    if (!loginRes.ok) {
      const errData = await loginRes.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, error: errData.message || "Invalid email or password" },
        { status: loginRes.status }
      );
    }

    const data = await loginRes.json();
    if (!data.token) {
      return NextResponse.json({ success: false, error: "Authentication token was not returned" }, { status: 500 });
    }

    const token = data.token;

    // 2. Fetch User RBAC Access
    let role = null;
    let permissions = [];
    try {
      const accessRes = await fetch(`${MEDUSA_BACKEND_URL}/admin/my-access`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (accessRes.ok) {
        const accessData = await accessRes.json();
        role = accessData.role;
        permissions = accessData.permissions;
      }
    } catch (accessErr) {
      console.error("Failed to fetch RBAC access during login", accessErr);
    }

    // 3. Set HttpOnly Cookie
    const cookieStore = await cookies();
    cookieStore.set({
      name: 'medusa_admin_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    // 4. Return user info (but NOT the token)
    return NextResponse.json({
      success: true,
      user: {
        email: email.trim(),
        role,
        permissions
      }
    });

  } catch (err: any) {
    console.error("Login API Error:", err);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
