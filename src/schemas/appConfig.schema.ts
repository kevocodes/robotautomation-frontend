import * as z from "zod";

export const AppConfigSchema = z.object({
  cleaningStartOffsetMinutes: z
    .number()
    .int({
      message: "Debe ser un número entero",
    })
    .min(5, { message: "La duración mínima es de 5 minutos" }),
  cleaningDurationMinutes: z
    .number()
    .int({
      message: "Debe ser un número entero",
    })
    .min(5, { message: "La duración mínima es de 5 minutos" }),
});
