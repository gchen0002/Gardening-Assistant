'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

// Define the expected structure of the plant prop
type Plant = {
  id: number | string; // Assuming id is number or string based on your Supabase setup
  name: string;
  species?: string | null;
  date_planted?: string | null;
  notes?: string | null;
  sunlight_needs?: string | null;
  last_watered_date?: string | null;
  // Add other fields from your plants table as needed
};

interface PlantListItemProps {
  plant: Plant;
}

export default function PlantListItem({ plant }: PlantListItemProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    console.log('[handleDelete] Initiated for plant ID:', plant.id); // Log start

    // Simple confirmation before deleting
    if (!window.confirm(`Are you sure you want to delete "${plant.name}"?`)) {
      console.log('[handleDelete] Deletion cancelled by user.'); // Log cancellation
      return;
    }

    console.log('[handleDelete] Proceeding with delete for ID:', plant.id);
    setIsDeleting(true);
    setError(null);

    try {
      console.log('[handleDelete] Calling supabase.delete for ID:', plant.id);
      const { error: deleteError } = await supabase
        .from('plants')
        .delete()
        .match({ id: plant.id }); // Match the specific plant ID

      if (deleteError) {
        console.error('[handleDelete] Supabase delete error object:', deleteError);
        throw deleteError;
      }

      console.log('[handleDelete] Deletion successful for ID:', plant.id);
      // Refresh the page data to reflect the deletion
      router.refresh();

    } catch (err: any) {
      console.error('[handleDelete] Error caught during delete:', err);
      setError(err.message || 'Failed to delete plant.');
      // Optional: Clear error after a delay
      setTimeout(() => setError(null), 5000);
    } finally {
      console.log('[handleDelete] Finished for ID:', plant.id);
      setIsDeleting(false);
    }
  };

  const handleEdit = () => {
    // TODO: Implement edit functionality (e.g., show modal, navigate to edit page)
    console.log('Edit plant:', plant.id);
    alert('Edit functionality not implemented yet.');
  };

  return (
    <li className="p-4 border rounded bg-gray-50 dark:bg-gray-800 block">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold">{plant.name}</h3>
          {plant.species && <p className="text-sm text-gray-600 dark:text-gray-400">Species: {plant.species}</p>}
          {plant.date_planted && <p className="text-sm text-gray-600 dark:text-gray-400">Planted: {new Date(plant.date_planted).toLocaleDateString()}</p>}
          {plant.sunlight_needs && <p className="text-sm text-gray-600 dark:text-gray-400">Sunlight: {plant.sunlight_needs}</p>}
          {plant.last_watered_date && <p className="text-sm text-gray-600 dark:text-gray-400">Last Watered: {new Date(plant.last_watered_date).toLocaleString()}</p>}
          {plant.notes && <p className="text-sm mt-2">Notes: {plant.notes}</p>}
          {error && <p className="text-red-500 text-xs mt-2">Error: {error}</p>}
        </div>
        <div className="flex flex-col space-y-2 ml-4">
          <button
            onClick={handleEdit}
            className="px-3 py-1 text-sm font-medium text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-3 py-1 text-sm font-medium text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 disabled:opacity-50"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </li>
  );
} 