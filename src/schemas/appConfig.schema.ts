import * as z from "zod";

export const AppConfigSchema = z
  .object({
    cleaningStartOffsetMinutes: z
      .number()
      .int({
        message: "Debe ser un número entero",
      })
      .min(1, { message: "La duración mínima es de 1 minuto" }),
    cleaningDurationMinutes: z
      .number()
      .int({
        message: "Debe ser un número entero",
      })
      .min(1, { message: "La duración mínima es de 1 minuto" }),
    cleaningVerificationFrequencyMinutes: z
      .number()
      .int({
        message: "Debe ser un número entero",
      })
      .min(1, { message: "El valor mínimo es de 1 minuto" }),
    cleaningLookAheadMinutes: z
      .number()
      .int({
        message: "Debe ser un número entero",
      })
      .min(5, { message: "El valor mínimo es de 5 minutos" }),
  })
  .superRefine((data, ctx) => {
    if (
      data.cleaningLookAheadMinutes < data.cleaningVerificationFrequencyMinutes
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["cleaningLookAheadMinutes"],
        message:
          "Debe ser mayor o igual a la frecuencia de verificación de desinfección",
      });
    }
  });
