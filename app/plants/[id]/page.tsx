'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation'; // Added useRouter
import { fetchPlantDetails } from '@/src/services/plantApi';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, AlertCircle as AlertIcon, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { addPlantToGarden } from '../actions'; // Import the server action

// Interface for the detailed plant data (expand as needed based on API response)
interface PlantDetails {
    id: number;
    common_name: string;
    scientific_name: string[];
    other_name?: string[];
    cycle?: string;
    watering?: string;
    sunlight?: string[] | string; // Can be array or string based on API docs examples
    description?: string;
    default_image?: {
        regular_url?: string;
        thumbnail?: string;
        original_url?: string;
    };
    // Add more fields like: dimensions, pruning_month, flowers, care_level etc.
    watering_general_benchmark?: { value: string; unit: string };
    care_level?: string;
    maintenance?: string;
    hardiness?: { min: string; max: string };
    type?: string;
    indoor?: boolean;
}

// Helper function to estimate watering frequency in days
const estimateWateringFrequency = (plant: PlantDetails): number | null => {
    if (plant.watering_general_benchmark && typeof plant.watering_general_benchmark.value === 'string') {
        const { value, unit } = plant.watering_general_benchmark;
        let days: number | null = null;

        // Try to parse a number from the value string (e.g., "5-7" -> 5, "7" -> 7)
        const match = value.match(/\d+/);
        if (match) {
            days = parseInt(match[0], 10);
        }

        if (days !== null) {
            if (unit && unit.toLowerCase().includes('week')) {
                return days * 7;
            } else if (unit && unit.toLowerCase().includes('month')) {
                 return days * 30; // Approximate
            }
            return days; // Assume days if not week/month or unit is undefined
        }
    }

    // Fallback to descriptive watering string
    if (plant.watering) {
        switch (plant.watering.toLowerCase()) {
            case 'frequent': return 3; // e.g., every 3 days
            case 'average': return 7;  // e.g., once a week
            case 'minimum': return 14; // e.g., every 2 weeks
            case 'none': return null; // Or a very high number if null is not desired, but null means user must set
            default: return null;
        }
    }
    return null; // Default if no info
};

