import 'dotenv/config';

async function testPlacesAPI() {
  try {
    const query = "Fun group activities near downtown Austin";
    console.log("Testing Places API (New) with query:", query);
    
    // Using Places API (New) for text search
    const searchUrl = new URL('https://places.googleapis.com/v1/places:searchText');
    
    // Define field mask
    const fieldMask = [
      'places.id',
      'places.displayName',
      'places.formattedAddress',
      'places.types',
      'places.priceLevel',
      'places.rating'
    ].join(',');
    
    // Create request body
    const requestBody = {
      textQuery: query,
      languageCode: "en",
      maxResultCount: 10
    };
    
    console.log("Request body:", JSON.stringify(requestBody, null, 2));
    console.log("API Key:", process.env.GOOGLE_PLACES_API_KEY?.substring(0, 5) + "..." + process.env.GOOGLE_PLACES_API_KEY?.substring(process.env.GOOGLE_PLACES_API_KEY.length - 5));
    
    const response = await fetch(searchUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY || '',
        'X-Goog-FieldMask': fieldMask
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log("Response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error response:", errorText);
      return;
    }
    
    const data = await response.json();
    console.log("Response data:", JSON.stringify(data, null, 2));
    console.log("Number of places:", data.places?.length || 0);
  } catch (error) {
    console.error("Error testing Places API:", error);
  }
}

// Run the test
testPlacesAPI().then(() => console.log("Test complete")); 