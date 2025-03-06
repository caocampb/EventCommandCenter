// Function to search Google Places API
async function searchGooglePlaces(query: string): Promise<GooglePlace[]> {
  try {
    console.log("Searching Google Places with query:", query);
    
    // Using Places API (New) for text search
    const searchUrl = new URL('https://places.googleapis.com/v1/places:searchText');
    
    // Define field mask based on the fields we need - keeping it simpler
    const fieldMask = [
      'places.id',
      'places.displayName',
      'places.formattedAddress',
      'places.types',
      'places.priceLevel',
      'places.rating'
    ].join(',');
    
    // Create request body according to Places API (New) format
    const requestBody = {
      textQuery: query,
      languageCode: "en",
      maxResultCount: 20
    };
    
    console.log("Using Places API (New) with query:", query);
    
    const response = await fetch(searchUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY || '',
        'X-Goog-FieldMask': fieldMask
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      console.error("Places API error status:", response.status);
      const responseText = await response.text();
      console.error("Response text:", responseText);
      throw new Error(`Failed to fetch from Google Places API: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log("Google Places API response received");
    console.log("Number of results:", data.places?.length || 0);
    
    if (!data.places || data.places.length === 0) {
      console.log("No places found in the response");
      return [];
    }
    
    // Transform the Places API (New) response format to match our GooglePlace interface
    return data.places.map((place: any) => {
      // For debugging
      console.log("Processing place:", place.id, place.displayName);
      
      return {
        place_id: place.id,
        name: place.displayName?.text || place.id, // Fallback to ID if text is missing
        formatted_address: place.formattedAddress || "",
        types: place.types || [],
        price_level: place.priceLevel || 0,
        rating: place.rating || 0,
        website: place.websiteUri || "",
        formatted_phone_number: place.nationalPhoneNumber || ""
      };
    });
  } catch (error) {
    console.error('Error searching Google Places:', error);
    // Return empty array instead of throwing to avoid API route failure
    return [];
  }
}

// Main handler for POST requests
export async function POST(request: Request) {
  try {
    console.log("=== Discovery API request received ===");
    
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    
    const { query } = body;
    console.log("Discovery API received query:", query);
    
    if (!query || typeof query !== 'string') {
      console.log("Invalid query format:", query);
      return NextResponse.json({ error: 'Invalid query. Query must be a non-empty string.' }, { status: 400 });
    }
    
    // Step 1: Get places from Google API
    console.log("Fetching results from Google Places API...");
    let placesResults;
    try {
      placesResults = await searchGooglePlaces(query);
      console.log(`Found ${placesResults.length} results from Google Places API`);
    } catch (googleError) {
      console.error("Error searching Google Places:", googleError);
      return NextResponse.json({ 
        error: 'Failed to search places', 
        message: googleError.message 
      }, { status: 500 });
    }
    
    if (!placesResults.length) {
      console.log("No results found from Google Places API");
      return NextResponse.json({ 
        results: [],
        message: "No results found for your query. Try a different search term or location."
      });
    }
    
    // Step 2: Enhance results with Claude (if available)
    let enhancedResults = [];
    try {
      console.log("Enhancing results with Claude...");
      const claudeEnhancements = await enhanceWithClaude(placesResults, query);
      
      // Step 3: Merge Google data with Claude enhancements
      enhancedResults = placesResults.map((place: GooglePlace) => {
        // Find matching enhancement
        const enhancement: ClaudeEnhancement = claudeEnhancements.find((e: ClaudeEnhancement) => e.placeId === place.place_id) || {
          placeId: place.place_id
        };
        
        // Create combined result
        return {
          placeId: place.place_id,
          name: place.name,
          location: place.formatted_address,
          rating: place.rating,
          priceLevel: place.price_level,
          website: place.website,
          phoneNumber: place.formatted_phone_number,
          
          // Claude-enhanced fields
          category: enhancement.category || getDefaultCategory(place.types),
          eventSuitabilityScore: enhancement.eventSuitabilityScore || 3,
          description: enhancement.description || '',
          
          // Include original data
          source: 'google_places',
          sourceData: place
        };
      });
    } catch (claudeError) {
      console.error('Error in Claude enhancement, falling back to basic results:', claudeError);
      
      // Fallback to basic results without Claude enhancements
      enhancedResults = placesResults.map((place: GooglePlace) => ({
        placeId: place.place_id,
        name: place.name,
        location: place.formatted_address,
        rating: place.rating,
        priceLevel: place.price_level,
        category: getDefaultCategory(place.types),
        eventSuitabilityScore: 3,
        description: `${place.name} is located at ${place.formatted_address}.`,
        source: 'google_places',
        sourceData: place
      }));
    }
    
    console.log("Returning", enhancedResults.length, "enhanced results");
    return NextResponse.json({ results: enhancedResults });
  } catch (error) {
    console.error('Error in discovery API:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error.message || 'Unknown error occurred'
    }, { status: 500 });
  }
} 