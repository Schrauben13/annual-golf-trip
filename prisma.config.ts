console.log("VERCEL DB HOST:", process.env.DATABASE_URL?.split("@")[1]?.split("/")[0]);
import 'dotenv/config'
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
