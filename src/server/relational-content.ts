import type { Prisma } from "@/generated/prisma/client";
import { resolveContent, type ContentKey, type ContentSnapshot, type Slide, type TextSectionKey, type Texts } from "@/lib/content";
import type { CropSettings } from "@/lib/image-presentation";

type ContentDb = Pick<Prisma.TransactionClient,
  "contentSection" | "contactSettings" | "offerSettings" | "homeSectionSetting" |
  "splitBanner" | "clubBanner" | "editorialBanner" | "promoLine" | "heroSlide" |
  "benefit" | "marqueeLine" | "curatedInstagramPost">;

function savedHeroSettings(zoom: number | null, x: number | null, y: number | null,
  width: number | null, height: number | null): CropSettings | undefined {
  return zoom !== null && x !== null && y !== null && width !== null && height !== null
    ? { zoom, x, y, width, height } : undefined;
}

export function heroSlideColumns(slide: Slide) {
  return {
    img: slide.img, productId: slide.productId ?? null, kicker: slide.kicker,
    title: slide.title, cta: slide.cta, promo: slide.promo, align: slide.align,
    desktopZoom: slide.desktopSettings?.zoom ?? null,
    desktopX: slide.desktopSettings?.x ?? null,
    desktopY: slide.desktopSettings?.y ?? null,
    desktopWidth: slide.desktopSettings?.width ?? null,
    desktopHeight: slide.desktopSettings?.height ?? null,
    mobileZoom: slide.mobileSettings?.zoom ?? null,
    mobileX: slide.mobileSettings?.x ?? null,
    mobileY: slide.mobileSettings?.y ?? null,
    mobileWidth: slide.mobileSettings?.width ?? null,
    mobileHeight: slide.mobileSettings?.height ?? null,
  };
}

export async function updateRelationalHeroSlide(db: Pick<ContentDb, "heroSlide">, index: number, slide: Slide) {
  const rows = await db.heroSlide.findMany({
    orderBy: [{ position: "asc" }, { id: "asc" }], select: { id: true, img: true },
  });
  const row = rows[index];
  if (!row || slide.id !== row.id) return null;
  await db.heroSlide.update({ where: { id: row.id }, data: heroSlideColumns(slide) });
  return row.img;
}

export async function loadRelationalContentWithSections(db: ContentDb) {
  const sections = await db.contentSection.findMany({ select: { key: true } });
  const saved = new Set(sections.map((section) => section.key));
  const [contact, offers, home, split, club, editorial, promo, hero, benefits, marquee, instagram] = await Promise.all([
    saved.has("contact") ? db.contactSettings.findUnique({ where: { id: 1 } }) : null,
    saved.has("texts") || saved.has("offers") ? db.offerSettings.findUnique({ where: { id: 1 } }) : null,
    saved.has("homeSections") ? db.homeSectionSetting.findMany() : [],
    saved.has("split") ? db.splitBanner.findUnique({ where: { id: 1 } }) : null,
    saved.has("club") ? db.clubBanner.findUnique({ where: { id: 1 } }) : null,
    saved.has("editorial") ? db.editorialBanner.findUnique({ where: { id: 1 } }) : null,
    saved.has("promo") ? db.promoLine.findMany({ orderBy: [{ position: "asc" }, { id: "asc" }] }) : [],
    saved.has("hero") ? db.heroSlide.findMany({ orderBy: [{ position: "asc" }, { id: "asc" }] }) : [],
    saved.has("benefits") ? db.benefit.findMany({ orderBy: [{ position: "asc" }, { id: "asc" }] }) : [],
    saved.has("marquee") ? db.marqueeLine.findMany({ orderBy: [{ position: "asc" }, { id: "asc" }] }) : [],
    saved.has("instagram") ? db.curatedInstagramPost.findMany({ orderBy: [{ position: "asc" }, { id: "asc" }] }) : [],
  ]);
  const texts = resolveContent("texts", {
    ...(offers ? { offers: { enabled: offers.enabled, showSplit: offers.showSplit, showClub: offers.showClub } } : {}),
    ...(saved.has("homeSections") ? { homeSections: Object.fromEntries(home.map((item) => [item.section, item.enabled])) } : {}),
    ...(split ? { split: { kicker: split.kicker, big: split.big, sub: split.sub, cta: split.cta,
      img: split.img, ...(split.productId ? { productId: split.productId } : {}) } } : {}),
    ...(club ? { club: { kicker: club.kicker, big: club.big, text: club.text, code: club.code, cta: club.cta } } : {}),
    ...(editorial ? { editorial: { kicker: editorial.kicker, title: editorial.title, text: editorial.text,
      cta: editorial.cta, img: editorial.img, ...(editorial.productId ? { productId: editorial.productId } : {}) } } : {}),
    ...(saved.has("benefits") ? { benefits: benefits.map((item) => ({ t: item.title, d: item.description })) } : {}),
    ...(saved.has("marquee") ? { marquee: marquee.map((item) => item.text) } : {}),
  });
  return { savedSections: saved, content: {
    promo: resolveContent("promo", saved.has("promo") ? promo.map((item) => item.text) : undefined),
    hero: resolveContent("hero", saved.has("hero") ? hero.map((item) => {
      const desktopSettings = savedHeroSettings(item.desktopZoom, item.desktopX, item.desktopY,
        item.desktopWidth, item.desktopHeight);
      const mobileSettings = savedHeroSettings(item.mobileZoom, item.mobileX, item.mobileY,
        item.mobileWidth, item.mobileHeight);
      return {
        id: item.id, img: item.img, ...(item.productId ? { productId: item.productId } : {}),
        kicker: item.kicker, title: item.title, cta: item.cta, promo: item.promo,
        align: item.align as "left" | "right",
        ...(desktopSettings ? { desktopSettings } : {}),
        ...(mobileSettings ? { mobileSettings } : {}),
      };
    }) : undefined),
    instagram: resolveContent("instagram", saved.has("instagram") ? instagram.map((item) => ({
      id: item.id, url: item.url, image: item.image,
      ...(item.productId ? { productId: item.productId } : {}), title: item.title,
      kind: item.kind as "post" | "reel",
    })) : undefined),
    contact: resolveContent("contact", contact ? { whatsapp: contact.whatsapp, instagramUsername: contact.instagramUsername } : undefined),
    texts,
  } };
}

