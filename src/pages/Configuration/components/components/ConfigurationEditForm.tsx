import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
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
      toast.error("Ha ocurrido un error inesperado");
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
              <FormLabel>Offset de inicio de limpieza (minutos)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  value={field.value.toString()}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  placeholder="Offset de inicio de limpieza en minutos"
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
              <FormLabel>Duración de limpieza (minutos)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  value={field.value.toString()}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  placeholder="Duración de limpieza en minutos"
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
