import { supabase } from "@/lib/supabaseClient";
import AddPlantForm from "@/components/AddPlantForm";

export default async function Home() {
  // Fetch data from Supabase
  const { data: plants, error } = await supabase
    .from('plants') // Your table name
    .select('*'); // Select all columns

  if (error) {
    console.error("Error fetching plants:", error);
    // Optionally render an error message to the user
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <h1 className="text-4xl font-bold mb-8">Gardening Assistant</h1>

      <div className="w-full max-w-2xl">
        <h2 className="text-2xl font-semibold mb-4">My Plants</h2>
        {error && <p className="text-red-500">Could not fetch plants.</p>}
        {plants && plants.length > 0 ? (
          <ul className="space-y-2">
            {plants.map((plant) => (
              <li key={plant.id} className="p-4 border rounded bg-gray-50 dark:bg-gray-800 block">
                <h3 className="text-lg font-semibold">{plant.name}</h3>
                {plant.species && <p className="text-sm text-gray-600 dark:text-gray-400">Species: {plant.species}</p>}
                {plant.date_planted && <p className="text-sm text-gray-600 dark:text-gray-400">Planted: {new Date(plant.date_planted).toLocaleDateString()}</p>}
                {plant.sunlight_needs && <p className="text-sm text-gray-600 dark:text-gray-400">Sunlight: {plant.sunlight_needs}</p>}
                {plant.last_watered_date && <p className="text-sm text-gray-600 dark:text-gray-400">Last Watered: {new Date(plant.last_watered_date).toLocaleString()}</p>}
                {plant.notes && <p className="text-sm mt-2">Notes: {plant.notes}</p>}
              </li>
            ))}
          </ul>
        ) : (
          !error && <p>No plants added yet.</p>
        )}
        <AddPlantForm />
      </div>
    </main>
  );
} 