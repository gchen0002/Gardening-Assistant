'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter
import { supabase } from '@/lib/supabaseClient';
import DatePicker from 'react-datepicker'; // Import DatePicker
import 'react-datepicker/dist/react-datepicker.css'; // Import CSS

type PlantFormData = {
  name: string;
  species: string;
  date_planted: Date | null;
  notes: string;
  sunlight_needs: string;
  last_watered_date: Date | null;
};

export default function AddPlantForm() {
  const router = useRouter(); // Initialize router
  const [formData, setFormData] = useState<PlantFormData>({
    name: '',
    species: '',
    date_planted: null,
    notes: '',
    sunlight_needs: '',
    last_watered_date: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateChange = (date: Date | null, fieldName: keyof PlantFormData) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: date,
    }));
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

    const dataToInsert = {
      name: formData.name,
      species: formData.species || null,
      notes: formData.notes || null,
      sunlight_needs: formData.sunlight_needs || null,
      date_planted: formData.date_planted ? formData.date_planted.toISOString() : null,
      last_watered_date: formData.last_watered_date ? formData.last_watered_date.toISOString() : null,
    };

    try {
      const { error: insertError } = await supabase
        .from('plants')
        .insert([dataToInsert]);

      if (insertError) {
        throw insertError;
      }

      setSuccessMessage(`Plant "${formData.name}" added successfully!`);
      setFormData({
        name: '',
        species: '',
        date_planted: null,
        notes: '',
        sunlight_needs: '',
        last_watered_date: null,
      });
      router.refresh();

    } catch (err: any) {
      console.error('Error inserting plant:', err);
      setError(err.message || 'Failed to add plant. Please try again.');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSuccessMessage(null), 5000);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-8 p-6 border rounded bg-white dark:bg-gray-900">
      <h3 className="text-xl font-semibold mb-4">Add New Plant</h3>
      {error && <p className="text-red-500 bg-red-100 dark:bg-red-900 p-2 rounded">Error: {error}</p>}
      {successMessage && <p className="text-green-500 bg-green-100 dark:bg-green-900 p-2 rounded">{successMessage}</p>}

      <div>
        <label htmlFor="name" className="block text-sm font-medium">Name *</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-600"
        />
      </div>
      <div>
        <label htmlFor="species" className="block text-sm font-medium">Species</label>
        <input
          type="text"
          id="species"
          name="species"
          value={formData.species}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-600"
        />
      </div>
      <div>
        <label htmlFor="date_planted" className="block text-sm font-medium">Date Planted</label>
        <DatePicker
          selected={formData.date_planted}
          onChange={(date) => handleDateChange(date, 'date_planted')}
          showTimeSelect
          dateFormat="MMMM d, yyyy h:mm aa"
          id="date_planted"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-600"
          wrapperClassName="w-full"
          placeholderText="Select date and time"
        />
      </div>
      <div>
        <label htmlFor="last_watered_date" className="block text-sm font-medium">Last Watered Date</label>
        <DatePicker
          selected={formData.last_watered_date}
          onChange={(date) => handleDateChange(date, 'last_watered_date')}
          showTimeSelect
          dateFormat="MMMM d, yyyy h:mm aa"
          id="last_watered_date"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-600"
          wrapperClassName="w-full"
          placeholderText="Select date and time"
        />
      </div>
      <div>
        <label htmlFor="sunlight_needs" className="block text-sm font-medium">Sunlight Needs</label>
        <input
          type="text"
          id="sunlight_needs"
          name="sunlight_needs"
          value={formData.sunlight_needs}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-600"
        />
      </div>
      <div>
        <label htmlFor="notes" className="block text-sm font-medium">Notes</label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-600"
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 dark:focus:ring-offset-gray-800"
      >
        {isSubmitting ? 'Adding...' : 'Add Plant'}
      </button>
    </form>
  );
} 