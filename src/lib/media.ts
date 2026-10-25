export const imageSections = ["banners", "productos", "categorias", "ofertas", "marca", "instagram"] as const;
export type ImageSection = (typeof imageSections)[number];
