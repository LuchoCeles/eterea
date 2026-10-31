export const imageSections = ["banners", "productos", "categorias", "inicio", "ofertas", "marca"] as const;
export type ImageSection = (typeof imageSections)[number];
