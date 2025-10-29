import * as z from "zod";

export const AppConfigSchema = z.object({
  cleaningStartOffsetMinutes: z
    .number()
    .int({
      message: "Debe ser un número entero",
    })
    .min(0),
  cleaningDurationMinutes: z
    .number()
    .int({
      message: "Debe ser un número entero",
    })
    .min(0),
});
