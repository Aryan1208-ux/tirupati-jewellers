import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000";

export function middleware(request: NextRequest) {
  // Only apply to /api/medusa/* routes
  if (request.nextUrl.pathname.startsWith('/api/medusa/')) {
    // Extract the token from the HttpOnly cookie
    const token = request.cookies.get('medusa_admin_token')?.value;

    // Get the target path after /api/medusa/
    const targetPath = request.nextUrl.pathname.replace('/api/medusa', '');
    
    // Construct the actual Medusa URL, preserving search params
    const searchParams = request.nextUrl.searchParams.toString();
    const destinationUrl = `${MEDUSA_BACKEND_URL}${targetPath}${searchParams ? `?${searchParams}` : ''}`;

    // Create the headers for the outgoing request
    const requestHeaders = new Headers(request.headers);
    if (token) {
      requestHeaders.set('Authorization', `Bearer ${token}`);
    }

    // Rewrite the request to the Medusa backend with the injected Authorization header
    return NextResponse.rewrite(new URL(destinationUrl), {
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: '/api/medusa/:path*',
};
