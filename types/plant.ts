export type Plant = {
  id: number | string;
  name: string;
  species?: string | null;
  date_planted?: Date | string | null;
  notes?: string | null;
  sunlight_needs?: string | null;
  last_watered_date?: Date | string | null;
}; 