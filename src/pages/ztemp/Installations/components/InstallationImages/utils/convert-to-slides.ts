import { Installation } from "@/models/temp/installations.model";

export const convertToPhotos = (installations: Installation[]) => {
  return installations.map((installation) => {
    return {
      key: installation.id,
      src: installation.url,
      width: installation.width,
      height: installation.height,
      caption: installation.name,
    };
  });
};
