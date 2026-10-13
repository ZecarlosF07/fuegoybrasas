import type { Pool } from "pg";

export type BackupFixture = { name: string; archive: string; pool: Pool };
