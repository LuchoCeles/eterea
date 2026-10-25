import type { Metadata } from "next";
import { CartProvider } from "@/components/providers/CartProvider";
import { Toaster } from "@/components/ui/sonner";
import "@/styles.css";

export const metadata: Metadata = {
  title: "Etérea",
  description: "Ropa femenina con espíritu costero e inspiración europea. Descubrí el universo de Etérea: mar, naturaleza, frescura y comodidad.",
  openGraph: {
    title: "Etérea",
    description: "Moda femenina inspirada en el mar, la naturaleza y la frescura de la costa.",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-AR">
      <body>
        <CartProvider>{children}</CartProvider>
        <Toaster />
      </body>
    </html>
  );
}
