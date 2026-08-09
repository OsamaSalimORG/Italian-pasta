import { useEffect, useRef, useState, useCallback } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { FrameCanvas } from "@/components/FrameSequence";
import { useMenuData, useMenuFilter } from "@/hooks/use-menu";
import { SearchBar } from "@/components/SearchBar";
import { CategoryFilter } from "@/components/CategoryFilter";
import { MenuCard } from "@/components/MenuCard";
import { MenuLightbox } from "@/components/MenuLightbox";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { ErrorMessage } from "@/components/ErrorMessage";
import { Sparticles } from "@/components/Sparticles";
import { getDriveThumbnailUrl, getDriveImageFallbackUrl, getPlaceholderImage, handleImageError } from "@/services/google-drive";
import type { MenuItem } from "@/types/menu";

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
        COVO
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
    tagline: isAr ? "مطعم كوفو · تجربة سينمائية فاخرة" : "Restaurant & Lounge",
    hero1: isAr ? "خطوة" : "STEP",
    hero2: isAr ? "إلى الداخل" : "INSIDE",
    scrollHint: isAr ? "مرّر للدخول" : "SCROLL TO ENTER",
    goToMenu: isAr ? "عرض القائمة" : "Go to Menu",
    chapter1Title: isAr ? "الواجهة" : "THE FAÇADE",
    chapter1Body: isAr
      ? "حجر منحوت. ضوء دافئ. مساء يبدأ بلمسة كاميرا."
      : "Hand-cut stone. Warm light. An evening that begins with a single frame.",
    chapter2Title: isAr ? "الدخول" : "CROSS THE THRESHOLD",
    chapter2Body: isAr
      ? "خطوة واحدة تفصل بين المدينة والصمت المضاء."
      : "One step separates the city from the lit-in silence.",
    chapter3Title: isAr ? "المطبخ الحيّ" : "THE LIVE KITCHEN",
    chapter3Body: isAr
      ? "قوس من الحجر يفتح على مسرح النار والدقة."
      : "A stone arch opens onto a stage of fire and precision.",
    menuKicker: isAr ? "القائمة" : "THE MENU",
    menuTitle: isAr ? "مذاق كوفو" : "THE COVO SELECTION",
    menuSub: isAr
      ? "أطباق موقّعة، معكرونة، وحلويات — تُقدَّم كما يقدَّم فيلم."
      : "Signature plates, pasta, and dessert — plated the way a film is edited.",
    addToCart: isAr ? "أضف إلى الطلب" : "Add to Order",
    yourCart: isAr ? "طلبك" : "Your Order",
    empty: isAr ? "طلبك فارغ." : "Your order is empty.",
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
      ? "كوفو · وُلد للحظات التي تستحق التوقف"
      : "COVO · CRAFTED FOR MOMENTS WORTH PAUSING FOR",
  };

  // --- Refs for zero-render scroll progress ---
  const progressRef = useRef(0);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const chapter1Ref = useRef<HTMLDivElement>(null);
  const chapter2Ref = useRef<HTMLDivElement>(null);
  const chapter3Ref = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const progressTextRef = useRef<HTMLSpanElement>(null);
  const cinemaRef = useRef<HTMLDivElement>(null);
  const canvasScaleRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lenisRef = useRef<any>(null);
  const menuSectionRef = useRef<HTMLElement>(null);
  const menuGridRef = useRef<HTMLDivElement>(null);

  // Smooth scroll via lenis
  useEffect(() => {
    let raf = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let lenis: any = null;
    let cancelled = false;
    const mobile = window.innerWidth < 768;
    import("lenis").then(({ default: Lenis }) => {
      if (cancelled) return;
      lenis = new Lenis({
        lerp: mobile ? 0.08 : 0.06,
        wheelMultiplier: mobile ? 0.5 : 0.7,
        smoothWheel: true,
        touchMultiplier: 1.2,
        duration: 1.8,
      });
      lenisRef.current = lenis;
      const loop = (t: number) => {
        lenis?.raf(t);
        ScrollTrigger.update();
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      lenisRef.current = null;
      lenis?.destroy();
    };
  }, []);

  // --- GSAP ScrollTrigger for cinematic section (zero React re-renders) ---
  useEffect(() => {
    const cinema = cinemaRef.current;
    const canvasContainer = canvasScaleRef.current;
    if (!cinema || !canvasContainer) return;

    const mobile = window.innerWidth < 768;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: cinema,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.3,
        onUpdate: (self) => {
          progressRef.current = self.progress;
        },
      },
    });

    // Canvas scale — GPU-composited only
    tl.to(canvasContainer, { scale: 1.14, ease: "none", duration: 1 }, 0);

    // Chapter reveals — opacity + translateY only
    const chapters = [chapter1Ref, chapter2Ref, chapter3Ref];
    const ranges: [number, number][] = mobile
      ? [[0, 0.25], [0.3, 0.55], [0.6, 0.85]]
      : [[0, 0.22], [0.28, 0.48], [0.5, 0.7]];

    chapters.forEach((ref, i) => {
      if (!ref.current) return;
      const [start, end] = ranges[i];
      if (i === 0) {
        // Hero text: visible immediately, only fade out on scroll
        gsap.set(ref.current, { opacity: 1, y: 0 });
      } else {
        gsap.fromTo(
          ref.current,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            ease: "power1.out",
            scrollTrigger: {
              trigger: cinema,
              start: `top+=${start * 100}% top`,
              end: `top+=${end * 100}% top`,
              scrub: true,
            },
          }
        );
      }
      // Fade out
      gsap.to(ref.current, {
        opacity: 0,
        ease: "power1.in",
        scrollTrigger: {
          trigger: cinema,
          start: `top+=${end * 100}% top`,
          end: `top+=${end * 100 + 0.06 * 100}% top`,
          scrub: true,
        },
      });
    });

    // Progress bar
    if (progressBarRef.current) {
      tl.to(progressBarRef.current, { scaleY: 1, ease: "none", duration: 1 }, 0);
    }

    // ScrollTrigger for progress text
    ScrollTrigger.create({
      trigger: cinema,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        if (progressTextRef.current) {
          progressTextRef.current.textContent =
            String(Math.round(self.progress * 100)).padStart(2, "0") + "%";
        }
      },
    });

    return () => {
      tl.kill();
      ScrollTrigger.getAll().forEach((s) => s.kill());
    };
  }, []);

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
  const { items, loading, error, categories } = useMenuData();
  const { search, setSearch, activeCategory, setActiveCategory, filtered } = useMenuFilter(items);

  // Preload ALL frames + menu data
  const [loadProgress, setLoadProgress] = useState(0);
  const [pageReady, setPageReady] = useState(false);

  useEffect(() => {
    const base = import.meta.env.BASE_URL;
    const total = 86;
    let loaded = 0;

    const promises = Array.from({ length: total }, (_, i) => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = img.onerror = () => {
          loaded++;
          setLoadProgress(Math.round((loaded / total) * 100));
          resolve();
        };
        img.src = `${base}frames/frame-${String(i + 1).padStart(3, "0")}.jpg`;
      });
    });

    Promise.all(promises).then(() => setPageReady(true));
  }, []);

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

    const totalAmount = subtotal.toLocaleString();
    const msg = [
      `🍽 *COVO Order*`,
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
      `💰 *Total: ${totalAmount} IQD*`,
    ].join("\n");

    const phone = "9647729204005";
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  }, [cart, items, custName, custPhone, custAddress, custPickupTime, subtotal, isAr]);
  useEffect(() => {
    if (filtered.length > 0) {
      requestAnimationFrame(() => ScrollTrigger.refresh());
    }
  }, [filtered.length]);

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div
      className={`relative min-h-screen bg-noir text-foreground ${isAr ? "font-arabic" : ""}`}
      dir={isAr ? "rtl" : "ltr"}
      lang={isAr ? "ar" : "en"}
    >
      <LoadingScreen ready={pageReady && !loading} progress={loadProgress} />

      {/* Fixed floating navbar */}
      <header className="fixed top-4 inset-x-0 z-50 px-4 md:px-8">
        <div className="max-w-6xl mx-auto glass rounded-full px-5 md:px-8 py-3 flex items-center justify-between">
          <a href="#top" className="flex items-center gap-2">
            <span
              className={`text-2xl md:text-3xl tracking-[0.25em] text-gold-glow ${isAr ? "font-arabic" : ""}`}
              style={{ fontFamily: isAr ? undefined : "var(--font-display)" }}
            >
              COVO
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

      {/* ============ CINEMATIC SCROLL ============ */}
      <section
        id="top"
        ref={cinemaRef}
        className="relative"
        style={{ height: isMobile ? "300vh" : "500vh" }}
      >
        <div className="sticky top-0 h-[100dvh] w-full overflow-hidden">
          <div
            ref={canvasScaleRef}
            className="absolute inset-0 will-change-transform pointer-events-none"
            style={{ transformOrigin: "center center" }}
          >
            <FrameCanvas progressRef={progressRef} className="w-full h-full block" />
          </div>

          <div className="pointer-events-none absolute inset-0"
               style={{
                 background:
                   "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55) 100%), linear-gradient(180deg, rgba(0,0,0,0.35) 0%, transparent 20%, transparent 70%, rgba(0,0,0,0.7) 100%)",
               }}
          />
          <div className="pointer-events-none absolute inset-0 bg-radial-gold opacity-70 mix-blend-screen" />

          {/* Chapter 1 */}
          <div
            ref={chapter1Ref}
            className="absolute inset-0 flex flex-col items-center justify-center pt-24 md:pt-0 text-center px-6 will-change-[opacity,transform] pointer-events-auto"
          >
            <p className="text-[11px] tracking-[0.5em] text-gold/80 mb-6" style={{ textShadow: "0 0 12px rgba(212,168,67,0.7), 0 0 30px rgba(212,168,67,0.4)" }}>{t.tagline}</p>
            <h1
              className={`text-6xl md:text-[9rem] leading-[0.9] text-gold-glow ${isAr ? "font-arabic" : ""}`}
              style={{ fontFamily: isAr ? undefined : "var(--font-display)", fontWeight: 400, letterSpacing: "0.02em" }}
            >
              {t.hero1}
              <br />
              <span className="italic text-foreground/95">{t.hero2}</span>
            </h1>
            <div className="mt-10 flex flex-col items-center gap-3 text-[11px] tracking-[0.4em] text-gold glow-pulse-strong">
              <span className="w-10 h-px bg-gold/80" />
              {t.scrollHint}
              <span className="w-10 h-px bg-gold/80" />
              <svg
                width="44"
                height="44"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-gold mt-2 bounce-arrow drop-shadow-[0_0_16px_rgba(212,168,67,1)] drop-shadow-[0_0_40px_rgba(212,168,67,0.6)]"
              >
                <path d="M12 5v14" />
                <path d="m19 12-7 7-7-7" />
              </svg>
              <button
                onClick={() => {
                  const el = menuSectionRef.current;
                  if (el) {
                    lenisRef.current?.scrollTo(el, {
                      offset: 0,
                      duration: 2.5,
                      onComplete: () => {
                        ScrollTrigger.refresh(true);
                      },
                    });
                  }
                }}
                className="mt-4 px-6 py-2 rounded-full border border-gold/40 text-gold text-[11px] tracking-[0.25em] hover:bg-gold/10 hover:border-gold/70 transition pointer-events-auto relative z-50"
                style={{ textShadow: "0 0 12px rgba(212,168,67,0.6), 0 0 30px rgba(212,168,67,0.3)" }}
              >
                {t.goToMenu}
              </button>
            </div>
          </div>

          {/* Chapter 2 */}
          <div
            ref={chapter2Ref}
            className="absolute inset-x-0 bottom-24 flex flex-col items-center justify-end text-center px-6 will-change-[opacity,transform] pointer-events-none"
          >
            <div className="rounded-2xl px-8 py-6 max-w-xl" style={{ backdropFilter: "blur(20px) saturate(120%)", background: "rgba(10,8,6,0.7)" }}>
              <p className="text-[10px] tracking-[0.5em] text-gold mb-3">— 01 —</p>
              <h2
                className={`text-3xl md:text-5xl mb-3 ${isAr ? "font-arabic" : ""}`}
                style={{ fontFamily: isAr ? undefined : "var(--font-display)", fontStyle: "italic" }}
              >
                {t.chapter1Title}
              </h2>
              <p className={`text-sm md:text-base text-foreground/70 ${isAr ? "font-arabic" : ""}`}>{t.chapter1Body}</p>
            </div>
          </div>

          {/* Chapter 3 */}
          <div
            ref={chapter3Ref}
            className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex flex-col items-center text-center px-6 will-change-[opacity,transform] pointer-events-none"
          >
            <div className="rounded-2xl px-8 py-6 max-w-xl" style={{ backdropFilter: "blur(20px) saturate(120%)", background: "rgba(10,8,6,0.7)" }}>
              <p className="text-[10px] tracking-[0.5em] text-gold mb-3">— 02 —</p>
              <h2
                className={`text-3xl md:text-5xl mb-3 ${isAr ? "font-arabic" : ""}`}
                style={{ fontFamily: isAr ? undefined : "var(--font-display)", fontStyle: "italic" }}
              >
                {t.chapter2Title}
              </h2>
              <p className={`text-sm md:text-base text-foreground/70 ${isAr ? "font-arabic" : ""}`}>{t.chapter2Body}</p>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="absolute top-1/2 right-4 md:right-8 -translate-y-1/2 flex flex-col items-center gap-3">
            <div className="w-px h-40 bg-white/10 relative overflow-hidden">
              <div
                ref={progressBarRef}
                className="absolute top-0 left-0 w-full bg-gold will-change-transform"
                style={{ transform: "scaleY(0)", transformOrigin: "top", boxShadow: "0 0 10px var(--gold)" }}
              />
            </div>
            <span ref={progressTextRef} className="text-[9px] tracking-[0.3em] text-foreground/40 [writing-mode:vertical-rl]">
              00%
            </span>
          </div>
        </div>
      </section>

      {/* ============ MENU ============ */}
      <section ref={menuSectionRef} id="menu" className="relative bg-noir overflow-hidden">
        <Sparticles count={40} />
        <div className="relative -mt-24 pt-24 pb-16">
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
            COVO
          </div>
          <p className={`text-[11px] tracking-[0.35em] text-foreground/50 ${isAr ? "font-arabic tracking-normal" : ""}`}>
            {t.footerLine}
          </p>
          <div className="hairline max-w-xs mx-auto my-6" />
          <p className="text-[10px] tracking-[0.3em] text-foreground/30 font-mono">
            © {new Date().getFullYear()} COVO · ALL RIGHTS RESERVED
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
                <div className="flex items-center justify-between">
                  <span className="text-xs tracking-[0.3em] text-foreground/60">{t.total.toUpperCase()}</span>
                  <span className="text-2xl text-gold font-mono">{subtotal.toLocaleString()} {t.iqd}</span>
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
