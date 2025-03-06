import { NextResponse } from 'next/server';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

// Define types for Google Places results
interface GooglePlace {
  place_id: string;
  name: string;
  formatted_address?: string;
  types?: string[];
  price_level?: number;
  rating?: number;
  user_ratings_total?: number;
  website?: string;
  formatted_phone_number?: string;
  photos?: { 
    name: string;  // Changed from photo_reference to name in v1 API
    heightPx?: number;
    widthPx?: number;
    authorAttributions?: any[];
  }[];
}

// Define types for Claude enhancements
interface ClaudeEnhancement {
  placeId: string;
  category?: string;
  eventSuitabilityScore?: number;
  description?: string;
}

// Initialize AWS Bedrock client for Claude
const bedrock = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

// Function to search Google Places API
async function searchGooglePlaces(query: string): Promise<GooglePlace[]> {
  try {
    console.log("Searching Google Places with query:", query);
    
    // Using Places API (New) for text search
    const searchUrl = new URL('https://places.googleapis.com/v1/places:searchText');
    
    // Define field mask based on the fields we need
    const fieldMask = [
      'places.id',
      'places.displayName',
      'places.formattedAddress',
      'places.types',
      'places.priceLevel',
      'places.rating',
      'places.userRatingCount',
      'places.websiteUri',
      'places.nationalPhoneNumber',
      'places.photos'
    ].join(',');
    
    // Create request body according to Places API (New) format
    const requestBody = {
      textQuery: query,
      languageCode: "en",
      // Optional parameters that can improve results
      maxResultCount: 20
    };
    
    console.log("Using Places API (New) with query:", query);
    console.log("Field mask:", fieldMask);
    
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
    
    // Log response info
    console.log("Google Places API response received");
    console.log("Number of results:", data.places?.length || 0);
    
    if (!data.places || data.places.length === 0) {
      console.log("No places found in the response");
      return [];
    }
    
    // Transform the Places API (New) response format to match our GooglePlace interface
    return data.places.map((place: any) => {
      // Convert price level to numeric format if it's a string enum
      let priceLevel = place.priceLevel;
      if (typeof priceLevel === 'string') {
        // Map string enum to numeric values
        const priceLevelMap: Record<string, number> = {
          'PRICE_LEVEL_FREE': 0,
          'PRICE_LEVEL_INEXPENSIVE': 1,
          'PRICE_LEVEL_MODERATE': 2,
          'PRICE_LEVEL_EXPENSIVE': 3,
          'PRICE_LEVEL_VERY_EXPENSIVE': 4
        };
        priceLevel = priceLevelMap[priceLevel] !== undefined ? priceLevelMap[priceLevel] : null;
      }
      
      return {
        place_id: place.id,
        name: place.displayName?.text || '',
        formatted_address: place.formattedAddress,
        types: place.types,
        price_level: priceLevel,
        rating: place.rating,
        user_ratings_total: place.userRatingCount,
        website: place.websiteUri,
        formatted_phone_number: place.nationalPhoneNumber,
        photos: place.photos ? place.photos.map((photo: any) => ({
          name: photo.name,
          heightPx: photo.heightPx,
          widthPx: photo.widthPx,
          authorAttributions: photo.authorAttributions
        })) : undefined
      };
    });
  } catch (error) {
    console.error('Error searching Google Places:', error);
    // Return empty array instead of throwing error
    return [];
  }
}

