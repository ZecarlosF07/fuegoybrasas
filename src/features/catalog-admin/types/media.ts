import type { z } from "zod";

import type { mediaJournalSchema } from "../services/media";

export type MediaJournal = z.infer<typeof mediaJournalSchema>;
