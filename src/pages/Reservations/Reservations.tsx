import { PageContainer } from "@/components/platform/PageContainer/PageContainer";
import { PRIVATE_ROUTES } from "@/constants/routes";
import { useTitle } from "@/hooks/useTitle";
import { getTitles } from "@/utils/getTitles";

function Reservations() {
    useTitle(getTitles(PRIVATE_ROUTES.RESERVATIONS));
  
  return (
    <PageContainer>
      <div className="flex items-center w-full gap-3">
        <h2 className="text-xl font-bold">Reservaciones</h2>
      </div>
    </PageContainer>
  );
}

export default Reservations;
