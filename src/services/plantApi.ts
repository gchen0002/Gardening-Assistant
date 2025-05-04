import axios from 'axios';

// Read the NEXT_PUBLIC_ prefixed environment variable
const API_KEY = process.env.NEXT_PUBLIC_PERENUAL_API_KEY || 'YOUR_API_KEY_HERE'; 
const BASE_URL = 'https://perenual.com/api/v2';

interface Plant {
    id: number;
    common_name: string;
    scientific_name: string[];
    // Add other relevant fields based on the API response
}

/**
 * Fetches a list of plant species from the Perenual API.
 * @param query Optional search query for plant names.
 * @param page Optional page number for pagination.
 * @returns A promise that resolves to the API response data.
 */
export const fetchPlantSpeciesList = async (query?: string, page: number = 1): Promise<any> => {
    // Check if the key is still the placeholder or actually missing after loading env vars
    if (!API_KEY || API_KEY === 'YOUR_API_KEY_HERE') {
        console.error("Perenual API Key not found. Please ensure NEXT_PUBLIC_PERENUAL_API_KEY is set in .env.local and the server was restarted.");
        throw new Error("Perenual API Key not configured.");
    }

    const params: any = {
        key: API_KEY,
        page: page,
    };
    if (query) {
        params.q = query;
    }

    try {
        // The console log we added earlier will now check the NEXT_PUBLIC_ variable
        console.log('Using Perenual API Key:', API_KEY ? API_KEY.substring(0, 5) + '...' : 'Not Found'); 
        const response = await axios.get(`${BASE_URL}/species-list`, { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching plant species list:", error);
        throw error; 
    }
};

/**
 * Fetches detailed information for a specific plant species by its ID.
 * @param speciesId The ID of the plant species.
 * @returns A promise that resolves to the detailed plant data.
 */
export const fetchPlantDetails = async (speciesId: number): Promise<any> => {
    // Update the check here as well
     if (!API_KEY || API_KEY === 'YOUR_API_KEY_HERE') {
        console.error("Perenual API Key not found. Please ensure NEXT_PUBLIC_PERENUAL_API_KEY is set in .env.local and the server was restarted.");
        throw new Error("Perenual API Key not configured.");
    }

    try {
        const response = await axios.get(`${BASE_URL}/species/details/${speciesId}`, {
            params: { key: API_KEY }
        });
        return response.data;
    } catch (error) {
        console.error(`Error fetching details for plant ID ${speciesId}:`, error);
        throw error;
    }
};

// Example usage (optional, for testing)
/*
fetchPlantSpeciesList('monstera')
    .then(data => {
        console.log("Species List:", data);
        if (data.data && data.data.length > 0) {
            return fetchPlantDetails(data.data[0].id);
        }
    })
    .then(details => {
        if (details) {
            console.log("Plant Details:", details);
        }
    })
    .catch(error => {
        console.error("API Error:", error);
    });
*/ 