export async function loadRelationalContent(db: ContentDb) {
  return (await loadRelationalContentWithSections(db)).content;
}

async function markSaved(db: ContentDb, key: string) {
  await db.contentSection.upsert({ where: { key }, create: { key }, update: {} });
}

export async function saveRelationalContent(db: ContentDb, key: ContentKey, value: ContentSnapshot[ContentKey]) {
  if (key === "promo") {
    await db.promoLine.deleteMany();
    await db.promoLine.createMany({ data: (value as string[]).map((text, position) => ({ text, position })) });
  } else if (key === "hero") {
    await db.heroSlide.deleteMany();
    await db.heroSlide.createMany({ data: (value as ContentSnapshot["hero"]).map((slide, position) => ({
      id: slide.id, position, ...heroSlideColumns(slide),
    })) });
  } else if (key === "instagram") {
    await db.curatedInstagramPost.deleteMany();
    await db.curatedInstagramPost.createMany({ data: (value as ContentSnapshot["instagram"]).map((post, position) => ({
      id: post.id, position, url: post.url, image: post.image, productId: post.productId ?? null,
      title: post.title, kind: post.kind,
    })) });
  } else if (key === "contact") {
    const contact = value as ContentSnapshot["contact"];
    const data = { whatsapp: contact.whatsapp, instagramUsername: contact.instagramUsername };
    await db.contactSettings.upsert({ where: { id: 1 }, create: { id: 1, ...data }, update: data });
  } else if (key === "texts") {
    const texts = value as Texts;
    await saveRelationalTextSection(db, "homeSections", texts.homeSections);
    await saveRelationalTextSection(db, "benefits", texts.benefits);
    await saveRelationalTextSection(db, "split", texts.split);
    await saveRelationalTextSection(db, "club", texts.club);
    await saveRelationalTextSection(db, "marquee", texts.marquee);
    await saveRelationalTextSection(db, "editorial", texts.editorial);
    const data = { enabled: texts.offers.enabled, showSplit: texts.offers.showSplit, showClub: texts.offers.showClub };
    await db.offerSettings.upsert({ where: { id: 1 }, create: { id: 1, ...data }, update: data });
  }
  await markSaved(db, key);
}

export async function saveRelationalTextSection(db: ContentDb, section: TextSectionKey, value: Texts[TextSectionKey]) {
  if (section === "offers") {
    const offers = value as Texts["offers"];
    const data = { enabled: offers.enabled, showSplit: offers.showSplit, showClub: offers.showClub };
    await db.offerSettings.upsert({ where: { id: 1 }, create: { id: 1, ...data }, update: data });
  } else if (section === "benefits") {
    await db.benefit.deleteMany();
    await db.benefit.createMany({ data: (value as Texts["benefits"]).map((item, position) => ({
      position, title: item.t, description: item.d,
    })) });
  } else if (section === "marquee") {
    await db.marqueeLine.deleteMany();
    await db.marqueeLine.createMany({ data: (value as string[]).map((text, position) => ({ position, text })) });
  } else if (section === "homeSections") {
    await db.homeSectionSetting.deleteMany();
    await db.homeSectionSetting.createMany({ data: Object.entries(value as Texts["homeSections"])
      .map(([name, enabled]) => ({ section: name, enabled })) });
  } else if (section === "split") {
    const s = value as Texts["split"];
    const data = { kicker: s.kicker, big: s.big, sub: s.sub, cta: s.cta, img: s.img, productId: s.productId ?? null };
    await db.splitBanner.upsert({ where: { id: 1 }, create: { id: 1, ...data }, update: data });
  } else if (section === "club") {
    const s = value as Texts["club"];
    const data = { kicker: s.kicker, big: s.big, text: s.text, code: s.code, cta: s.cta };
    await db.clubBanner.upsert({ where: { id: 1 }, create: { id: 1, ...data }, update: data });
  } else if (section === "editorial") {
    const s = value as Texts["editorial"];
    const data = { kicker: s.kicker, title: s.title, text: s.text, cta: s.cta, img: s.img, productId: s.productId ?? null };
    await db.editorialBanner.upsert({ where: { id: 1 }, create: { id: 1, ...data }, update: data });
  }
  await markSaved(db, section);
}

