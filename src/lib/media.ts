export const imageSections = ["banners", "productos", "categorias", "inicio", "ofertas", "marca", "instagram"] as const;
export type ImageSection = (typeof imageSections)[number];
