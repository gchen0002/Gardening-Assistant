'use client';

import React, { useState } from 'react';
import Link from 'next/link'; // Import Link
// import { fetchPlantSpeciesList } from '@/services/plantApi'; // Original attempt
// import { fetchPlantSpeciesList } from '../../services/plantApi'; // Relative attempt
import { fetchPlantSpeciesList } from '@/src/services/plantApi'; // Correct path based on tsconfig

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // For displaying errors
import { Loader2 } from 'lucide-react'; // Simple loader icon

// Basic interface for plant data from the list endpoint
interface PlantSpeciesSummary {
    id: number;
    common_name: string;
    scientific_name: string[];
    // Add other fields you might want to display from the list
}

// Interface for the API response structure (adjust based on actual API)
interface ApiResponse {
    data: PlantSpeciesSummary[];
    // Add pagination fields if needed (to, from, current_page, last_page, total)
}

export default function PlantsPage() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<PlantSpeciesSummary[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searched, setSearched] = useState(false); // Track if a search has been performed

    const handleSearch = async () => {
        if (!query.trim()) return; // Don't search if query is empty

        setIsLoading(true);
        setError(null);
        setResults([]);
        setSearched(true);

        try {
            // TODO: Implement pagination if needed
            const response: ApiResponse = await fetchPlantSpeciesList(query);
            setResults(response.data || []); // Ensure results is always an array
            if (!response.data || response.data.length === 0) {
                // Use error state for no results message, or handle differently if preferred
                setError('No plants found matching your query.');
            }
        } catch (err) {
            console.error("Search failed:", err);
            setError('Failed to fetch plant data. Please check your API key and network connection.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
            <h1 className="text-3xl font-bold mb-6 text-center">Plant Finder</h1>
            <div className="flex w-full max-w-sm items-center space-x-2 mx-auto mb-6">
                <Input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={handleKeyPress} // Allow searching with Enter key
                    placeholder="Enter plant name (e.g., Monstera)"
                    disabled={isLoading}
                    aria-label="Plant search input"
                />
                <Button
                    type="button" // Explicitly type as button
                    onClick={handleSearch}
                    disabled={isLoading || !query.trim()}
                >
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {isLoading ? 'Searching...' : 'Search'}
                </Button>
            </div>

            {/* Display loading state centrally */} 
            {isLoading && (
                 <div className="flex justify-center items-center mt-8">
                     <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                </div>
            )}

            {/* Display error message using Alert component */} 
            {!isLoading && error && (
                <Alert variant="destructive" className="max-w-md mx-auto mt-4">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Display results or no results message (only after a search and not loading/error) */} 
            {!isLoading && !error && searched && results.length === 0 && (
                 <p className="text-center text-gray-600 mt-8">No plants found matching your query.</p>
            )}
            
            {!isLoading && !error && results.length > 0 && (
                <Card className="mt-8 max-w-2xl mx-auto">
                    <CardHeader>
                        <CardTitle>Search Results</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-4">
                            {results.map((plant) => (
                                <li
                                    key={plant.id}
                                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-3 last:border-b-0 last:pb-0"
                                >
                                    <div>
                                        <span className="font-medium">{plant.common_name}</span>
                                        <span className="text-sm text-gray-600 block">({plant.scientific_name.join(', ')})</span>
                                    </div>
                                    <Link href={`/plants/${plant.id}`}>
                                        <Button variant="outline" size="sm" className="mt-2 sm:mt-0">
                                            View Details
                                        </Button>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                        {/* TODO: Add pagination controls */} 
                    </CardContent>
                </Card>
            )}
        </div>
    );
} 