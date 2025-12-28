import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { AppConfig } from "@/models/appConfig.model";
import { ResponseError } from "@/models/responseError.model";
import { AppConfigSchema } from "@/schemas/appConfig.schema";
import { getAppConfig, updateAppConfig } from "@/services/appConfig.service";
import { useAuth } from "@/stores/auth.store";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

function ConfigurationEditForm() {
  const [loading, setLoading] = useState(false);
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);

  const token = useAuth((state) => state.token);

  const form = useForm<z.infer<typeof AppConfigSchema>>({
    resolver: zodResolver(AppConfigSchema),
  });

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const config = await getAppConfig(token!);
        setAppConfig(config);
        form.reset(config);
      } catch (error) {
        if (error instanceof ResponseError) return toast.error(error.message);
        toast.error(
          "Ha ocurrido un error inesperado al cargar la configuración"
        );
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      fetchData();
    }
  }, [form, token]);

  const onSubmit = async (values: z.infer<typeof AppConfigSchema>) => {
    try {
      await updateAppConfig(values, token!);
      toast.success("Configuración actualizada correctamente");
    } catch (error) {
      if (error instanceof ResponseError) return toast.error(error.message);
      return toast.error("Ha ocurrido un error inesperado");
    }
  };

  if (loading || !appConfig) {
    return <ConfigurationEditForm.skeleton />;
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8 bg-background w-full p-8 rounded-lg"
      >
        <FormField
          control={form.control}
          name="cleaningStartOffsetMinutes"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel>Anticipación antes del evento (minutos)</FormLabel>
              <FormDescription>
                Cuántos minutos antes del inicio de la reservación debe comenzar
                la desinfección.
              </FormDescription>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  value={field.value.toString()}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  placeholder="Offset de inicio de desinfección en minutos"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cleaningDurationMinutes"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel>Duración de desinfección (minutos)</FormLabel>
              <FormDescription>
                Tiempo que se estima que el robot tardará en limpiar el recurso.
              </FormDescription>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  value={field.value.toString()}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  placeholder="Duración de desinfección en minutos"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cleaningVerificationFrequencyMinutes"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel>Frecuencia de verificación (minutos)</FormLabel>
              <FormDescription>
                Cada cuántos minutos el sistema revisa nuevas desinfeccións
                pendientes.
              </FormDescription>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  value={field.value.toString()}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  placeholder="Frecuencia de verificación en minutos"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cleaningLookAheadMinutes"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel>Ventana de anticipación (minutos)</FormLabel>
              <FormDescription>
                Cuántos minutos hacia adelante se buscan eventos de desinfección en
                cada verificación.
              </FormDescription>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  value={field.value.toString()}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  placeholder="Frecuencia de verificación en minutos"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2">
          <Button type="submit" className="w-full">
            {form.formState.isSubmitting && (
              <LoaderCircle size={16} className="animate-spin mr-2" />
            )}
            Actualizar Configuración
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default ConfigurationEditForm;

ConfigurationEditForm.skeleton = function ConfigurationEditFormSkeleton() {
  return (
    <div className="space-y-8 bg-background w-full p-8 rounded-lg animate-pulse">
      <div className="flex flex-col gap-2">
        <div className="h-5 w-1/3 bg-muted rounded"></div>
        <div className="h-10 w-full bg-muted rounded"></div>
      </div>

      <div className="flex gap-2">
        <div className="h-10 w-full bg-muted rounded"></div>
      </div>
    </div>
  );
};
