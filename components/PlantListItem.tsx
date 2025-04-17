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
import { Leaf, CalendarDays, Droplets, Sun, BookText, Trash2, Pencil, AlertTriangle, Clock } from 'lucide-react';
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
  const [isWateringPlant, setIsWateringPlant] = useState(false);

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

  const handleWaterPlant = async () => {
    setIsWateringPlant(true);
    setError(null);

    try {
      const now = new Date();
      let nextWateringDate = null;
      
      // Calculate next watering date if frequency is set
      if (plant.watering_frequency_days) {
        nextWateringDate = new Date(now);
        nextWateringDate.setDate(now.getDate() + plant.watering_frequency_days);
      }

      const { error: updateError } = await supabase
        .from('plants')
        .update({
          last_watered_date: now.toISOString(),
          next_watering_date: nextWateringDate ? nextWateringDate.toISOString() : null
        })
        .eq('id', plant.id);

      if (updateError) throw updateError;
      
      // Refresh the page to show updated data
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to update watering date.');
    } finally {
      setIsWateringPlant(false);
    }
  };

  // Format dates nicely
  const plantedDate = plant.date_planted ? new Date(plant.date_planted).toLocaleDateString() : 'N/A';
  const lastWatered = plant.last_watered_date ? new Date(plant.last_watered_date).toLocaleString() : 'N/A';
  const nextWatering = plant.next_watering_date ? new Date(plant.next_watering_date) : null;

  // Check if plant needs watering
  const needsWatering = nextWatering && new Date() >= nextWatering;

  // Format next watering date
  const nextWateringFormatted = nextWatering 
    ? nextWatering.toLocaleDateString() 
    : plant.watering_frequency_days 
      ? 'Not set yet' 
      : 'No schedule';

  // Days overdue calculation
  const daysOverdue = nextWatering && needsWatering 
    ? Math.floor((new Date().getTime() - nextWatering.getTime()) / (1000 * 3600 * 24)) 
    : 0;

  return (
    <>
      <div className="relative">
        <AccordionItem 
          value={`item-${plant.id}`} 
          className={`border-b-0 rounded-lg overflow-hidden ${
            needsWatering 
              ? 'bg-amber-100/70 dark:bg-amber-900/30 shadow-sm hover:shadow-md transition-shadow duration-200' 
              : 'bg-card/50 dark:bg-card/80 shadow-sm hover:shadow-md transition-shadow duration-200'
          }`}
        >
          <div className="flex items-center justify-between pr-4">
            <AccordionTrigger className="flex-1 px-4 py-2 hover:no-underline hover:bg-muted/10">
              <div className="flex-grow truncate pr-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-lg font-medium truncate">{plant.name}</span>
                  {needsWatering && (
                    <span className="flex items-center text-xs px-1.5 py-0.5 rounded bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200">
                      <Droplets className="h-3 w-3 mr-0.5" /> 
                      Water now{daysOverdue > 0 ? ` (${daysOverdue}d late)` : ''}
                    </span>
                  )}
                </div>
                {plant.species && <CardDescription className="text-sm text-muted-foreground truncate">Species: {plant.species}</CardDescription>}
              </div>
            </AccordionTrigger>
            
            {/* Action buttons completely outside the trigger */}
            <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
              {needsWatering && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={(e) => {
                    // Stop event to prevent accordion toggle
                    e.stopPropagation();
                    handleWaterPlant();
                  }} 
                  disabled={isWateringPlant}
                  aria-label="Water plant"
                  className="text-blue-600 hover:bg-blue-100/80 dark:text-blue-400 dark:hover:bg-blue-900/30 h-8 w-8"
                >
                  {isWateringPlant ? (
                    <div className="h-4 w-4 animate-spin border-2 border-current border-t-transparent rounded-full" aria-hidden="true"/>
                  ) : (
                    <Droplets className="h-4 w-4" aria-hidden="true" />
                  )}
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={(e) => {
                  // Stop event to prevent accordion toggle
                  e.stopPropagation();
                  handleEdit();
                }} 
                aria-label="Edit" 
                className="h-8 w-8"
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button 
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  // Stop event to prevent accordion toggle
                  e.stopPropagation();
                  handleDelete();
                }} 
                disabled={isDeleting}
                aria-label="Delete"
                className="text-destructive hover:bg-destructive/10 h-8 w-8"
              >
                {isDeleting ? <div className="h-4 w-4 animate-spin border-2 border-current border-t-transparent rounded-full" aria-hidden="true"/> : <Trash2 className="h-4 w-4" aria-hidden="true" />}
              </Button>
            </div>
          </div>
          
          <AccordionContent className="text-sm px-4 pt-2 pb-4 bg-card/30 dark:bg-card/50">
            <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 items-center">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <span>Planted: {plantedDate}</span>

              <Droplets className="h-4 w-4 text-muted-foreground" />
              <span>Last Watered: {lastWatered}</span>

              {plant.watering_frequency_days && (
                <>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Water every {plant.watering_frequency_days} day{plant.watering_frequency_days !== 1 ? 's' : ''}</span>
                  
                  <AlertTriangle className={`h-4 w-4 ${needsWatering ? 'text-amber-500' : 'text-muted-foreground'}`} />
                  <span className={needsWatering ? 'text-amber-700 dark:text-amber-400 font-medium' : ''}>
                    Next watering: {nextWateringFormatted}
                    {needsWatering && ` (${daysOverdue > 0 ? `${daysOverdue} days overdue` : 'today'})`}
                  </span>
                </>
              )}

              {plant.sunlight_needs && (
                <>
                  <Sun className="h-4 w-4 text-muted-foreground" />
                  <span>Sunlight: {plant.sunlight_needs}</span>
                </>
              )}
            </div>
            
            {/* Debug button in development mode to make plant need water */}
            {process.env.NODE_ENV === 'development' && !needsWatering && plant.watering_frequency_days && (
              <div className="mt-3 pt-2 border-t border-border">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      const yesterday = new Date();
                      yesterday.setDate(yesterday.getDate() - 1);
                      
                      await supabase
                        .from('plants')
                        .update({ next_watering_date: yesterday.toISOString() })
                        .eq('id', plant.id);
                      
                      router.refresh();
                    } catch (err) {
                      console.error('Error setting plant to need water:', err);
                    }
                  }}
                  className="text-xs w-full text-amber-600 border-amber-200 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-800/50"
                >
                  <Droplets className="mr-1.5 h-3 w-3" aria-hidden="true" />
                  Debug: Make Plant Need Water
                </Button>
              </div>
            )}
            
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
      </div>

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