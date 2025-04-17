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
      // 1. Check if we can read the plants table
      const { data: tableCheck, error: tableError } = await supabase
        .from('plants')
        .select('count()')
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
      setDebugInfo(`Available columns: ${columns}`);
      
      // 4. Try a non-destructive update to test write permissions
      const testId = sampleRow[0].id;
      const currentValue = sampleRow[0].next_watering_date;
      
      const { error: updateTestError } = await supabase
        .from('plants')
        .update({ next_watering_date: currentValue })
        .eq('id', testId);
        
      if (updateTestError) {
        setDebugInfo(`${debugInfo}\nUpdate test failed: ${updateTestError.message}`);
        return;
      }
      
      setDebugInfo(`${debugInfo}\nDatabase access seems OK!`);
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
      // First check if we can get any plants
      console.log('Fetching plants from Supabase...');
      
      const fetchResult = await supabase
        .from('plants')
        .select('id')
        .limit(100);
      
      // Access data and error separately to avoid type issues
      const plants = fetchResult.data;
      const fetchError = fetchResult.error;

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

      // Update each plant individually for better error handling
      let successCount = 0;
      let updateErrors = [];
      
      for (const plant of plants) {
        try {
          const updateResult = await supabase
            .from('plants')
            .update({ next_watering_date: yesterdayISO })
            .eq('id', plant.id);
          
          if (updateResult.error) {
            // Log the complete error details
            console.error(`Error updating plant ${plant.id}:`, JSON.stringify(updateResult.error, null, 2));
            console.error(`Error code: ${updateResult.error.code}, Message: ${updateResult.error.message}`);
            console.error(`Details: ${updateResult.error.details}`);
            updateErrors.push(plant.id);
          } else {
            successCount++;
          }
        } catch (updateErr) {
          console.error(`Exception updating plant ${plant.id}:`, updateErr);
          updateErrors.push(plant.id);
        }
      }

      // If individual updates failed, try a simpler approach as fallback
      if (successCount === 0 && updateErrors.length > 0) {
        console.log("All individual updates failed, trying a simpler batch approach...");
        
        try {
          // First check database schema
          const { data: schemaInfo, error: schemaError } = await supabase
            .from('plants')
            .select('id, next_watering_date')
            .limit(1);
            
          console.log("Database schema check:", schemaInfo, schemaError);
          
          // Try a very simple update
          const simplePlant = plants[0];
          
          // Try updating with a simple query and minimal data
          const simpleUpdate = await supabase
            .from('plants')
            .update({ 
              next_watering_date: yesterdayISO 
            })
            .eq('id', simplePlant.id)
            .select();
            
          console.log("Simple update result:", simpleUpdate);
          
          if (!simpleUpdate.error) {
            successCount = 1;
            console.log("Simple update succeeded for one plant!");
            router.refresh();
          } else {
            setError(`Database error: ${simpleUpdate.error.message}`);
          }
        } catch (e) {
          console.error("Fallback update failed:", e);
          setError("Database operation failed. Please check console for details.");
        }
      } else if (successCount > 0) {
        // Only refresh if at least one plant was updated
        router.refresh();
      }
    } catch (err) {
      console.error('Exception in simulatePlantsNeedWatering:');
      setError('Unknown error occurred');
    } finally {
      setIsSimulating(false);
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