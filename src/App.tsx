import { useEffect, useRef, useState, useCallback } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useMenuData, useMenuFilter } from "@/hooks/use-menu";
import { SearchBar } from "@/components/SearchBar";
import { CategoryFilter } from "@/components/CategoryFilter";
import { MenuCard } from "@/components/MenuCard";
import { MenuLightbox } from "@/components/MenuLightbox";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { ErrorMessage } from "@/components/ErrorMessage";
import { Sparticles } from "@/components/Sparticles";
import { ItalianDecorations } from "@/components/ItalianDecorations";
import { getDriveThumbnailUrl, getPlaceholderImage, handleImageError } from "@/services/google-drive";
import { getDiscountState } from "@/services/google-sheets";
import type { MenuItem, MenuItemVariant, Cart } from "@/types/menu";
import { DiscountEncouragement } from "@/components/DiscountEncouragement";

gsap.registerPlugin(ScrollTrigger);

function LoadingScreen({ ready, progress }: { ready: boolean; progress: number }) {
  const [show, setShow] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (ready) {
      setFading(true);
      const t = setTimeout(() => setShow(false), 700);
      return () => clearTimeout(t);
    }
  }, [ready]);

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#120c08] transition-opacity duration-700"
      style={{ opacity: fading ? 0 : 1 }}
    >
      <span
        className="text-4xl md:text-6xl tracking-[0.12em] text-[#d4af37] mb-2 font-normal"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Italian Pasta
      </span>
      <span className="text-[10px] md:text-xs tracking-[0.45em] text-[#bdae9c] uppercase mb-8">
        AUTHENTIC ITALIAN RESTAURANT
      </span>
      <div className="w-44 h-[2px] bg-[#2a2018] rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-[#d4af37] rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="text-[11px] tracking-[0.3em] text-[#bdae9c]/60 font-mono">{progress}%</span>
    </div>
  );
}

const NAV = [
  { en: "Menu", ar: "القائمة", href: "#menu" },
  { en: "Reserve", ar: "الحجوزات", href: "#reserve" },
];