export default function PlantDetailsPage() {
    const params = useParams();
    const router = useRouter(); // For navigation
    const id = params?.id;

    const [plant, setPlant] = useState<PlantDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true); // Start loading initially
    const [error, setError] = useState<string | null>(null);

    // For server action handling
    const [isPending, startTransition] = useTransition();
    const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [isAdded, setIsAdded] = useState(false); // To track if plant has been added

    useEffect(() => {
        if (id && typeof id === 'string') {
            const plantId = parseInt(id, 10);
            if (!isNaN(plantId)) {
                setIsLoading(true);
                setError(null);
                setActionMessage(null); // Clear action message on new load
                setIsAdded(false); // Reset added state
                fetchPlantDetails(plantId)
                    .then(data => {
                        setPlant(data);
                    })
                    .catch(err => {
                        console.error(`Error fetching details for plant ID ${plantId}:`, err);
                        setError('Failed to load plant details. The plant might not exist or there was a network issue.');
                    })
                    .finally(() => {
                        setIsLoading(false);
                    });
            } else {
                setError('Invalid plant ID provided.');
                setIsLoading(false);
            }
        } else if (id === undefined) {
             // Wait for params to be available
            setIsLoading(true);
        } else {
            setError('Plant ID not found in URL.');
            setIsLoading(false);
        }

    }, [id]); // Re-run effect if id changes

    const handleAddToGarden = async () => {
        if (!plant) return;
        setActionMessage(null);

        const estimatedFrequency = estimateWateringFrequency(plant);

        const plantDataForSupabase = {
            name: plant.common_name,
            species: plant.scientific_name.join(', '),
            notes: plant.description || 'No description available.',
            sunlight_needs: formatSunlight(plant.sunlight),
            watering_frequency_days: estimatedFrequency,
        };

        startTransition(async () => {
            const result = await addPlantToGarden(plantDataForSupabase);
            if (result.success) {
                setActionMessage({ type: 'success', text: result.message || 'Plant added successfully!' });
                setIsAdded(true);
            } else {
                setActionMessage({ type: 'error', text: result.error || 'Failed to add plant.' });
            }
        });
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="h-16 w-16 animate-spin text-gray-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto p-4 md:p-6 lg:p-8">
                 <Alert variant="destructive" className="max-w-lg mx-auto mt-8">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
                <div className="text-center mt-4">
                    <Link href="/plants">
                         <Button variant="outline">Back to Search</Button>
                    </Link>
                </div>
            </div>
        );
    }

    if (!plant) {
        // This case might occur briefly or if fetch fails silently
        return (
            <div className="container mx-auto p-4 md:p-6 lg:p-8 text-center">
                <p>Plant details not found.</p>
                 <div className="mt-4">
                    <Link href="/plants">
                         <Button variant="outline">Back to Search</Button>
                    </Link>
                </div>
            </div>
            );
    }

    // Helper to format sunlight array/string
    const formatSunlight = (sunlight: string[] | string | undefined): string => {
        if (!sunlight) return 'N/A';
        if (Array.isArray(sunlight)) return sunlight.join(', ');
        return sunlight;
    }

    return (
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
            <Card className="max-w-3xl mx-auto">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
                        <div>
                            <CardTitle className="text-2xl mb-1">{plant.common_name}</CardTitle>
                            <CardDescription className="text-lg italic">
                                {plant.scientific_name.join(', ')}
                                {plant.other_name && plant.other_name.length > 0 && ` (${plant.other_name.join(', ')})`}
                            </CardDescription>
                        </div>
                         <Link href="/plants" className="mt-2 sm:mt-0">
                             <Button variant="outline">Back to Search</Button>
                        </Link>
                    </div>
                     {plant.type && <Badge variant="secondary" className="mr-2">{plant.type}</Badge>}
                     {plant.indoor && <Badge variant="secondary">Indoor</Badge>}
                </CardHeader>
                <CardContent className="space-y-4">
                    {plant.default_image?.regular_url && (
                        <img
                            src={plant.default_image.regular_url}
                            alt={`Image of ${plant.common_name}`}
                            className="w-full h-64 object-cover rounded-md mb-4"
                         />
                     )}

                    {plant.description && (
                         <div>
                             <h3 className="font-semibold text-lg mb-1">Description</h3>
                             <p className="text-gray-700">{plant.description}</p>
                        </div>
                     )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
                        <div>
                            <h4 className="font-medium">Watering</h4>
                             <p>{plant.watering || 'N/A'}</p>
                             {plant.watering_general_benchmark && (
                                 <p className="text-sm text-gray-600">~ Every {plant.watering_general_benchmark.value} {plant.watering_general_benchmark.unit}</p>
                            )}
                         </div>
                         <div>
                             <h4 className="font-medium">Sunlight</h4>
                             <p>{formatSunlight(plant.sunlight)}</p>
                        </div>
                         <div>
                             <h4 className="font-medium">Cycle</h4>
                            <p>{plant.cycle || 'N/A'}</p>
                         </div>
                        <div>
                            <h4 className="font-medium">Care Level</h4>
                             <p>{plant.care_level || 'N/A'}</p>
                        </div>
                         {plant.hardiness && (
                             <div>
                                 <h4 className="font-medium">Hardiness Zones</h4>
                                 <p>{plant.hardiness.min} - {plant.hardiness.max}</p>
                             </div>
                        )}
                         <div>
                             <h4 className="font-medium">Maintenance</h4>
                             <p>{plant.maintenance || 'N/A'}</p>
                         </div>
                     </div>

                    {/* Action Message Area */} 
                    {actionMessage && (
                        <Alert variant={actionMessage.type === 'error' ? 'destructive' : 'default'} className="mt-4">
                            {actionMessage.type === 'error' ? <AlertIcon className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                            <AlertTitle>{actionMessage.type === 'error' ? 'Error' : 'Success'}</AlertTitle>
                            <AlertDescription>{actionMessage.text}</AlertDescription>
                        </Alert>
                    )}

                    {/* "Add to My Garden" button */}
                    {!isAdded && (
                        <Button 
                            onClick={handleAddToGarden} 
                            disabled={isPending || isLoading}
                            className="w-full mt-6"
                            size="lg"
                        >
                            {isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <PlusCircle className="mr-2 h-5 w-5" />}
                            {isPending ? 'Adding to Garden...' : 'Add to My Garden'}
                        </Button>
                    )}
                    {isAdded && actionMessage?.type === 'success' && (
                         <Button 
                            onClick={() => router.push('/')} 
                            className="w-full mt-6"
                            variant="outline"
                            size="lg"
                        >
                            View in My Garden
                        </Button>
                    )}

                </CardContent>
            </Card>
        </div>
    );
} 