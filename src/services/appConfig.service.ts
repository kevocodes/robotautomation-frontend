import { AppConfig } from "@/models/appConfig.model";
import { ResponseError } from "@/models/responseError.model";
import { AppConfigSchema } from "@/schemas/appConfig.schema";
import * as z from "zod";
const BASE_URL = import.meta.env.VITE_API_URL;

export const getAppConfig = async (token: string): Promise<AppConfig> => {
  const response = await fetch(`${BASE_URL}/app-config`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new ResponseError(
      "Error al obtener la configuración de la aplicación",
      response.status
    );
  }

  const { data } = await response.json();

  return data;
};

export const updateAppConfig = async (
  config: z.infer<typeof AppConfigSchema>,
  token: string
): Promise<AppConfig> => {
  const response = await fetch(`${BASE_URL}/app-config`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    throw new ResponseError(
      "Error al actualizar la configuración de la aplicación",
      response.status
    );
  }

  const { data } = await response.json();

  return data;
};
