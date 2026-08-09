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
import { getDriveThumbnailUrl, getDriveImageFallbackUrl, getPlaceholderImage, handleImageError } from "@/services/google-drive";
import { getDiscountState } from "@/services/google-sheets";
import type { MenuItem } from "@/types/menu";
import { DiscountEncouragement } from "@/components/DiscountEncouragement";

gsap.registerPlugin(ScrollTrigger);

function LoadingScreen({ ready, progress }: { ready: boolean; progress: number }) {
  const [show, setShow] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (ready) {
      setFading(true);
      const t = setTimeout(() => setShow(false), 800);
      return () => clearTimeout(t);
    }
  }, [ready]);

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-noir transition-opacity duration-700"
      style={{ opacity: fading ? 0 : 1 }}
    >
      <span
        className="text-4xl md:text-5xl tracking-[0.25em] text-gold-glow mb-6"
        style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }}
      >
        365
      </span>
      <div className="w-40 h-[2px] bg-white/10 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-gold rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="text-[11px] tracking-[0.3em] text-foreground/40">{progress}%</span>
    </div>
  );
}

const NAV = [
  { en: "Menu", ar: "القائمة", href: "#menu" },
  { en: "Reserve", ar: "احجز", href: "#reserve" },
];

export default function App() {
  const [lang, setLang] = useState<"en" | "ar">("en");
  const isAr = lang === "ar";
  const t = {
    menuKicker: isAr ? "القائمة" : "THE MENU",
    menuTitle: isAr ? "اختيارات 365" : "THE 365 SELECTION",
    menuSub: isAr
      ? "أطباق موقّعة، معكرونة، وحلويات — تُقدَّم كما يقدَّم فيلم."
      : "Signature plates, pasta, and dessert — plated the way a film is edited.",
    addToCart: isAr ? "أضف إلى الطلب" : "Add to Order",
    yourCart: isAr ? "طلبك" : "Your Order",
    empty: isAr ? "طلبك فارغ." : "Your order is empty.",
    subtotalLabel: isAr ? "المجموع الفرعي" : "Subtotal",
    discountLabel: isAr ? "الخصم" : "Discount",
    total: isAr ? "الإجمالي" : "Total",
    checkout: isAr ? "إتمام الطلب" : "Reserve & Order",
    nameField: isAr ? "الاسم" : "Name",
    phoneField: isAr ? "رقم الهاتف" : "Phone Number",
    addressField: isAr ? "العنوان" : "Address",
    pickupTimeField: isAr ? "وقت الاستلام" : "Pickup Time",
    requiredField: isAr ? "هذا الحقل مطلوب" : "This field is required",
    iqd: isAr ? "د.ع" : "IQD",
    loading: isAr ? "…جاري التحميل" : "Loading menu…",
    catAll: isAr ? "الكل" : "All",
    searchPlaceholder: isAr ? "ابحث عن طبق..." : "Search for a dish...",
    footerLine: isAr
      ? "365 · وُلد للحظات التي تستحق التوقف"
      : "365 · CRAFTED FOR MOMENTS WORTH PAUSING FOR",
  };

  const menuSectionRef = useRef<HTMLElement>(null);
  const menuGridRef = useRef<HTMLDivElement>(null);

  // --- GSAP ScrollTrigger for menu reveals ---
  useEffect(() => {
    if (!menuGridRef.current) return;

    const cards = menuGridRef.current.querySelectorAll<HTMLElement>("[data-reveal]");
    cards.forEach((el, i) => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
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

  // Menu data from Google Sheets
  const { items, loading, error, categories, discountTiers } = useMenuData();
  const { search, setSearch, activeCategory, setActiveCategory, filtered } = useMenuFilter(items);

  // Cart
  const [cart, setCart] = useState<Record<string, number>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [lightboxItem, setLightboxItem] = useState<MenuItem | null>(null);
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custAddress, setCustAddress] = useState("");
  const [custPickupTime, setCustPickupTime] = useState("");
  const [formErrors, setFormErrors] = useState<{ name?: boolean; phone?: boolean; address?: boolean; pickupTime?: boolean }>({});
  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const subtotal = items.reduce((sum, it) => sum + (cart[it.id] || 0) * it.price, 0);
  const discountState = getDiscountState(discountTiers, cartCount);
  const discountPercent = discountState?.currentPercent ?? 0;
  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const totalAfterDiscount = subtotal - discountAmount;
  const add = useCallback((id: string) => setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 })), []);
  const remove = useCallback(
    (id: string) =>
      setCart((c) => {
        const n = (c[id] || 0) - 1;
        const { [id]: _drop, ...rest } = c;
        return n <= 0 ? rest : { ...c, [id]: n };
      }),
    []
  );

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

    const orderLines = items
      .filter((it) => cart[it.id])
      .map((it) => {
        const name = isAr && it.nameAr ? it.nameAr : it.name;
        return `• ${name} x${cart[it.id]} — ${(it.price * cart[it.id]).toLocaleString()} IQD`;
      });

    const subtotalAmount = subtotal.toLocaleString();
    const totalAmount = totalAfterDiscount.toLocaleString();
    const msg = [
      `🍽 *365 Order*`,
      ``,
      `👤 *${custName}*`,
      `📞 ${custPhone}`,
      `📍 ${custAddress}`,
      `🕐 *${custPickupTime}*`,
      ``,
      `---`,
      ...orderLines,
      ``,
      `---`,
      `💵 *Subtotal: ${subtotalAmount} IQD*`,
      ...(discountPercent > 0
        ? [`🎉 *Discount (${discountPercent}%): -${discountAmount.toLocaleString()} IQD*`]
        : []),
      `💰 *Total: ${totalAmount} IQD*`,
    ].join("\n");

    const phone = "9647729204005";
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  }, [cart, items, custName, custPhone, custAddress, custPickupTime, subtotal, totalAfterDiscount, discountPercent, discountAmount, isAr]);
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
      className={`relative min-h-screen bg-noir text-foreground ${isAr ? "font-arabic" : ""}`}
      dir={isAr ? "rtl" : "ltr"}
      lang={isAr ? "ar" : "en"}
    >
      <LoadingScreen ready={!loading} progress={loading ? 30 : 100} />

      {/* Fixed floating navbar */}
      <header className="fixed top-4 inset-x-0 z-50 px-4 md:px-8">
        <div className="max-w-6xl mx-auto glass rounded-full px-5 md:px-8 py-3 flex items-center justify-between">
          <a href="#menu" className="flex items-center gap-2">
            <span
              className={`text-2xl md:text-3xl tracking-[0.25em] text-gold-glow ${isAr ? "font-arabic" : ""}`}
              style={{ fontFamily: isAr ? undefined : "var(--font-display)" }}
            >
              365
            </span>
          </a>
          <nav className="flex items-center gap-4 md:gap-8 text-[10px] md:text-[11px] tracking-[0.28em] text-foreground/70">
            {NAV.map((l) => (
              <a key={l.en} href={l.href} className="hover:text-foreground transition">
                {isAr ? l.ar : l.en.toUpperCase()}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLang(isAr ? "en" : "ar")}
              className="text-[11px] tracking-[0.25em] px-3 py-1 rounded-full border border-white/15 hover:border-gold/60 hover:text-gold transition"
            >
              {isAr ? "EN" : "ع"}
            </button>
          </div>
        </div>
      </header>

      {/* ============ MENU ============ */}
      <section ref={menuSectionRef} id="menu" className="relative bg-noir overflow-hidden">
        <Sparticles count={40} />
        <div className="relative pt-36 pb-16">
          <div className="max-w-4xl mx-auto text-center px-6 fade-up">
            <p className="text-[11px] tracking-[0.5em] text-gold mb-5">— {t.menuKicker} —</p>
            <h2
              className={`text-5xl md:text-7xl mb-4 ${isAr ? "font-arabic" : ""}`}
              style={{
                fontFamily: isAr ? undefined : "var(--font-display)",
                fontWeight: 300,
                letterSpacing: "0.02em",
              }}
            >
              {t.menuTitle}
            </h2>
            <div className="hairline max-w-xs mx-auto my-6" />
            <p className={`text-foreground/60 max-w-xl mx-auto ${isAr ? "font-arabic" : ""}`}>{t.menuSub}</p>
          </div>

          <CategoryFilter
            categories={categories}
            active={activeCategory}
            onSelect={setActiveCategory}
            isAr={isAr}
          />

          <div className="max-w-3xl mx-auto mt-6 px-6">
            <SearchBar
              value={search}
              onChange={setSearch}
              isAr={isAr}
              placeholder={t.searchPlaceholder}
            />
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 pb-24" ref={menuGridRef}>
          {loading && <LoadingSkeleton />}
          {error && <ErrorMessage message={error} onRetry={handleRetry} />}
          {!loading && !error && (
            <div className="grid md:grid-cols-2 gap-6 md:gap-8">
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
            <p className="text-center text-foreground/50 py-10 text-sm">No items found.</p>
          )}
          {!loading && !error && items.length === 0 && (
            <p className="text-center text-foreground/50 py-10 text-sm">No menu items available.</p>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer id="reserve" className="relative border-t border-white/5 bg-ink">
        <div className="max-w-6xl mx-auto px-6 py-14 text-center">
          <div
            className={`text-3xl tracking-[0.35em] text-gold-glow mb-3 ${isAr ? "font-arabic" : ""}`}
            style={{ fontFamily: isAr ? undefined : "var(--font-display)" }}
          >
            365
          </div>
          <p className={`text-[11px] tracking-[0.35em] text-foreground/50 ${isAr ? "font-arabic tracking-normal" : ""}`}>
            {t.footerLine}
          </p>
          <div className="hairline max-w-xs mx-auto my-6" />
          <p className="text-[10px] tracking-[0.3em] text-foreground/30 font-mono">
            © {new Date().getFullYear()} 365 · ALL RIGHTS RESERVED
          </p>
        </div>
      </footer>

      {/* Floating cart */}
      <button
        onClick={() => setCartOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full glass-strong text-gold grid place-items-center hover:scale-105 transition float-slow"
        aria-label="Open order"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
        {cartCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-gold text-primary-foreground text-[10px] w-5 h-5 rounded-full grid place-items-center font-semibold">
            {cartCount}
          </span>
        )}
      </button>

      {/* Cart drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setCartOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <aside
            className="drawer-in relative w-full max-w-md bg-ink border-l border-white/10 h-full shadow-2xl p-6 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3
                className={`text-2xl ${isAr ? "font-arabic" : ""}`}
                style={{ fontFamily: isAr ? undefined : "var(--font-display)", fontStyle: "italic" }}
              >
                {t.yourCart}
              </h3>
              <button onClick={() => setCartOpen(false)} className="text-foreground/50 hover:text-gold">✕</button>
            </div>
            <div className="space-y-4">
              {Object.keys(cart).length === 0 && (
                <p className="text-foreground/50 text-sm text-center py-10">{t.empty}</p>
              )}
              {items.filter((it) => cart[it.id]).map((it) => {
                const name = isAr && it.nameAr ? it.nameAr : it.name;
                return (
                  <div key={it.id} className="flex items-center gap-3 glass rounded-xl p-3">
                    {it.imageFileId ? (
                      <img
                        src={getDriveThumbnailUrl(it.imageFileId, 200)}
                        alt=""
                        className="w-14 h-14 rounded-lg object-cover"
                        onError={(e) => handleImageError(e, it.imageFileId)}
                      />
                    ) : it.imageUrl ? (
                      <img src={it.imageUrl} alt="" className="w-14 h-14 rounded-lg object-cover" />
                    ) : (
                      <img src={getPlaceholderImage()} alt="" className="w-14 h-14 rounded-lg object-cover opacity-50" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`truncate ${isAr ? "font-arabic" : ""}`}>{name}</p>
                      <p className="text-xs text-gold font-mono">{(it.price * cart[it.id]).toLocaleString()} {t.iqd}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => remove(it.id)} className="w-7 h-7 rounded-full border border-white/15 hover:border-gold hover:text-gold">−</button>
                      <span className="w-5 text-center text-sm">{cart[it.id]}</span>
                      <button onClick={() => add(it.id)} className="w-7 h-7 rounded-full border border-white/15 hover:border-gold hover:text-gold">+</button>
                    </div>
                  </div>
                );
              })}
            </div>
            {cartCount > 0 && (
              <div className="mt-8 space-y-4">
                <div className="hairline" />
                <DiscountEncouragement tiers={discountTiers} quantity={cartCount} isAr={isAr} />
                <div className="flex items-center justify-between">
                  <span className="text-xs tracking-[0.3em] text-foreground/60">{t.subtotalLabel.toUpperCase()}</span>
                  <span className="text-sm text-foreground/80 font-mono">{subtotal.toLocaleString()} {t.iqd}</span>
                </div>
                {discountPercent > 0 && (
                  <div className="flex items-center justify-between text-gold">
                    <span className="text-xs tracking-[0.3em]">{t.discountLabel.toUpperCase()} ({discountPercent}%)</span>
                    <span className="text-sm font-mono">-{discountAmount.toLocaleString()} {t.iqd}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs tracking-[0.3em] text-foreground/60">{t.total.toUpperCase()}</span>
                  <span className="text-2xl text-gold font-mono">{totalAfterDiscount.toLocaleString()} {t.iqd}</span>
                </div>
                <div className="space-y-3 pt-2">
                  <div>
                    <input
                      type="text"
                      placeholder={t.nameField}
                      value={custName}
                      onChange={(e) => { setCustName(e.target.value); setFormErrors((p) => ({ ...p, name: false })); }}
                      className={`w-full bg-white/5 border ${formErrors.name ? "border-red-500" : "border-white/10"} rounded-xl px-4 py-3 text-sm text-foreground placeholder-foreground/30 focus:outline-none focus:border-gold/50 transition`}
                    />
                    {formErrors.name && <p className="text-red-400 text-[10px] mt-1">{t.requiredField}</p>}
                  </div>
                  <div>
                    <input
                      type="tel"
                      placeholder={t.phoneField}
                      value={custPhone}
                      onChange={(e) => { setCustPhone(e.target.value); setFormErrors((p) => ({ ...p, phone: false })); }}
                      className={`w-full bg-white/5 border ${formErrors.phone ? "border-red-500" : "border-white/10"} rounded-xl px-4 py-3 text-sm text-foreground placeholder-foreground/30 focus:outline-none focus:border-gold/50 transition`}
                    />
                    {formErrors.phone && <p className="text-red-400 text-[10px] mt-1">{t.requiredField}</p>}
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder={t.addressField}
                      value={custAddress}
                      onChange={(e) => { setCustAddress(e.target.value); setFormErrors((p) => ({ ...p, address: false })); }}
                      className={`w-full bg-white/5 border ${formErrors.address ? "border-red-500" : "border-white/10"} rounded-xl px-4 py-3 text-sm text-foreground placeholder-foreground/30 focus:outline-none focus:border-gold/50 transition`}
                    />
                    {formErrors.address && <p className="text-red-400 text-[10px] mt-1">{t.requiredField}</p>}
                  </div>
                  <div>
                    <input
                      type="time"
                      value={custPickupTime}
                      onChange={(e) => { setCustPickupTime(e.target.value); setFormErrors((p) => ({ ...p, pickupTime: false })); }}
                      className={`w-full bg-white/5 border ${formErrors.pickupTime ? "border-red-500" : "border-white/10"} rounded-xl px-4 py-3 text-sm text-foreground placeholder-foreground/30 focus:outline-none focus:border-gold/50 transition ${isAr ? "direction-rtl" : ""}`}
                    />
                    {!custPickupTime && <p className="text-foreground/30 text-[10px] mt-1">{t.pickupTimeField}</p>}
                    {formErrors.pickupTime && <p className="text-red-400 text-[10px] mt-1">{t.requiredField}</p>}
                  </div>
                </div>
                <button
                  onClick={sendOrderWhatsApp}
                  className={`w-full rounded-full bg-gold text-primary-foreground py-3.5 text-[11px] tracking-[0.35em] hover:bg-gold-soft transition ${isAr ? "font-arabic tracking-normal" : "uppercase"}`}
                >
                  {t.checkout}
                </button>
              </div>
            )}
          </aside>
        </div>
      )}

      {lightboxItem && (
        <MenuLightbox
          item={lightboxItem}
          isAr={isAr}
          onClose={() => setLightboxItem(null)}
          onAddToCart={add}
          iqdLabel={t.iqd}
          addToCartLabel={t.addToCart}
        />
      )}
    </div>
  );
}
