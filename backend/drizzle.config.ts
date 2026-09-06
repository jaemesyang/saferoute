import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

const databaseUrl = new URL(process.env.DATABASE_URL!);
if (databaseUrl.port === '6543') databaseUrl.port = '5432';
databaseUrl.searchParams.set('sslmode', 'require');

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl.toString(),
  },
});
