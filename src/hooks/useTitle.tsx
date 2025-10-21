import { useEffect } from "react";

const DEFAULT_TITLE = "Robot Automation UCA";

export function useTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} | ${DEFAULT_TITLE}` : DEFAULT_TITLE;
  }, [title]);
}