export default function App() {
  const [lang, setLang] = useState<"en" | "ar">("en");
  const isAr = lang === "ar";

  const t = {
    brandName: isAr ? "إيطاليان باستا" : "Italian Pasta",
    brandSubtitle: isAr ? "مطعم إيطالي وباستا طازجة" : "AUTHENTIC ITALIAN RESTAURANT",
    heroKicker: isAr ? "قائمة أطباقنا" : "OUR MENU",
    heroTitle: isAr ? "الباستا الإيطالية" : "ITALIAN PASTA",
    heroTagline: isAr ? "«نكهات أصيلة، وتقاليد خالدة»" : "“Authentic Flavors, Timeless Traditions”",
    heroDescription: isAr
      ? "مكونات طازجة، باستا محضّرة يدويًا يوميًا، ووصفات عريقة مستوحاة من قلب إيطاليا."
      : "Fresh ingredients, handmade pasta, and classic recipes from the heart of Italy.",
    addToCart: isAr ? "أضف إلى الطلب" : "ADD TO ORDER",
    yourCart: isAr ? "طلبك الحالي" : "Your Order",
    empty: isAr ? "قائمة طلباتك فارغة حاليًا." : "Your order is empty.",
    subtotalLabel: isAr ? "المجموع الفرعي" : "Subtotal",
    discountLabel: isAr ? "خصم خاص" : "Discount",
    total: isAr ? "الإجمالي النهائي" : "Total",
    checkout: isAr ? "إتمام الطلب عبر واتساب" : "Order via WhatsApp",
    nameField: isAr ? "الاسم الكريم" : "Your Name",
    phoneField: isAr ? "رقم الهاتف" : "Phone Number",
    addressField: isAr ? "عنوان التوصيل / الطاولة" : "Delivery Address or Table Number",
    pickupTimeField: isAr ? "وقت الاستلام أو الحجز" : "Pickup / Dine-in Time",
    requiredField: isAr ? "هذا الحقل مطلوب" : "This field is required",
    iqd: isAr ? "د.ع" : "IQD",
    loading: isAr ? "…جاري تحضير القائمة" : "Loading authentic menu…",
    searchPlaceholder: isAr ? "ابحث عن طبق باستا..." : "Search for a dish...",
    addMoreSaveMore: isAr ? "أضف المزيد، وفّر أكثر" : "Add more, save more",
    reserveHeading: isAr ? "احجز طاولتك في إيطاليان باستا" : "Reserve Your Table at Italian Pasta",
    reserveSub: isAr
      ? "استمتع بأمسية إيطالية دافئة وموسيقى هادئة مع ألذ أطباق الباستا الطازجة."
      : "Experience a warm Italian evening with candlelight, fine wine, and fresh artisanal pasta.",
    reserveBtn: isAr ? "حجز طاولة الآن" : "Book a Table via WhatsApp",
    footerText: isAr
      ? "إيطاليان باستا · حيث يلتقي الشغف الإيطالي بفنون الطهي العريقة"
      : "Italian Pasta · Authentic Flavors, Handcrafted Daily with Italian Passion",
  };

  const menuSectionRef = useRef<HTMLElement>(null);
  const menuGridRef = useRef<HTMLDivElement>(null);

  // GSAP ScrollTrigger for smooth menu reveal animations
  useEffect(() => {
    if (!menuGridRef.current) return;

    const cards = menuGridRef.current.querySelectorAll<HTMLElement>("[data-reveal]");
    cards.forEach((el) => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 25 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power2.out",
          scrollTrigger: {
            trigger: el,
            start: "top 92%",
            toggleActions: "play none none none",
          },
        }
      );
    });

    return () => {
      ScrollTrigger.getAll().forEach((s) => s.kill());
    };
  }, []);

  // Menu data from Google Sheets or fallback authentic Italian catalog
  const { items, loading, error, categories, discountTiers, whatsappPhone } = useMenuData();
  const { search, setSearch, activeCategory, setActiveCategory, filtered } = useMenuFilter(items);

  // Cart & State — variant-aware: key = itemId or itemId__variantName
  const [cart, setCart] = useState<Cart>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [lightboxItem, setLightboxItem] = useState<MenuItem | null>(null);
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custAddress, setCustAddress] = useState("");
  const [custPickupTime, setCustPickupTime] = useState("");
  const [formErrors, setFormErrors] = useState<{
    name?: boolean;
    phone?: boolean;
    address?: boolean;
    pickupTime?: boolean;
  }>({});

  const cartCount = Object.values(cart).reduce((sum, e) => sum + e.qty, 0);
  const subtotal = Object.values(cart).reduce((sum, e) => sum + e.qty * e.price, 0);
  const discountState = getDiscountState(discountTiers, cartCount);
  const discountPercent = discountState?.currentPercent ?? 0;
  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const totalAfterDiscount = subtotal - discountAmount;

  /** Add an item (with optional size variant) to the cart */
  const add = useCallback((item: MenuItem, variant?: MenuItemVariant) => {
    const key = variant ? `${item.id}__${variant.name.toLowerCase()}` : item.id;
    const price = variant ? variant.price : item.price;
    const nameLabel = variant ? `${item.name} (${variant.name})` : item.name;
    const nameLabelAr = variant
      ? `${item.nameAr ?? item.name} (${variant.nameAr})`
      : (item.nameAr ?? item.name);
    setCart((c) => ({
      ...c,
      [key]: { qty: (c[key]?.qty ?? 0) + 1, price, itemId: item.id, nameLabel, nameLabelAr },
    }));
  }, []);

  /** Decrease qty or remove a cart entry by its full key */
  const remove = useCallback((key: string) => {
    setCart((c) => {
      const cur = c[key];
      if (!cur) return c;
      if (cur.qty <= 1) {
        const { [key]: _drop, ...rest } = c;
        return rest;
      }
      return { ...c, [key]: { ...cur, qty: cur.qty - 1 } };
    });
  }, []);

  const sendOrderWhatsApp = useCallback(() => {
    const errors: { name?: boolean; phone?: boolean; address?: boolean; pickupTime?: boolean } = {};
    if (!custName.trim()) errors.name = true;
    if (!custPhone.trim()) errors.phone = true;
    if (!custAddress.trim()) errors.address = true;
    if (!custPickupTime.trim()) errors.pickupTime = true;
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});

    const orderLines = Object.entries(cart)
      .filter(([, entry]) => entry.qty > 0)
      .map(([, entry]) => {
        const name = isAr ? entry.nameLabelAr : entry.nameLabel;
        return `• ${name} x${entry.qty} — ${(entry.price * entry.qty).toLocaleString()} IQD`;
      });

    const msg = [
      `🍝 *Italian Pasta Restaurant — Order*`,
      ``,
      `👤 *Customer:* ${custName}`,
      `📞 *Phone:* ${custPhone}`,
      `📍 *Location / Table:* ${custAddress}`,
      `🕐 *Time:* ${custPickupTime}`,
      ``,
      `--- *Dishes* ---`,
      ...orderLines,
      ``,
      `-----------------`,
      `💵 *Subtotal:* ${subtotal.toLocaleString()} IQD`,
      ...(discountPercent > 0
        ? [`🎉 *Discount (${discountPercent}%):* -${discountAmount.toLocaleString()} IQD`]
        : []),
      `💰 *Total Amount:* ${totalAfterDiscount.toLocaleString()} IQD`,
      ``,
      `Grazie mille! 🇮🇹`,
    ].join("\n");

    const phone = whatsappPhone || "9647700000000";
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  }, [
    cart, custName, custPhone, custAddress, custPickupTime,
    subtotal, totalAfterDiscount, discountPercent, discountAmount, isAr, whatsappPhone,
  ]);

  useEffect(() => {
    if (filtered.length > 0) {
      requestAnimationFrame(() => ScrollTrigger.refresh());
    }
  }, [filtered.length]);

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div
      className={`relative min-h-screen bg-espresso-table text-[#fbf8f2] selection:bg-[#d4af37]/30 selection:text-[#fff9e6] ${
        isAr ? "font-arabic" : ""
      }`}
      dir={isAr ? "rtl" : "ltr"}
      lang={isAr ? "ar" : "en"}
    >
      <LoadingScreen ready={!loading} progress={loading ? 40 : 100} />

      {/* Decorative Italian Ingredients Layer (basil, tomato, wheat, parmesan, olive oil) */}
      <ItalianDecorations />

      {/* Ambient particles (fine flour dust & warm golden embers) */}
      <Sparticles count={35} />

      {/* ============ FIXED FLOATING NAVIGATION BAR ============ */}
      <header className="fixed top-3 sm:top-5 inset-x-0 z-50 px-4 sm:px-6 md:px-8">
        <div className="max-w-6xl mx-auto glass-italian rounded-full px-5 sm:px-8 py-3 flex items-center justify-between border border-[#d4af37]/25 shadow-[0_10px_35px_rgba(0,0,0,0.85)] bg-[#18110b]/75">
          {/* Brand Logo & Subtitle */}
          <a href="#menu" className="flex flex-col group">
            <span
              className="text-2xl sm:text-3xl tracking-[0.08em] text-[#d4af37] group-hover:text-[#e5c158] transition-colors font-normal leading-none"
              style={{ fontFamily: isAr ? undefined : "var(--font-display)" }}
            >
              {t.brandName}
            </span>
            <span className="text-[8px] sm:text-[9px] tracking-[0.32em] text-[#bdae9c] uppercase mt-1">
              {t.brandSubtitle}
            </span>
          </a>

          {/* Navigation Links */}
          <nav className="hidden sm:flex items-center gap-6 md:gap-10 text-[11px] md:text-xs tracking-[0.25em] text-[#ede4d6]/80 font-medium">
            {NAV.map((l) => (
              <a
                key={l.en}
                href={l.href}
                className="hover:text-[#d4af37] transition-colors py-1 relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] after:bg-[#d4af37] hover:after:w-full after:transition-all"
              >
                {isAr ? l.ar : l.en.toUpperCase()}
              </a>
            ))}
          </nav>

          {/* Action Area: Language Switcher & Quick Cart Trigger */}
          <div className="flex items-center gap-3">
            {/* Language Switch */}
            <button
              onClick={() => setLang(isAr ? "en" : "ar")}
              className="text-[11px] tracking-[0.2em] px-3.5 py-1.5 rounded-full border border-[#d4af37]/35 text-[#ede4d6] hover:border-[#d4af37] hover:text-[#d4af37] hover:bg-[#d4af37]/10 transition-all duration-300 font-medium"
              aria-label="Switch Language"
            >
              {isAr ? "ENGLISH" : "عربي"}
            </button>

            {/* Cart Icon in Header on Mobile */}
            <button
              onClick={() => setCartOpen(true)}
              className="relative w-9 h-9 rounded-full border border-[#d4af37]/35 bg-[#d4af37]/10 text-[#d4af37] flex items-center justify-center hover:bg-[#d4af37] hover:text-[#120c08] transition-all"
              aria-label="Open Cart"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#c84b31] text-[#fbf8f2] text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-md">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ============ HERO & MENU SECTION ============ */}
      <section ref={menuSectionRef} id="menu" className="relative pt-32 sm:pt-40 pb-16 z-10 bg-transparent">
        <div className="max-w-5xl mx-auto text-center px-6">
          {/* Top Kicker */}
          <div className="inline-flex items-center gap-3 mb-4">
            <span className="w-8 h-[1px] bg-[#d4af37]/40" />
            <p className="text-[11px] md:text-xs tracking-[0.45em] text-[#d4af37] uppercase font-semibold">
              {t.heroKicker}
            </p>
            <span className="w-8 h-[1px] bg-[#d4af37]/40" />
          </div>

          {/* Main Title: ITALIAN PASTA */}
          <h1
            className={`text-5xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight text-[#fbf8f2] font-normal mb-4 ${
              isAr ? "font-arabic font-bold" : ""
            }`}
            style={{ fontFamily: isAr ? undefined : "var(--font-display)" }}
          >
            {t.heroTitle}
          </h1>

          {/* Italian Tagline */}
          <p
            className={`text-xl sm:text-2xl md:text-3xl text-[#d4af37] mb-5 italic font-serif ${
              isAr ? "font-arabic not-italic font-medium" : ""
            }`}
          >
            {t.heroTagline}
          </p>

          {/* Delicate Divider */}
          <div className="italian-divider max-w-xs mx-auto my-5" />

          {/* Supporting Text */}
          <p
            className={`text-sm sm:text-base text-[#c7baa8] max-w-2xl mx-auto leading-relaxed ${
              isAr ? "font-arabic" : ""
            }`}
          >
            {t.heroDescription}
          </p>

          {/* Category Filters */}
          <CategoryFilter
            categories={categories}
            active={activeCategory}
            onSelect={setActiveCategory}
            isAr={isAr}
          />

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mt-8">
            <SearchBar
              value={search}
              onChange={setSearch}
              isAr={isAr}
              placeholder={t.searchPlaceholder}
            />
          </div>
        </div>

        {/* ============ MENU CARDS GRID ============ */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 mt-12 pb-24" ref={menuGridRef}>
          {loading && <LoadingSkeleton />}
          {error && <ErrorMessage message={error} onRetry={handleRetry} />}

          {!loading && !error && (
            <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
              {filtered.map((it) => (
                <MenuCard
                  key={it.id}
                  item={it}
                  isAr={isAr}
                  onAddToCart={add}
                  onImageClick={setLightboxItem}
                  iqdLabel={t.iqd}
                  addToCartLabel={t.addToCart}
                />
              ))}
            </div>
          )}

          {!loading && !error && filtered.length === 0 && items.length > 0 && (
            <div className="text-center py-16 px-4">
              <p className="text-[#bdae9c] text-base mb-2">
                {isAr ? "لم نجد أطباقًا تطابق بحثك." : "No pasta dishes found matching your search."}
              </p>
              <button
                onClick={() => {
                  setSearch("");
                  setActiveCategory("all");
                }}
                className="mt-3 text-xs tracking-[0.2em] text-[#d4af37] uppercase border-b border-[#d4af37]/40 hover:border-[#d4af37] pb-1 transition-colors"
              >
                {isAr ? "عرض جميع الأطباق" : "View All Dishes"}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ============ RESERVATION & ATMOSPHERE BANNER ============ */}
      <section id="reserve" className="relative py-20 border-t border-[#d4af37]/15 bg-[#120c08]/80 backdrop-blur-md z-10">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <span className="text-[10px] tracking-[0.4em] text-[#d4af37] uppercase font-semibold block mb-3">
            {isAr ? "تجربة لا تُنسى" : "AN UNFORGETTABLE EXPERIENCE"}
          </span>
          <h2
            className={`text-3xl sm:text-4xl md:text-5xl text-[#fbf8f2] mb-4 font-normal ${
              isAr ? "font-arabic font-bold" : ""
            }`}
            style={{ fontFamily: isAr ? undefined : "var(--font-display)" }}
          >
            {t.reserveHeading}
          </h2>
          <p
            className={`text-sm sm:text-base text-[#c7baa8] max-w-xl mx-auto leading-relaxed mb-8 ${
              isAr ? "font-arabic" : ""
            }`}
          >
            {t.reserveSub}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={`https://wa.me/${whatsappPhone || "9647700000000"}?text=Hello%2C%20I%20would%20like%20to%20reserve%20a%20table%20at%20Italian%20Pasta.`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-[#d4af37] text-[#120c08] hover:bg-[#e5c158] px-8 py-3.5 text-xs tracking-[0.25em] font-semibold transition-all duration-300 shadow-[0_6px_25px_-5px_rgba(212,175,55,0.45)] uppercase"
            >
              {t.reserveBtn}
            </a>
            <button
              onClick={() => setCartOpen(true)}
              className="rounded-full border border-[#d4af37]/40 text-[#fbf8f2] hover:bg-[#d4af37]/10 px-8 py-3.5 text-xs tracking-[0.25em] font-medium transition-all uppercase"
            >
              {isAr ? "عرض طلبي الحالي" : "View Current Order"}
            </button>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="relative border-t border-white/8 bg-[#0c0704]/92 backdrop-blur-sm z-10">
        <div className="max-w-6xl mx-auto px-6 py-14 text-center">
          <div
            className="text-3xl sm:text-4xl tracking-[0.10em] text-[#d4af37] mb-2 font-normal"
            style={{ fontFamily: isAr ? undefined : "var(--font-display)" }}
          >
            Italian Pasta
          </div>
          <p className="text-[10px] tracking-[0.4em] text-[#bdae9c] uppercase mb-4">
            AUTHENTIC ITALIAN RESTAURANT & HANDMADE PASTA
          </p>
          <p
            className={`text-xs text-[#bdae9c]/80 max-w-md mx-auto leading-relaxed ${
              isAr ? "font-arabic" : ""
            }`}
          >
            {t.footerText}
          </p>
          <div className="italian-divider max-w-xs mx-auto my-6" />
          <p className="text-[10px] tracking-[0.25em] text-[#bdae9c]/50 font-mono">
            © {new Date().getFullYear()} ITALIAN PASTA · ALL RIGHTS RESERVED
          </p>
        </div>
      </footer>

      {/* ============ FLOATING CART BUTTON ============ */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
        {discountTiers.length > 0 && (
          <span className="glass-italian rounded-full px-3.5 py-1 text-[9px] tracking-[0.22em] text-[#d4af37] shadow-[0_4px_15px_rgba(212,175,55,0.25)] border border-[#d4af37]/35 whitespace-nowrap font-medium">
            {t.addMoreSaveMore}
          </span>
        )}
        <button
          onClick={() => setCartOpen(true)}
          className="w-14 h-14 rounded-full bg-[#1c1510] text-[#d4af37] border border-[#d4af37]/50 grid place-items-center hover:scale-108 transition-all duration-300 shadow-[0_12px_35px_rgba(0,0,0,0.8),0_0_20px_rgba(212,175,55,0.25)] hover:bg-[#d4af37] hover:text-[#120c08]"
          aria-label="Open order"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          {cartCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-[#c84b31] text-[#fbf8f2] text-[10px] w-5 h-5 rounded-full grid place-items-center font-bold shadow-md">
              {cartCount}
            </span>
          )}
        </button>
      </div>

      {/* ============ CART / ORDER DRAWER ============ */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setCartOpen(false)}>
          <div className="absolute inset-0 bg-black/75 backdrop-blur-md transition-opacity duration-300" />
          <aside
            className="drawer-slide relative w-full max-w-md bg-[#18110b]/98 border-l border-[#d4af37]/25 h-full shadow-2xl p-6 overflow-y-auto flex flex-col justify-between backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#d4af37]/20 mb-6">
                <div>
                  <span className="text-[9px] tracking-[0.3em] text-[#d4af37] uppercase font-semibold block">
                    ITALIAN PASTA
                  </span>
                  <h3
                    className={`text-2xl text-[#fbf8f2] ${isAr ? "font-arabic font-bold" : ""}`}
                    style={{ fontFamily: isAr ? undefined : "var(--font-display)" }}
                  >
                    {t.yourCart}
                  </h3>
                </div>
                <button
                  onClick={() => setCartOpen(false)}
                  className="w-9 h-9 rounded-full border border-white/10 hover:border-[#d4af37] text-white/50 hover:text-[#d4af37] flex items-center justify-center transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Items List — variant-aware */}
              <div className="space-y-3">
                {Object.keys(cart).length === 0 && (
                  <p className="text-[#bdae9c]/60 text-sm text-center py-12">{t.empty}</p>
                )}

                {Object.entries(cart)
                  .filter(([, entry]) => entry.qty > 0)
                  .map(([key, entry]) => {
                    const baseItem = items.find((i) => i.id === entry.itemId);
                    const label = isAr ? entry.nameLabelAr : entry.nameLabel;
                    const imgSrc = baseItem?.imageFileId
                      ? getDriveThumbnailUrl(baseItem.imageFileId, 200)
                      : (baseItem?.imageUrl || getPlaceholderImage());
                    return (
                      <div
                        key={key}
                        className="flex items-center gap-3 bg-[#241a13]/80 border border-[#d4af37]/15 rounded-2xl p-3 shadow-sm"
                      >
                        <img
                          src={imgSrc}
                          alt=""
                          className="w-14 h-14 rounded-xl object-cover"
                          onError={(e) => {
                            if (baseItem?.imageFileId) handleImageError(e, baseItem.imageFileId);
                            else (e.currentTarget as HTMLImageElement).src = getPlaceholderImage();
                          }}
                        />

                        <div className="flex-1 min-w-0">
                          <p className={`truncate text-sm text-[#fbf8f2] font-medium ${isAr ? "font-arabic" : ""}`}>
                            {label}
                          </p>
                          <p className="text-xs text-[#d4af37] font-mono font-semibold">
                            {(entry.price * entry.qty).toLocaleString()} {t.iqd}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => remove(key)}
                            className="w-7 h-7 rounded-full border border-[#d4af37]/30 hover:border-[#d4af37] text-[#fbf8f2] hover:text-[#d4af37] flex items-center justify-center transition-colors"
                          >
                            −
                          </button>
                          <span className="w-5 text-center text-sm font-mono font-semibold">
                            {entry.qty}
                          </span>
                          <button
                            onClick={() => baseItem && add(baseItem, undefined)}
                            className="w-7 h-7 rounded-full border border-[#d4af37]/30 hover:border-[#d4af37] text-[#fbf8f2] hover:text-[#d4af37] flex items-center justify-center transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Cart Footer / Checkout Form */}
            {cartCount > 0 && (
              <div className="mt-8 space-y-4 pt-4 border-t border-[#d4af37]/20">
                <DiscountEncouragement tiers={discountTiers} quantity={cartCount} isAr={isAr} />

                <div className="space-y-1.5 text-xs text-[#bdae9c]">
                  <div className="flex items-center justify-between">
                    <span className="tracking-[0.2em] uppercase">{t.subtotalLabel}</span>
                    <span className="text-[#fbf8f2] font-mono font-semibold">
                      {subtotal.toLocaleString()} {t.iqd}
                    </span>
                  </div>

                  {discountPercent > 0 && (
                    <div className="flex items-center justify-between text-[#d4af37]">
                      <span className="tracking-[0.2em] uppercase">
                        {t.discountLabel} ({discountPercent}%)
                      </span>
                      <span className="font-mono font-semibold">
                        -{discountAmount.toLocaleString()} {t.iqd}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-base pt-2 border-t border-white/5">
                    <span className="tracking-[0.2em] uppercase text-[#fbf8f2] font-medium">
                      {t.total}
                    </span>
                    <span className="text-2xl text-[#d4af37] font-mono font-bold">
                      {totalAfterDiscount.toLocaleString()} {t.iqd}
                    </span>
                  </div>
                </div>

                {/* Form fields */}
                <div className="space-y-2.5 pt-2">
                  <div>
                    <input
                      type="text"
                      placeholder={t.nameField}
                      value={custName}
                      onChange={(e) => {
                        setCustName(e.target.value);
                        setFormErrors((p) => ({ ...p, name: false }));
                      }}
                      className={`w-full bg-[#241a13] border ${
                        formErrors.name ? "border-red-500" : "border-[#d4af37]/25"
                      } rounded-xl px-4 py-2.5 text-sm text-[#fbf8f2] placeholder:text-[#bdae9c]/50 focus:outline-none focus:border-[#d4af37] transition`}
                    />
                    {formErrors.name && (
                      <p className="text-red-400 text-[10px] mt-1">{t.requiredField}</p>
                    )}
                  </div>

                  <div>
                    <input
                      type="tel"
                      placeholder={t.phoneField}
                      value={custPhone}
                      onChange={(e) => {
                        setCustPhone(e.target.value);
                        setFormErrors((p) => ({ ...p, phone: false }));
                      }}
                      className={`w-full bg-[#241a13] border ${
                        formErrors.phone ? "border-red-500" : "border-[#d4af37]/25"
                      } rounded-xl px-4 py-2.5 text-sm text-[#fbf8f2] placeholder:text-[#bdae9c]/50 focus:outline-none focus:border-[#d4af37] transition`}
                    />
                    {formErrors.phone && (
                      <p className="text-red-400 text-[10px] mt-1">{t.requiredField}</p>
                    )}
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder={t.addressField}
                      value={custAddress}
                      onChange={(e) => {
                        setCustAddress(e.target.value);
                        setFormErrors((p) => ({ ...p, address: false }));
                      }}
                      className={`w-full bg-[#241a13] border ${
                        formErrors.address ? "border-red-500" : "border-[#d4af37]/25"
                      } rounded-xl px-4 py-2.5 text-sm text-[#fbf8f2] placeholder:text-[#bdae9c]/50 focus:outline-none focus:border-[#d4af37] transition`}
                    />
                    {formErrors.address && (
                      <p className="text-red-400 text-[10px] mt-1">{t.requiredField}</p>
                    )}
                  </div>

                  <div>
                    <input
                      type="time"
                      value={custPickupTime}
                      onChange={(e) => {
                        setCustPickupTime(e.target.value);
                        setFormErrors((p) => ({ ...p, pickupTime: false }));
                      }}
                      className={`w-full bg-[#241a13] border ${
                        formErrors.pickupTime ? "border-red-500" : "border-[#d4af37]/25"
                      } rounded-xl px-4 py-2.5 text-sm text-[#fbf8f2] placeholder:text-[#bdae9c]/50 focus:outline-none focus:border-[#d4af37] transition ${
                        isAr ? "direction-rtl" : ""
                      }`}
                    />
                    {!custPickupTime && (
                      <p className="text-[#bdae9c]/50 text-[10px] mt-1">{t.pickupTimeField}</p>
                    )}
                    {formErrors.pickupTime && (
                      <p className="text-red-400 text-[10px] mt-1">{t.requiredField}</p>
                    )}
                  </div>
                </div>

                <button
                  onClick={sendOrderWhatsApp}
                  className={`w-full rounded-full bg-[#d4af37] text-[#120c08] py-3.5 text-xs tracking-[0.25em] font-semibold hover:bg-[#e5c158] transition-all duration-300 shadow-[0_6px_25px_-5px_rgba(212,175,55,0.45)] ${
                    isAr ? "font-arabic tracking-normal text-sm" : "uppercase"
                  }`}
                >
                  {t.checkout}
                </button>
              </div>
            )}
          </aside>
        </div>
      )}

      {/* ============ LIGHTBOX MODAL ============ */}
      {lightboxItem && (
        <MenuLightbox
          item={lightboxItem}
          isAr={isAr}
          onClose={() => setLightboxItem(null)}
          onAddToCart={(item, variant) => add(item, variant)}
          iqdLabel={t.iqd}
          addToCartLabel={t.addToCart}
        />
      )}
    </div>
  );
}
