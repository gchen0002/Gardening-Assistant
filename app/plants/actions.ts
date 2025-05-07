'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { Plant } from '@/types/plant'; // Assuming this is the correct path to your Plant type

// Interface for the data we expect from the client when adding a plant from Perenual
// This will be a subset of the Perenual details, mapped to our Plant type structure
interface AddPlantFromApiData {
    name: string; // from common_name
    species?: string | null; // from scientific_name array
    notes?: string | null; // from description, and maybe watering description
    sunlight_needs?: string | null; // from sunlight array/string
    watering_frequency_days?: number | null; // Added this field
    // We might add a field for original_api_id or similar if we want to prevent duplicates or link back
    // For now, let's keep it simple and match what AddPlantForm provides, minus user-settable dates/frequency
    // The user_id will be added by the server action itself.
}

export async function addPlantToGarden(plantData: AddPlantFromApiData) {
    const cookieStore = cookies();
    const supabase = createServerActionClient({ cookies: () => cookieStore });

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        console.error('User not authenticated:', userError);
        return { success: false, error: 'User not authenticated. Please log in.' };
    }

    // Prepare the data for insertion, matching the Plant type (excluding id, dates)
    // Supabase will generate the id. Other dates/frequency will be set by user later.
    const plantToInsert: Omit<Plant, 'id' | 'date_planted' | 'last_watered_date' | 'next_watering_date'> & { user_id: string } = {
        name: plantData.name,
        species: plantData.species,
        notes: plantData.notes,
        sunlight_needs: plantData.sunlight_needs,
        watering_frequency_days: plantData.watering_frequency_days, // Include the estimated frequency
        user_id: user.id, // Associate with the current user
    };

    try {
        const { error: insertError } = await supabase
            .from('plants')
            .insert([plantToInsert]); // Supabase expects an array of objects

        if (insertError) {
            console.error('Error inserting plant into Supabase:', insertError);
            // Check for specific errors, e.g., unique constraint violations if you add them
            if (insertError.code === '23505') { // Example: unique violation code
                 return { success: false, error: 'This plant might already be in your garden.' };
            }
            return { success: false, error: insertError.message || 'Failed to add plant to garden.' };
        }

        // Revalidate the path to the homepage to show the new plant
        revalidatePath('/'); 
        // Potentially revalidate a user-specific garden page if that exists
        // revalidatePath('/my-garden');

        return { success: true, message: `${plantData.name} added to your garden! Watering schedule (est.): ${plantData.watering_frequency_days ? `every ${plantData.watering_frequency_days} days` : 'Not set'}.` };

    } catch (e: any) {
        console.error('Unexpected error adding plant:', e);
        return { success: false, error: e.message || 'An unexpected error occurred.' };
    }
} 