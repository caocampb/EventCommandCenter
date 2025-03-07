import { NextResponse } from 'next/server';

/**
 * API endpoint to proxy Google Places photos
 * This proxies the request to Google's Place Photos API to:
 * 1. Hide the API key from the client
 * 2. Bypass CORS issues
 * 3. Support both legacy and v1 API formats
 */
// Ensure this route is always handled at runtime, not during build
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Get the parameters from the URL
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');
    
    // Handle both legacy and v1 formats
    if (!reference) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing photo reference' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Determine if this is a v1 API reference (contains 'places/' and '/photos/')
    const isV1Reference = reference.includes('places/') && reference.includes('/photos/');
    
    let photoUrl;
    
    if (isV1Reference) {
      // For v1 API, the reference is the full resource name
      // We need to extract the resource path and use the v1 format
      // The format is: places/PLACE_ID/photos/PHOTO_RESOURCE/media
      
      // Add /media if it's not already included
      const resourcePath = reference.endsWith('/media') ? reference : `${reference}/media`;
      
      // Get dimensions from query params, using new v1 naming convention
      const maxWidth = searchParams.get('maxwidth') || searchParams.get('maxWidthPx') || '600';
      const maxHeight = searchParams.get('maxheight') || searchParams.get('maxHeightPx');
      
      // Build the dimension params
      const dimensionParams = [`maxWidthPx=${maxWidth}`];
      if (maxHeight) {
        dimensionParams.push(`maxHeightPx=${maxHeight}`);
      }
      
      // Google Places Photo API v1 endpoint
      photoUrl = `https://places.googleapis.com/v1/${resourcePath}?${dimensionParams.join('&')}&key=${process.env.GOOGLE_PLACES_API_KEY}`;
      
      console.log(`Fetching v1 photo: ${resourcePath.substring(0, 35)}...`);
    } else {
      // Legacy format - keep for backward compatibility
      const maxwidth = searchParams.get('maxwidth') || '400';
      
      // Legacy Google Places Photo API endpoint
      photoUrl = `https://maps.googleapis.com/maps/api/place/photo?photoreference=${reference}&maxwidth=${maxwidth}&key=${process.env.GOOGLE_PLACES_API_KEY}`;
      
      console.log(`Fetching legacy photo with reference: ${reference.substring(0, 10)}...`);
    }
    
    // Fetch the image
    const response = await fetch(photoUrl);
    
    if (!response.ok) {
      console.error(`Error fetching photo: ${response.status} ${response.statusText}`);
      return new NextResponse(
        JSON.stringify({ error: `Failed to fetch image: ${response.status}` }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Get the image data and headers
    const imageData = await response.arrayBuffer();
    const contentType = response.headers.get('Content-Type') || 'image/jpeg';
    
    // Return the image with appropriate headers
    return new NextResponse(imageData, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // Cache for one day
      },
    });
  } catch (error) {
    console.error('Error proxying Google Places photo:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to retrieve image' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 