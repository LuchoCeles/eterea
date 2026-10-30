import { MessageCircle, Phone } from "lucide-react";

export function WhatsAppIcon() {
  return (
    <span className="relative inline-flex h-5 w-5 items-center justify-center" aria-hidden="true">
      <MessageCircle className="h-5 w-5" strokeWidth={1.8} />
      <Phone className="absolute h-2.5 w-2.5 -translate-y-px" strokeWidth={2} />
    </span>
  );
}
