'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Button } from "@/components/ui/button";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CardDescription } from "@/components/ui/card";
import { Leaf, CalendarDays, Droplets, Sun, BookText, Trash2, Pencil } from 'lucide-react';
import EditPlantForm from './EditPlantForm';
import { Plant } from '@/types/plant';

interface PlantListItemProps {
  plant: Plant;
}

export default function PlantListItem({ plant }: PlantListItemProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
  };

  // Format dates nicely
  const plantedDate = plant.date_planted ? new Date(plant.date_planted).toLocaleDateString() : 'N/A';
  const lastWatered = plant.last_watered_date ? new Date(plant.last_watered_date).toLocaleString() : 'N/A';

  return (
    <>
      <AccordionItem value={`item-${plant.id}`} className="border-b-0 rounded-lg overflow-hidden bg-card/50 dark:bg-card/80 shadow-sm hover:shadow-md transition-shadow duration-200">
        <AccordionTrigger className="flex justify-between items-center w-full px-4 py-2 hover:no-underline hover:bg-muted/10">
          <div className="flex-grow text-left mr-2">
            <span className="text-lg font-medium">{plant.name}</span>
            {plant.species && <CardDescription className="text-sm text-muted-foreground">Species: {plant.species}</CardDescription>}
          </div>
          <div className="flex space-x-1 flex-shrink-0">
            <Button variant="ghost" size="icon" onClick={(e) => {e.stopPropagation(); handleEdit();}} aria-label="Edit">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost"
              size="icon"
              onClick={(e) => {e.stopPropagation(); handleDelete();}} 
              disabled={isDeleting}
              aria-label="Delete"
              className="text-destructive hover:bg-destructive/10"
            >
              {isDeleting ? <span className="h-4 w-4 animate-spin border-2 border-current border-t-transparent rounded-full"/> : <Trash2 className="h-4 w-4" />}
            </Button>
          </div>
        </AccordionTrigger>
        <AccordionContent className="text-sm px-4 pt-2 pb-4 bg-card/30 dark:bg-card/50">
          <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 items-center">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <span>Planted: {plantedDate}</span>

            <Droplets className="h-4 w-4 text-muted-foreground" />
            <span>Last Watered: {lastWatered}</span>

            {plant.sunlight_needs && (
              <>
                <Sun className="h-4 w-4 text-muted-foreground" />
                <span>Sunlight: {plant.sunlight_needs}</span>
              </>
            )}
          </div>
          {plant.notes && (
            <div className="mt-3 pt-3 space-y-1">
              <div className="flex items-center space-x-2">
                <BookText className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium">Notes:</p>
              </div>
              <p className="text-muted-foreground pl-6">{plant.notes}</p>
            </div>
          )}
          {error && <p className="text-destructive text-xs mt-2">Error: {error}</p>}
        </AccordionContent>
      </AccordionItem>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="text-center w-full bg-secondary/30 text-secondary-foreground py-1 rounded-sm text-xs font-medium mb-1">
              EDIT PLANT
            </div>
            <DialogTitle className="text-primary flex items-center gap-1">
              <Pencil className="h-3.5 w-3.5"/>
              <span className="truncate">{plant.name}</span>
            </DialogTitle>
          </DialogHeader>
          <EditPlantForm plant={plant} onClose={closeDialog} />
        </DialogContent>
      </Dialog>
    </>
  );
} 