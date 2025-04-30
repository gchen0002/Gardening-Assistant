'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { format } from "date-fns";

// Import Shadcn components & icons
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle, Save, Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Plant } from '@/types/plant';

type EditPlantFormProps = {
  plant: Plant;
  onClose: () => void;
};

export default function EditPlantForm({ plant, onClose }: EditPlantFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<Plant>({
    id: plant.id,
    name: '',
    species: '',
    date_planted: null,
    notes: '',
    sunlight_needs: '',
    last_watered_date: null,
    watering_frequency_days: null,
    next_watering_date: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Initialize form with plant data when component mounts
  useEffect(() => {
    setFormData({
      id: plant.id,
      name: plant.name || '',
      species: plant.species || '',
      date_planted: plant.date_planted ? new Date(plant.date_planted) : null,
      notes: plant.notes || '',
      sunlight_needs: plant.sunlight_needs || '',
      last_watered_date: plant.last_watered_date ? new Date(plant.last_watered_date) : null,
      watering_frequency_days: plant.watering_frequency_days || null,
      next_watering_date: plant.next_watering_date ? new Date(plant.next_watering_date) : null,
    });
  }, [plant]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'watering_frequency_days') {
      const numValue = value === '' ? null : parseInt(value, 10);
      setFormData((prev: Plant) => ({ ...prev, [name]: numValue }));
    } else {
       setFormData((prev: Plant) => ({ ...prev, [name]: value }));
    }
  };

  const handleWateringFrequencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === '' ? null : parseInt(e.target.value, 10);
    
    setFormData((prev: Plant) => {
      const newData = { ...prev, watering_frequency_days: value };
      
      // Update next_watering_date if last_watered_date is set
      if (value && prev.last_watered_date) {
        const nextDate = new Date(prev.last_watered_date);
        nextDate.setDate(nextDate.getDate() + value);
        newData.next_watering_date = nextDate;
      } else {
        newData.next_watering_date = null;
      }
      
      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    if (!formData.name) {
      setError('Plant name is required.');
      setIsSubmitting(false);
      return;
    }

    const dataToUpdate = {
      name: formData.name,
      species: formData.species || null,
      notes: formData.notes || null,
      sunlight_needs: formData.sunlight_needs || null,
      date_planted: formData.date_planted?.toString().includes('T') 
        ? formData.date_planted 
        : formData.date_planted instanceof Date ? formData.date_planted.toISOString() : null,
      last_watered_date: formData.last_watered_date?.toString().includes('T') 
        ? formData.last_watered_date 
        : formData.last_watered_date instanceof Date ? formData.last_watered_date.toISOString() : null,
      watering_frequency_days: formData.watering_frequency_days,
      next_watering_date: formData.next_watering_date?.toString().includes('T')
        ? formData.next_watering_date
        : formData.next_watering_date instanceof Date ? formData.next_watering_date.toISOString() : null,
    };

    try {
      const { error: updateError } = await supabase
        .from('plants')
        .update(dataToUpdate)
        .eq('id', plant.id);
        
      if (updateError) throw updateError;
      
      setSuccessMessage(`Updated successfully!`);
      router.refresh();
      
      // Close the dialog after a successful update
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to update plant.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card style={{ backgroundColor: '#111827' }}>
       <CardHeader className="p-4 pb-2">
        <CardTitle className="text-lg font-semibold leading-none tracking-tight flex items-center gap-1.5">
          <Save className="h-5 w-5"/> 
          Edit {plant.name || 'Plant'}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 pb-2">
        <form onSubmit={handleSubmit} id="edit-plant-form" className="space-y-4 text-sm">
          {error && (
            <div className="flex items-center space-x-1 rounded-md border border-destructive/50 bg-destructive/10 p-1.5 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {successMessage && (
            <div className="flex items-center space-x-1 rounded-md border border-primary/50 bg-primary/10 p-1.5 text-xs text-primary">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4">
            <div className="flex flex-col space-y-1.5">
               <Label htmlFor="name" className="text-xs font-medium">Name*</Label>
              <Input 
                id="name" 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                required 
                className="h-8 text-xs"
              />
            </div>
            
            <div className="flex flex-col space-y-1.5">
               <Label htmlFor="species" className="text-xs font-medium">Species</Label>
              <Input 
                id="species" 
                name="species" 
                value={formData.species || ''} 
                onChange={handleChange} 
                className="h-8 text-xs"
              />
            </div>
            
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="date_planted" className="text-xs font-medium">Date Planted</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal h-8 text-xs",
                      !formData.date_planted && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                    {formData.date_planted ? format(formData.date_planted, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.date_planted instanceof Date ? formData.date_planted : undefined}
                    onSelect={(date: Date | undefined) => {
                       const selectedDate = date || null;
                       setFormData((prev: Plant) => ({ ...prev, date_planted: selectedDate }));
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
              
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="last_watered_date" className="text-xs font-medium">Last Watered</Label>
               <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal h-8 text-xs",
                      !formData.last_watered_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                    {formData.last_watered_date ? format(formData.last_watered_date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.last_watered_date instanceof Date ? formData.last_watered_date : undefined}
                    onSelect={(date: Date | undefined) => {
                      const selectedDate = date || null;
                       setFormData((prev: Plant) => {
                         const newData = { ...prev, last_watered_date: selectedDate };
                         // Recalculate next watering date
                         if (selectedDate && prev.watering_frequency_days) {
                           const nextDate = new Date(selectedDate);
                           nextDate.setDate(nextDate.getDate() + prev.watering_frequency_days);
                           newData.next_watering_date = nextDate;
                         } else {
                            newData.next_watering_date = null;
                         }
                         return newData;
                       });
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="watering_frequency_days" className="text-xs font-medium">Water Every (days)</Label>
              <Input 
                id="watering_frequency_days" 
                name="watering_frequency_days" 
                value={formData.watering_frequency_days || ''} 
                onChange={handleWateringFrequencyChange} 
                type="number" 
                min="1" 
                max="365" 
                placeholder="e.g., 7" 
                className="h-8 text-xs"
              />
            </div>

            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="sunlight_needs" className="text-xs font-medium">Sunlight</Label>
              <Input 
                id="sunlight_needs" 
                name="sunlight_needs" 
                value={formData.sunlight_needs || ''} 
                onChange={handleChange} 
                placeholder="e.g., Full Sun" 
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="flex flex-col space-y-1.5 pt-2">
            <Label htmlFor="notes" className="text-xs font-medium">Notes</Label>
            <Textarea 
              id="notes" 
              name="notes" 
              value={formData.notes || ''} 
              onChange={handleChange} 
              placeholder="Any extra details..." 
              rows={3} 
              className="resize-none text-xs"
            />
          </div>
        </form>
      </CardContent>
       <CardFooter className="p-4 pt-0">
          <Button 
            type="submit" 
            form="edit-plant-form" 
            disabled={isSubmitting} 
            className="w-full h-8 text-xs" 
            size="sm"
          >
            <Save className="mr-1.5 h-3.5 w-3.5" /> {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
          </Button>
      </CardFooter>
    </Card>
  );
} 