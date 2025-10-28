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
import { updateAppConfig } from "@/services/appConfig.service";
import { useAuth } from "@/stores/auth.store";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

interface ConfigurationEditFormProps {
  configuration: AppConfig;
}

function ConfigurationEditForm({ configuration }: ConfigurationEditFormProps) {
  const token = useAuth((state) => state.token);

  const form = useForm<z.infer<typeof AppConfigSchema>>({
    resolver: zodResolver(AppConfigSchema),
    defaultValues: {
      cleaningStartOffsetMinutes: configuration.cleaningStartOffsetMinutes,
    },
  });

  const onSubmit = async (values: z.infer<typeof AppConfigSchema>) => {
    try {
      await updateAppConfig(values, token!);
      toast.success("Configuración actualizada correctamente");
    } catch (error) {
      if (error instanceof ResponseError) return toast.error(error.message);
      toast.error("Ha ocurrido un error inesperado");
    }
  };

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
