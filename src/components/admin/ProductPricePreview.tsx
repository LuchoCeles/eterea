import { ProductCardPrice } from "@/components/store/ProductCardPrice";
import { formatPrice } from "@/lib/products";
import type { StoreProduct } from "@/lib/content";
import { automaticProductTag } from "@/lib/storefront-rules";

export function ProductPricePreview({ product, offersEnabled, onSwapPrices }: { product: StoreProduct; offersEnabled: boolean; onSwapPrices: () => void }) {
  const noDiscount = typeof product.oldPrice === "number" && product.oldPrice > 0 && product.oldPrice <= product.price;
  const canSwap = noDiscount && product.oldPrice !== product.price;
  const tag = automaticProductTag(product, offersEnabled);

  return (
    <div className="space-y-3">
      {noDiscount && (
        <div role="status" className="rounded-xl border border-accent/40 bg-accent/10 px-3 py-2 text-xs leading-relaxed">
          <p>
            Con estos importes no hay descuento: el precio antes de la oferta ({formatPrice(product.oldPrice!)}) debe superar al precio actual ({formatPrice(product.price)}).
          </p>
          {canSwap && <button type="button" onClick={onSwapPrices} className="mt-2 font-semibold underline underline-offset-2">
            Intercambiar precio actual y precio antes de la oferta
          </button>}
          {canSwap && <p className="mt-1 text-muted-foreground">Revisá los demás precios por forma de pago antes de guardar.</p>}
        </div>
      )}
      <div className="rounded-xl border border-dashed bg-background/70 px-4 py-3">
        <p className="text-xs font-semibold">Vista previa del precio en la card</p>
        {tag && <span className={`mt-2 inline-block px-2.5 py-1 text-xs font-semibold ${tag === "Oferta" ? "bg-accent text-accent-foreground" : "bg-sand text-foreground"}`}>{tag}</span>}
        {product.price > 0 && <ProductCardPrice product={product} />}
        {(product.paymentPrices?.length ?? 0) === 1 && (
          <p className="mt-2 text-xs text-muted-foreground">
            El precio por forma de pago se destaca en la card cuando hay al menos dos medios configurados.
          </p>
        )}
      </div>
    </div>
  );
}
