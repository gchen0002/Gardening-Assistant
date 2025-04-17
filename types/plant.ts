export type Plant = {
  id: number | string;
  name: string;
  species?: string | null;
  date_planted?: Date | string | null;
  notes?: string | null;
  sunlight_needs?: string | null;
  last_watered_date?: Date | string | null;
  watering_frequency_days?: number | null; // How often to water in days
  next_watering_date?: Date | string | null; // Calculated next watering date
}; 