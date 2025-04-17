'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// Import Shadcn components & icons
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle, Save } from 'lucide-react';

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
    setFormData((prev: Plant) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date: Date | null, fieldName: keyof Plant) => {
    setFormData((prev: Plant) => {
      const newData = { ...prev, [fieldName]: date };
      
      // If last_watered_date and watering_frequency_days are both set,
      // calculate the next_watering_date
      if (fieldName === 'last_watered_date' && date && newData.watering_frequency_days) {
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + newData.watering_frequency_days);
        newData.next_watering_date = nextDate;
      }
      
      return newData;
    });
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

  const inputClassName = "flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <form onSubmit={handleSubmit} className="space-y-2 py-0 text-sm">
      {error && (
        <div className="flex items-center space-x-1 rounded-md border border-destructive/50 bg-destructive/10 p-1.5 text-xs text-destructive">
          <AlertCircle className="h-3 w-3 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMessage && (
        <div className="flex items-center space-x-1 rounded-md border border-primary/50 bg-primary/10 p-1.5 text-xs text-primary">
          <CheckCircle className="h-3 w-3 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
      
      <div className="grid w-full items-center gap-1">
        <Label htmlFor="name" className="text-xs font-medium">Name*</Label>
        <Input id="name" name="name" value={formData.name} onChange={handleChange} required placeholder="e.g., Cherry Tomato" className="h-7 text-xs" />
      </div>
      <div className="grid w-full items-center gap-1">
        <Label htmlFor="species" className="text-xs font-medium">Species</Label>
        <Input id="species" name="species" value={formData.species || ''} onChange={handleChange} placeholder="e.g., Solanum lycopersicum" className="h-7 text-xs" />
      </div>
      <div className="grid grid-cols-2 gap-1">
        <div className="grid w-full items-center gap-1">
          <Label htmlFor="date_planted" className="text-xs font-medium">Date Planted</Label>
          <DatePicker
            selected={formData.date_planted instanceof Date ? formData.date_planted : null}
            onChange={(date) => handleDateChange(date, 'date_planted')}
            showTimeSelect
            dateFormat="MM/dd/yy"
            timeFormat="HH:mm"
            id="date_planted"
            className={inputClassName}
            wrapperClassName="w-full"
            placeholderText="MM/DD/YY"
            autoComplete="off"
          />
        </div>
        <div className="grid w-full items-center gap-1">
          <Label htmlFor="last_watered_date" className="text-xs font-medium">Last Watered</Label>
          <DatePicker
            selected={formData.last_watered_date instanceof Date ? formData.last_watered_date : null}
            onChange={(date) => handleDateChange(date, 'last_watered_date')}
            showTimeSelect
            dateFormat="MM/dd/yy"
            timeFormat="HH:mm"
            id="last_watered_date"
            className={inputClassName}
            wrapperClassName="w-full"
            placeholderText="MM/DD/YY"
            autoComplete="off"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-1">
        <div className="grid w-full items-center gap-1">
          <Label htmlFor="watering_frequency_days" className="text-xs font-medium">Water Every (days)</Label>
          <Input 
            id="watering_frequency_days" 
            name="watering_frequency_days" 
            value={formData.watering_frequency_days || ''} 
            onChange={handleWateringFrequencyChange} 
            type="number" 
            min="1" 
            max="365" 
            placeholder="7" 
            className="h-7 text-xs"
          />
        </div>
        <div className="grid w-full items-center gap-1">
          <Label htmlFor="sunlight_needs" className="text-xs font-medium">Sunlight</Label>
          <Input id="sunlight_needs" name="sunlight_needs" value={formData.sunlight_needs || ''} onChange={handleChange} placeholder="e.g., Full Sun" className="h-7 text-xs" />
        </div>
      </div>
      <div className="grid w-full items-center gap-1">
        <Label htmlFor="notes" className="text-xs font-medium">Notes</Label>
        <Textarea id="notes" name="notes" value={formData.notes || ''} onChange={handleChange} placeholder="Any extra details..." rows={2} className="resize-none text-xs min-h-0 h-14 py-1" />
      </div>
      
      <div className="flex justify-end space-x-1 pt-1">
        <Button type="button" variant="outline" onClick={onClose} size="sm" className="h-6 text-xs px-2">
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} size="sm" className="h-6 text-xs px-2">
          <Save className="mr-1 h-3 w-3" /> {isSubmitting ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </form>
  );
} 