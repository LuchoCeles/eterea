import type { Prisma } from "@/generated/prisma/client";
import { defaults, resolveContent, type ContentKey, type ContentSnapshot, type TextSectionKey, type Texts } from "@/lib/content";

type ContentDb = Pick<Prisma.TransactionClient,
  "contentSection" | "contactSettings" | "offerSettings" | "homeSectionSetting" |
  "splitBanner" | "clubBanner" | "editorialBanner" | "promoLine" | "heroSlide" |
  "benefit" | "marqueeLine" | "curatedInstagramPost">;

export async function loadRelationalContent(db: ContentDb) {
  const [sections, contact, offers, home, split, club, editorial, promo, hero, benefits, marquee, instagram] = await Promise.all([
    db.contentSection.findMany({ select: { key: true } }),
    db.contactSettings.findUnique({ where: { id: 1 } }),
    db.offerSettings.findUnique({ where: { id: 1 } }),
    db.homeSectionSetting.findMany(),
    db.splitBanner.findUnique({ where: { id: 1 } }),
    db.clubBanner.findUnique({ where: { id: 1 } }),
    db.editorialBanner.findUnique({ where: { id: 1 } }),
    db.promoLine.findMany({ orderBy: [{ position: "asc" }, { id: "asc" }] }),
    db.heroSlide.findMany({ orderBy: [{ position: "asc" }, { id: "asc" }] }),
    db.benefit.findMany({ orderBy: [{ position: "asc" }, { id: "asc" }] }),
    db.marqueeLine.findMany({ orderBy: [{ position: "asc" }, { id: "asc" }] }),
    db.curatedInstagramPost.findMany({ orderBy: [{ position: "asc" }, { id: "asc" }] }),
  ]);
  const saved = new Set(sections.map((section) => section.key));
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
  return {
    promo: resolveContent("promo", saved.has("promo") ? promo.map((item) => item.text) : undefined),
    hero: resolveContent("hero", saved.has("hero") ? hero.map((item) => ({
      img: item.img, ...(item.productId ? { productId: item.productId } : {}),
      kicker: item.kicker, title: item.title, cta: item.cta, promo: item.promo,
      align: item.align as "left" | "right",
    })) : undefined),
    instagram: resolveContent("instagram", saved.has("instagram") ? instagram.map((item) => ({
      id: item.id, url: item.url, image: item.image,
      ...(item.productId ? { productId: item.productId } : {}), title: item.title,
      kind: item.kind as "post" | "reel",
    })) : undefined),
    contact: resolveContent("contact", contact ? { whatsapp: contact.whatsapp, instagramUsername: contact.instagramUsername } : undefined),
    texts,
  };
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
      position, img: slide.img, productId: slide.productId ?? null, kicker: slide.kicker,
      title: slide.title, cta: slide.cta, promo: slide.promo, align: slide.align,
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
  if (section === "benefits") {
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

