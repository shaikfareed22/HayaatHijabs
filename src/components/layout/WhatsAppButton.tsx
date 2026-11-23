import { STORE_WHATSAPP_URL } from "@/lib/storefront";

/** Floating WhatsApp button, bottom-right on every shop page. Opens a chat with "Hello Hayaat Emporium". */
const WhatsAppButton = () => (
  <a
    href={STORE_WHATSAPP_URL}
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Chat with us on WhatsApp"
    title="Chat with us on WhatsApp"
    className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#25D366]/50 focus:ring-offset-2"
  >
    <svg viewBox="0 0 32 32" className="h-8 w-8" fill="currentColor" aria-hidden="true">
      <path d="M16.004 3C8.83 3 3 8.74 3 15.82c0 2.6.78 5.02 2.12 7.05L3.2 29l6.33-1.86a13.2 13.2 0 0 0 6.47 1.68c7.17 0 13-5.74 13-12.82S23.17 3 16.004 3Zm0 23.49c-2.07 0-4.1-.56-5.86-1.63l-.42-.25-3.76 1.1 1.1-3.6-.27-.44a10.4 10.4 0 0 1-1.63-5.85c0-5.84 4.86-10.6 10.84-10.6 5.97 0 10.83 4.76 10.83 10.6 0 5.85-4.86 10.67-10.83 10.67Zm5.95-7.94c-.33-.16-1.93-.94-2.23-1.05-.3-.11-.52-.16-.73.16-.22.33-.84 1.05-1.03 1.27-.19.22-.38.24-.7.08-.33-.16-1.38-.5-2.63-1.6a9.75 9.75 0 0 1-1.82-2.23c-.19-.33-.02-.5.14-.66.15-.15.33-.38.49-.57.16-.19.22-.33.33-.55.11-.22.05-.41-.03-.57-.08-.16-.73-1.74-1-2.38-.27-.63-.54-.54-.73-.55h-.63c-.22 0-.57.08-.87.41-.3.33-1.14 1.1-1.14 2.68s1.17 3.1 1.33 3.32c.16.22 2.3 3.46 5.57 4.85.78.33 1.39.53 1.86.68.78.25 1.5.21 2.06.13.63-.09 1.93-.78 2.2-1.53.27-.76.27-1.4.19-1.54-.08-.13-.3-.21-.63-.37Z" />
    </svg>
  </a>
);

export default WhatsAppButton;
