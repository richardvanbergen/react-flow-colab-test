import { z } from 'zod';

export const outputSchema = z.object({
  output: z.string(),
});
