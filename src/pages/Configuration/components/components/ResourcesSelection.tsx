import { Accordion, AccordionTrigger } from "@/components/ui/accordion";
import { Resource } from "@/models/resources.model";
import { ResponseError } from "@/models/responseError.model";
import { getResources } from "@/services/resources.service";
import { useAuth } from "@/stores/auth.store";
import { AccordionContent, AccordionItem } from "@radix-ui/react-accordion";
import { useEffect, useState } from "react";
import { toast } from "sonner";

function ResourcesSelection() {
  const [Resources, setResources] = useState<Resource[]>([]);
  const [isLoadingResources, setIsLoadingResources] = useState<boolean>(false);

  const token = useAuth((state) => state.token);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        setIsLoadingResources(true);
        const response = await getResources(token!);
        setResources(response);
      } catch (error) {
        if (error instanceof ResponseError) return toast.error(error.message);
        toast.error("Ha ocurrido un error inesperado al cargar los recursos");
      } finally {
        setIsLoadingResources(false);
      }
    };

    if (token) {
      fetchResources();
    }
  }, [token]);

  return (
    <Accordion type="single" collapsible className="w-full" defaultValue="resources-selection" >
      <AccordionItem value="resources-selection">
        <AccordionTrigger className="bg-white p-8 rounded-t-lg">
          Selección de Recursos
        </AccordionTrigger>
        <AccordionContent className="bg-white px-8 pb-8 rounded-b-lg flex flex-col gap-4">
          
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

export default ResourcesSelection;
