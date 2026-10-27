import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Obra Econômica | Orçamento de materiais",
  description: "Organize insumos de construção, compare pesquisas de ofertas e calcule o orçamento da sua obra.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
