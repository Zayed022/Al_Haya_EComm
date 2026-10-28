import 'dotenv/config';
import app from './app.js';
import { connectDatabase } from './config/db.js';
const port = Number(process.env.PORT || 4000);
try {
  await connectDatabase();
  app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
} catch (error) {
  console.error('Unable to start API:', error.message);
  process.exit(1);
}
