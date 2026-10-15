import type { ReactNode } from "react";
import { SiteHeader } from "@/components/shop/site-header";
import { SiteFooter } from "@/components/shop/site-footer";
import { WhatsAppButton } from "@/components/shop/whatsapp-button";

export default function ShopLayout({ children }: { children: ReactNode }) {
  return (
    <div className="shop-theme flex min-h-screen flex-col pb-[calc(3.5rem+env(safe-area-inset-bottom))] lg:pb-0">
      <SiteHeader />
      <div className="flex-1">{children}</div>
      <SiteFooter />
      <WhatsAppButton />
    </div>
  );
}
