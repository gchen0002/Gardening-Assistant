'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Droplets } from "lucide-react";
import { supabase } from '@/lib/supabaseClient';

interface WaterAllPlantsButtonProps {
  plantsCount: number;
}

export default function WaterAllPlantsButton({ plantsCount }: WaterAllPlantsButtonProps) {
  const router = useRouter();
  const [isWatering, setIsWatering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  // Debug function to check database schema and permissions
  const checkDatabaseAccess = async () => {
    setDebugInfo("Checking database...");
    try {
      // 1. Check if we can read the plants table without using aggregate functions
      const { data: tableCheck, error: tableError } = await supabase
        .from('plants')
        .select('id')
        .limit(1);
      
      if (tableError) {
        setDebugInfo(`Table read error: ${tableError.message}`);
        return;
      }
      
      // 2. Get column info by selecting a row
      const { data: sampleRow, error: sampleError } = await supabase
        .from('plants')
        .select('*')
        .limit(1);
        
      if (sampleError) {
        setDebugInfo(`Sample row error: ${sampleError.message}`);
        return;
      }
      
      if (!sampleRow || sampleRow.length === 0) {
        setDebugInfo("No plants found in database");
        return;
      }
      
      // 3. Show available columns
      const columns = Object.keys(sampleRow[0]).join(', ');
      const hasRequiredColumns = columns.includes('next_watering_date') && 
                               columns.includes('last_watered_date') && 
                               columns.includes('watering_frequency_days');
      
      if (hasRequiredColumns) {
        setDebugInfo(`Available columns: ${columns}\n\nAll required columns are present! The database schema looks good.`);
      } else {
        // Check which columns are missing
        const missingColumns = [];
        if (!columns.includes('next_watering_date')) missingColumns.push('next_watering_date');
        if (!columns.includes('last_watered_date')) missingColumns.push('last_watered_date');
        if (!columns.includes('watering_frequency_days')) missingColumns.push('watering_frequency_days');
        
        if (missingColumns.length > 0) {
          setDebugInfo(`Available columns: ${columns}\n\nMissing columns: ${missingColumns.join(', ')}`);
        }
      }
    } catch (e) {
      setDebugInfo(`Database check error: ${e}`);
    }
  };

  const handleWaterAll = async () => {
    if (isWatering) return;

    setIsWatering(true);
    setError(null);

    try {
      // Fetch plants that need watering
      const now = new Date();
      const { data: plants, error: fetchError } = await supabase
        .from('plants')
        .select('id, watering_frequency_days')
        .lt('next_watering_date', now.toISOString());

      if (fetchError) throw fetchError;
      if (!plants?.length) {
        setIsWatering(false);
        return;
      }

      // Update all plants that need watering
      const updates = plants.map(plant => {
        const nextWateringDate = new Date();
        if (plant.watering_frequency_days) {
          nextWateringDate.setDate(nextWateringDate.getDate() + plant.watering_frequency_days);
        }

        return {
          id: plant.id,
          last_watered_date: now.toISOString(),
          next_watering_date: plant.watering_frequency_days ? nextWateringDate.toISOString() : null
        };
      });

      // Perform the batch update
      const { error: updateError } = await supabase
        .from('plants')
        .upsert(updates);

      if (updateError) throw updateError;

      // Refresh the page to show updated data
      router.refresh();
    } catch (err: any) {
      console.error('Error watering all plants:', err);
      setError(err.message || 'Failed to water plants');
    } finally {
      setIsWatering(false);
    }
  };

  // Function to simulate plants that need watering by setting next_watering_date to yesterday
  const simulatePlantsNeedWatering = async () => {
    setIsSimulating(true);
    setError(null);
    
    try {
      // First, check if the next_watering_date column exists
      const { data: sampleRow } = await supabase
        .from('plants')
        .select('*')
        .limit(1);
        
      if (!sampleRow || sampleRow.length === 0) {
        setError('No plants found in database');
        return;
      }
      
      const columns = Object.keys(sampleRow[0]);
      if (!columns.includes('next_watering_date')) {
        setError("The 'next_watering_date' column doesn't exist in your plants table.");
        return;
      }
      
      // Get all plants
      console.log('Fetching plants from Supabase...');
      const { data: plants, error: fetchError } = await supabase
        .from('plants')
        .select('*')  // Select all columns to get current values
        .limit(100);
      
      if (fetchError) {
        console.error('Error fetching plants:', fetchError);
        setError('Database error while fetching plants');
        return;
      }
      
      if (!plants || plants.length === 0) {
        console.log('No plants found in database');
        setError('No plants found to update');
        return;
      }
      
      console.log(`Found ${plants.length} plants to update`);
      
      // Set next_watering_date to yesterday for all plants
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayISO = yesterday.toISOString();
      
      console.log(`Setting next_watering_date to ${yesterdayISO}`);
      
      // Update each plant individually
      let successCount = 0;
      
      for (const plant of plants) {
        try {
          // Prepare update data
          const updateData: any = { 
            next_watering_date: yesterdayISO
          };
          
          // If watering_frequency_days is not set, set it to a default value of 7 days
          if (!plant.watering_frequency_days) {
            updateData.watering_frequency_days = 7;
            console.log(`Setting watering_frequency_days to 7 for plant ${plant.id}`);
          }
          
          const { error: updateError } = await supabase
            .from('plants')
            .update(updateData)
            .eq('id', plant.id);
          
          if (updateError) {
            console.error(`Error updating plant ${plant.id}:`, updateError);
          } else {
            successCount++;
          }
        } catch (err) {
          console.error(`Exception updating plant ${plant.id}:`, err);
        }
      }
      
      if (successCount === 0) {
        setError('Failed to update any plants');
      } else {
        console.log(`Successfully updated ${successCount} plants`);
        router.refresh();
      }
    } catch (err) {
      console.error('Exception in simulatePlantsNeedWatering:', err);
      setError('An error occurred');
    } finally {
      setIsSimulating(false);
    }
  };

  // Alternative approach when the normal watering update fails
  const addMissingColumns = async () => {
    setDebugInfo("Database Schema Information\n");
    
    try {
      // Get column info
      const { data: sampleRow } = await supabase
        .from('plants')
        .select('*')
        .limit(1);
      
      if (!sampleRow || sampleRow.length === 0) {
        setDebugInfo("No plants found in database");
        return;
      }
      
      const columns = Object.keys(sampleRow[0]);
      setDebugInfo(`Current columns in plants table:\n${columns.join('\n')}\n\n`);
      
      // Check which required columns exist
      const hasNextWateringDate = columns.includes('next_watering_date');
      const hasLastWateredDate = columns.includes('last_watered_date');
      const hasWateringFrequency = columns.includes('watering_frequency_days');
      
      if (hasNextWateringDate && hasLastWateredDate && hasWateringFrequency) {
        setDebugInfo(`${debugInfo}Your database already has all required columns!\n\nIf you're experiencing issues, it might be related to permissions or data types.`);
      } else {
        // Build a list of missing columns
        const missingColumns = [];
        if (!hasNextWateringDate) missingColumns.push('next_watering_date (type: timestamptz, nullable: true)');
        if (!hasLastWateredDate) missingColumns.push('last_watered_date (type: timestamptz, nullable: true)');
        if (!hasWateringFrequency) missingColumns.push('watering_frequency_days (type: integer, nullable: true)');
        
        if (missingColumns.length > 0) {
          setDebugInfo(`${debugInfo}Missing columns that need to be added:\n${missingColumns.join('\n')}\n\nTo add these columns:\n1. Go to your Supabase dashboard\n2. Navigate to Table Editor\n3. Select the 'plants' table\n4. Click 'Add Column'\n5. Add each missing column with the specified type`);
        }
      }
    } catch (e) {
      setDebugInfo(`${debugInfo}Error checking schema: ${e}`);
    }
  };

  // Render the appropriate button based on condition
  if (plantsCount > 0) {
    return (
      <div className="flex flex-col">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={handleWaterAll}
          disabled={isWatering}
          className="text-blue-600 hover:bg-blue-100/80 dark:text-blue-400 dark:hover:bg-blue-900/30 flex items-center"
        >
          {isWatering ? (
            <div className="h-4 w-4 mr-1.5 animate-spin border-2 border-current border-t-transparent rounded-full" aria-hidden="true"/>
          ) : (
            <Droplets className="mr-1.5 h-4 w-4" aria-hidden="true" />
          )}
          <span>{isWatering ? "Watering..." : `Water All (${plantsCount})`}</span>
        </Button>
        {error && <p className="text-destructive text-xs mt-1">{error}</p>}
      </div>
    );
  }
  
  // For development mode only - simulate button
  if (process.env.NODE_ENV === 'development') {
    return (
      <div className="flex flex-col">
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={simulatePlantsNeedWatering}
            disabled={isSimulating}
            className="text-amber-600 border-amber-200 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-800/50 flex items-center"
          >
            {isSimulating ? (
              <div className="h-4 w-4 mr-1.5 animate-spin border-2 border-current border-t-transparent rounded-full" aria-hidden="true"/>
            ) : (
              <Droplets className="mr-1.5 h-4 w-4" aria-hidden="true" />
            )}
            <span>{isSimulating ? "Simulating..." : "Simulate Plants Need Water"}</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={checkDatabaseAccess}
            className="text-green-600 border-green-200 hover:bg-green-50 dark:text-green-400 dark:border-green-800/50"
          >
            Debug DB
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={addMissingColumns}
            className="text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800/50"
          >
            Show Fix
          </Button>
        </div>
        {error && <p className="text-destructive text-xs mt-1">{error}</p>}
        {debugInfo && (
          <div className="mt-2 p-2 text-xs bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 whitespace-pre-wrap">
            {debugInfo}
          </div>
        )}
      </div>
    );
  }
  
  // If no plants need watering and not in development, show a disabled button
  return (
    <div className="flex flex-col">
      <Button 
        variant="ghost" 
        size="sm"
        disabled
        className="text-gray-400 flex items-center opacity-70"
      >
        <Droplets className="mr-1.5 h-4 w-4" aria-hidden="true" />
        <span>No Plants Need Water</span>
      </Button>
      {error && <p className="text-destructive text-xs mt-1">{error}</p>}
    </div>
  );
} 