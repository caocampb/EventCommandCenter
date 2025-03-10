import { NextResponse } from "next/server";
import { headers } from "next/headers";

export async function POST(request: Request) {
  try {
    // Parse the error data from the request
    const errorData = await request.json();
    
    // Get request headers for additional context
    const headersList = headers();
    const userAgent = headersList.get('user-agent') || 'Unknown';
    const referer = headersList.get('referer') || 'None';
    const xForwardedFor = headersList.get('x-forwarded-for') || 'None';
    
    // Add timestamp and request info
    const enhancedErrorData = {
      timestamp: new Date().toISOString(),
      ...errorData,
      requestInfo: {
        userAgent,
        referer,
        clientIp: xForwardedFor
      },
      environment: process.env.NODE_ENV || 'unknown'
    };
    
    // Log the error to the server logs (visible in Vercel logs)
    console.error("CLIENT ERROR:", JSON.stringify(enhancedErrorData, null, 2));
    
    // Return a success response
    return NextResponse.json({ 
      received: true,
      timestamp: enhancedErrorData.timestamp
    });
  } catch (error) {
    console.error("Error in error-catcher endpoint:", error);
    return NextResponse.json({
      received: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: "This endpoint accepts POST requests with error data from client components"
  });
} 