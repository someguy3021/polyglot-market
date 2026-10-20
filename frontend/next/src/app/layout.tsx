import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Polyglot Market — Next.js",
  description: "Один контракт — 2 бекенда — 7 фронтов",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
      <script src="/config.js"></script>
        <header className="topbar">
          <Link href="/" className="brand">Polyglot Market</Link>
          <nav>
            <Link href="/">Каталог</Link>
            <Link href="/cart">Корзина</Link>
            <Link href="/login">Войти</Link>
            <Link href="/orders">Заказы</Link>
          </nav>
        </header>
        <main>{children}</main>
        <footer>Polyglot Market — Next.js App Router (RSC) · демо: buyer@demo.dev / password</footer>
      </body>
    </html>
  );
}
