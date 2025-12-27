import { PageContainer } from "@/components/platform/PageContainer/PageContainer";
import { PRIVATE_ROUTES } from "@/constants/routes";
import { useTitle } from "@/hooks/useTitle";
import { getTitles } from "@/utils/getTitles";
import ConfigurationEditContent from "./components/ConfigurationEditContent";

function Configuration() {
    useTitle(getTitles(PRIVATE_ROUTES.SETTINGS));

  return (
    <PageContainer>
      <div className="flex items-center w-full gap-3">
        <h2 className="text-xl font-bold">Configuración</h2>
      </div>

      <ConfigurationEditContent />
    </PageContainer>
  );
}

export default Configuration