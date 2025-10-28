import { useEffect, useState } from "react";
import { AppConfig } from "@/models/appConfig.model";
import { useAuth } from "@/stores/auth.store";
import { getAppConfig } from "@/services/appConfig.service";
import { ResponseError } from "@/models/responseError.model";
import { toast } from "sonner";
import ConfigurationEditForm from "./components/ConfigurationEditForm";

function ConfigurationEditContent() {
  const [loading, setLoading] = useState(false);
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);

  const token = useAuth((state) => state.token);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const config = await getAppConfig(token!);
        setAppConfig(config);
      } catch (error) {
        if (error instanceof ResponseError) return toast.error(error.message);
        toast.error("Ha ocurrido un error inesperado");
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      fetchData();
    }
  }, [token]);

  return (
    <>
    
      {!loading && appConfig && (
        <ConfigurationEditForm configuration={appConfig} />
      )}

      {loading && <div>Loading...</div>}
    </>
  );
}

export default ConfigurationEditContent;