// Function to enhance results with Claude
async function enhanceWithClaude(places: GooglePlace[], originalQuery: string, context?: any): Promise<ClaudeEnhancement[]> {
  try {
    console.log("Starting Claude enhancement for", places.length, "places");
    
    if (!places.length) {
      console.log("No places to enhance");
      return [];
    }
    
    // Prepare data for Claude
    const placesData = places.map(place => ({
      id: place.place_id,
      name: place.name,
      address: place.formatted_address,
      types: place.types,
      price_level: place.price_level,
      rating: place.rating,
      user_ratings_total: place.user_ratings_total,
      website: place.website,
      phone: place.formatted_phone_number
    }));
    
    // Build context string if provided
    let contextStr = '';
    if (context) {
      if (context.attendeeCount) {
        contextStr += `- ${context.attendeeCount} attendees\n`;
      }
      
      if (context.eventType) {
        contextStr += `- Event type: ${context.eventType}\n`;
      }
      
      if (context.specialRequirements) {
        contextStr += `- Special requirements: ${context.specialRequirements}\n`;
      }
    }
    
    // Include context in prompt if provided
    const contextSection = contextStr ? `\nEVENT CONTEXT:\n${contextStr}\n` : '';
    
    // Create enhanced prompt for Claude with better structured reasoning
    const prompt = `
You are a professional event planning assistant evaluating venues for an event planner.

I need you to analyze these venue results from a search for: "${originalQuery}"
${contextSection}

## ANALYSIS FRAMEWORK

For each venue, follow this step-by-step reasoning process:

1. VENUE CLASSIFICATION:
   * Review the venue types, features, and characteristics
   * Determine the most appropriate vendor category: venue, food, entertainment, staffing, equipment, transportation, other

2. EVENT SUITABILITY ASSESSMENT:
   Calculate a suitability score (1-10) based on these specific criteria:
   * Query match (0-3 points): How directly does this venue match the search query terms
   * Event type fit (0-3 points): How well does this venue accommodate the event type ${context?.eventType || 'requested'}
   * Capacity match (0-1 point): Can it reasonably accommodate ${context?.attendeeCount || 'the expected number of'} attendees
   * Requirements match (0-1 point): Does it satisfy ${context?.specialRequirements ? 'requirements: ' + context.specialRequirements : 'any special requirements'}
   * Quality indicators (0-2 points): Rating, reviews, price level appropriateness

3. VENUE HIGHLIGHTS:
   * Identify 2-3 key features most relevant to the event context
   * Note any potential limitations or considerations

## RESPONSE FORMAT

For each venue, provide:
1. The most appropriate vendor category (from the list above)
2. A suitability score (1-10) with brief reasoning for the score
3. A concise description (1-2 sentences) that:
   - Focuses on factual, verifiable information about the venue
   - Directly connects venue attributes to the event needs
   - Avoids speculation about specific events unless explicitly mentioned
   - Maintains a professional, objective tone

Here are the venues to evaluate:
${JSON.stringify(placesData, null, 2)}

Format your response as valid JSON with the following structure:
{
  "enhancedResults": [
    {
      "placeId": "the_place_id",
      "category": "one of the categories listed above",
      "eventSuitabilityScore": number from 1-10,
      "description": "concise description highlighting event suitability"
    },
    ...
  ]
}

Only respond with the JSON object and nothing else.
    `;
    
    console.log("Calling Claude 3.7 with prompt length:", prompt.length);
    
    // Call Claude 3.7 via Bedrock
    const modelId = 'us.anthropic.claude-3-7-sonnet-20250219-v1:0'; // Claude 3.7 Sonnet model ID
    console.log("Using model ID:", modelId);
    
    try {
      const command = new InvokeModelCommand({
        modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          anthropic_version: 'bedrock-2023-05-31',
          max_tokens: 4096,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      });
      
      console.log("Sending request to AWS Bedrock");
      const claudeResponse = await bedrock.send(command);
      console.log("Received response from AWS Bedrock");
      
      // Parse and process response
      const responseBody = JSON.parse(new TextDecoder().decode(claudeResponse.body));
      console.log("Claude response successfully decoded");
      
      try {
        // Get the text content from the response
        const rawText = responseBody.content[0].text;
        
        // Clean up the response by removing markdown code block formatting if present
        let cleanedText = rawText;
        if (rawText.includes("```json")) {
          cleanedText = rawText.replace(/```json\n|\n```/g, "");
        } else if (rawText.includes("```")) {
          cleanedText = rawText.replace(/```\n|\n```/g, "");
        }
        
        const enhancedData = JSON.parse(cleanedText);
        console.log("Claude output successfully parsed as JSON");
        return enhancedData.enhancedResults || [];
      } catch (jsonError) {
        console.error("Failed to parse Claude response as JSON:", responseBody.content[0].text);
        console.error("JSON parse error:", jsonError);
        throw new Error("Failed to parse Claude response as JSON");
      }
    } catch (bedrockError) {
      console.error("AWS Bedrock API error:", bedrockError);
      
      // Create mock enhanced results as fallback
      console.log("Creating fallback enhancement data");
      return places.map(place => ({
        placeId: place.place_id,
        category: getDefaultCategory(place.types),
        eventSuitabilityScore: 6,
        description: `${place.name} is located at ${place.formatted_address}.`
      }));
    }
  } catch (error) {
    console.error('Error enhancing with Claude:', error);
    return []; // Return empty array on error
  }
}

