// api/gappers.js
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  try {
    // Read directly from the database (takes 0.01 seconds)
    const data = await kv.get('gappers_data');
    
    if (data) {
      const parsed = JSON.parse(data);
      res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=59');
      res.status(200).json({ data: parsed });
    } else {
      // If the background job hasn't run yet
      res.status(200).json({ data: [], error: 'Scanner is initializing. Please check back in 5 minutes.' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