// Main handler for POST requests
export async function POST(request: Request) {
  try {
    const { query, context } = await request.json();
    console.log("Discovery API received query:", query);
    
    if (context) {
      console.log("With event context:", JSON.stringify(context));
    }
    
    if (!query || typeof query !== 'string') {
      console.log("Invalid query format:", query);
      return NextResponse.json({ error: 'Invalid query' }, { status: 400 });
    }
    
    // Step 1: Get places from Google API
    console.log("Fetching results from Google Places API...");
    const placesResults = await searchGooglePlaces(query);
    console.log(`Found ${placesResults.length} results from Google Places API`);
    
    if (!placesResults.length) {
      console.log("No results found from Google Places API");
      return NextResponse.json({ results: [] });
    }
    
    // Step 2: Enhance results with Claude (if available)
    let enhancedResults = [];
    try {
      const claudeEnhancements = await enhanceWithClaude(placesResults, query, context);
      
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
          user_ratings_total: place.user_ratings_total,
          priceLevel: place.price_level,
          website: place.website,
          phoneNumber: place.formatted_phone_number,
          
          // Claude-enhanced fields
          category: enhancement.category || getDefaultCategory(place.types),
          eventSuitabilityScore: enhancement.eventSuitabilityScore || 6,
          description: enhancement.description || '',
          
          // Include original data
          source: 'google_places',
          sourceData: place
        };
      });
    } catch (error) {
      console.error('Error in Claude enhancement, falling back to basic results:', error);
      
      // Fallback to basic results without Claude enhancements
      enhancedResults = placesResults.map((place: GooglePlace) => ({
        placeId: place.place_id,
        name: place.name,
        location: place.formatted_address,
        rating: place.rating,
        user_ratings_total: place.user_ratings_total,
        priceLevel: place.price_level,
        category: getDefaultCategory(place.types),
        source: 'google_places',
        sourceData: place
      }));
    }
    
    // Calculate hybrid score that combines multiple ranking signals
    const calculateHybridScore = (
      venue: any, 
      query: string,
      context?: any
    ): number => {
      // 1. Claude's eventSuitabilityScore (50% weight)
      // This represents Claude's assessment of the venue's match to the query and context
      const claudeScore = venue.eventSuitabilityScore !== undefined ? venue.eventSuitabilityScore : 6;
      
      // 2. Keyword match score (30% weight)
      // Simple implementation - count how many query terms appear in venue data
      const queryTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 2);
      let keywordMatches = 0;
      
      // Check venue name, category, and types for keyword matches
      const venueText = [
        venue.name,
        venue.category,
        venue.location,
        ...(venue.sourceData?.types || [])
      ].filter(Boolean).join(' ').toLowerCase();
      
      // Count term matches
      queryTerms.forEach(term => {
        if (venueText.includes(term)) {
          keywordMatches++;
        }
      });
      
      // Calculate normalized keyword score (0-10)
      const maxPossibleMatches = Math.min(queryTerms.length, 5); // Cap at 5 matches
      const keywordScore = maxPossibleMatches > 0 
        ? (keywordMatches / maxPossibleMatches) * 10
        : 5; // Default to neutral if no meaningful query terms
      
      // 3. Rating score (20% weight)
      // Normalize Google rating (usually 0-5) to 0-10 scale
      const ratingScore = venue.rating !== undefined
        ? (venue.rating / 5) * 10
        : 5; // Default to neutral if no rating
      
      // Special context-aware boosts
      let contextBoost = 0;
      
      // If we have context, boost venues that match specific requirements
      if (context) {
        // Example: If user specified attendee count, boost venues that can accommodate groups
        if (context.attendeeCount && parseInt(context.attendeeCount, 10) > 10) {
          // Check if venue types suggest it can handle groups
          const groupFriendlyTypes = ['restaurant', 'event_venue', 'conference_room', 'banquet_hall'];
          const hasGroupFriendlyType = venue.sourceData?.types?.some((type: string) => 
            groupFriendlyTypes.includes(type.toLowerCase())
          );
          
          if (hasGroupFriendlyType) {
            contextBoost += 1;
          }
        }
        
        // More contextual boosts can be added here as needed
      }
      
      // Combine scores with weights
      const weightedScore = (
        (claudeScore * 0.5) +    // Claude's score (50%)
        (keywordScore * 0.3) +   // Keyword matching (30%)
        (ratingScore * 0.2)      // Rating (20%)
      ) + contextBoost;          // Add context-specific boost
      
      // Ensure score doesn't exceed 10
      const finalScore = Math.min(10, weightedScore);
      
      // Log scores for debugging
      if (process.env.NODE_ENV === 'development') {
        console.log(`Hybrid score for ${venue.name}: ${finalScore.toFixed(2)}`);
        console.log(`  - Claude: ${claudeScore} × 0.5 = ${(claudeScore * 0.5).toFixed(2)}`);
        console.log(`  - Keywords: ${keywordScore} × 0.3 = ${(keywordScore * 0.3).toFixed(2)}`);
        console.log(`  - Rating: ${ratingScore} × 0.2 = ${(ratingScore * 0.2).toFixed(2)}`);
        console.log(`  - Context boost: ${contextBoost}`);
        if (weightedScore > 10) {
          console.log(`  - Score capped from ${weightedScore.toFixed(2)} to 10.0`);
        }
      }
      
      return finalScore;
    };
    
    // Sort results using hybrid score (highest first)
    enhancedResults.sort((a: any, b: any) => {
      const scoreA = calculateHybridScore(a, query, context);
      const scoreB = calculateHybridScore(b, query, context);
      
      // Store the calculated score on the object for reference
      // This makes it available to the frontend if needed
      a.hybridScore = scoreA;
      b.hybridScore = scoreB;
      
      return scoreB - scoreA;
    });
    
    console.log("Returning", enhancedResults.length, "enhanced results");
    
    return NextResponse.json({ results: enhancedResults });
  } catch (error) {
    console.error('Error in discovery API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to map Google place types to our vendor categories
function getDefaultCategory(types: string[] = []): string {
  if (!types || !types.length) return 'other';
  
  const typeMap: Record<string, string> = {
    'restaurant': 'catering',
    'food': 'catering',
    'bakery': 'catering',
    'meal_delivery': 'catering',
    'meal_takeaway': 'catering',
    'cafe': 'catering',
    
    'event_venue': 'venue',
    'banquet_hall': 'venue',
    'wedding_hall': 'venue',
    'conference_center': 'venue',
    'lodging': 'venue',
    'park': 'venue',
    'tourist_attraction': 'venue',
    
    'night_club': 'entertainment',
    'casino': 'entertainment',
    'movie_theater': 'entertainment',
    'amusement_park': 'entertainment',
    'aquarium': 'entertainment',
    'art_gallery': 'entertainment',
    'bowling_alley': 'entertainment',
    
    'moving_company': 'transportation',
    'airport_shuttle': 'transportation',
    'taxi_stand': 'transportation',
    'transit_station': 'transportation',
    'car_rental': 'transportation',
    'bus_station': 'transportation',
    
    'store': 'equipment',
    'electronics_store': 'equipment',
    'rental': 'equipment',
    'furniture_store': 'equipment',
    
    'employment_agency': 'staffing',
  };
  
  // Try to find a matching type
  for (const type of types) {
    if (typeMap[type]) {
      return typeMap[type];
    }
  }
  
  return 'other';
} 