'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, Suspense } from 'react';
import { Star } from 'lucide-react';
import { MapPin, Phone, Mail, ExternalLink } from 'lucide-react';

const HERO_HEADLINE_LINES = ['Enjoy hundreds of', 'flavors under', 'one roof'] as const;
const HERO_TYPING_SPEED_MS = 75;
const HERO_NEXT_LINE_DELAY_MS = 220;
const HERO_HOLD_DELAY_MS = 1800;
const HERO_DELETE_SPEED_MS = 40;
const HERO_RESTART_DELAY_MS = 420;
const HERO_STATS_REVEAL_DELAY_MS = 420;
const FEATURE_CARD_STAGGER_MS = 300;
const FEATURE_CARD_FADE_MIN_MS = 550;
const FEATURE_CARD_FADE_MAX_MS = 1100;

function LandingPage() {
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [scrollProgress, setScrollProgress] = useState(0);
  const [typedHeadline, setTypedHeadline] = useState<string[]>(
    () => HERO_HEADLINE_LINES.map(() => '')
  );
  const [activeHeadlineLine, setActiveHeadlineLine] = useState(0);
  const [showHeroCopy, setShowHeroCopy] = useState(false);
  const [showHeroStats, setShowHeroStats] = useState(false);
  const [showFeatureCards, setShowFeatureCards] = useState(false);
  const [visibleSections, setVisibleSections] = useState<{ [key: string]: boolean }>({
    hero: false,
    features: false,
    about: false,
    footer: false,
  });
  const featureStripRef = useRef<HTMLElement | null>(null);
  const tickerItems = [
    'Dine-In - Takeaway - Delivery',
    'Halal Certified',
    'Open 7 Days a Week',
    "Miri's Favourite Restaurant",
    'Western & Traditional Fusion',
  ];
  const featureCards = [
    {
      title: 'Master Chefs',
      copy: 'Crafted by experienced chefs, consistent quality.',
      cardClass: 'px-8 py-10',
      icon: (
        <img
          src="/chef.svg"
          alt=""
          width={28}
          height={28}
          className="h-7 w-7 object-contain"
          aria-hidden="true"
        />
      ),
    },
    {
      title: 'Quality Food',
      copy: 'Fresh ingredients with great taste in every bite.',
      cardClass: 'border-t border-[#d4af37]/20 px-8 py-10 md:border-l md:border-t-0 lg:border-[#d4af37]/25',
      icon: (
        <img
          src="/dinner.svg"
          alt=""
          width={28}
          height={28}
          className="h-7 w-7 object-contain"
          aria-hidden="true"
        />
      ),
    },
    {
      title: 'Online Order',
      copy: 'Order from the table and track your order easily.',
      cardClass: 'border-t border-[#d4af37]/20 px-8 py-10 lg:border-l lg:border-t-0 lg:border-[#d4af37]/25',
      icon: (
        <img
          src="/shopping-cart.svg"
          alt=""
          width={28}
          height={28}
          className="h-7 w-7 object-contain"
          aria-hidden="true"
        />
      ),
    },
    {
      title: '24/7 Service',
      copy: 'Support for your dining flow whenever needed.',
      cardClass: 'border-t border-[#d4af37]/20 px-8 py-10 md:border-l lg:border-t-0 lg:border-[#d4af37]/25',
      icon: (
        <img
          src="/24h-service.svg"
          alt=""
          width={28}
          height={28}
          className="h-7 w-7 object-contain"
          aria-hidden="true"
        />
      ),
    },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setScrollProgress(scrolled);

      // Check which sections are in view
      const sections = document.querySelectorAll('[data-section]');
      const newVisibleSections: { [key: string]: boolean } = { ...visibleSections };

      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        const sectionId = section.getAttribute('data-section');

        // Trigger animation when section is in view (top < 80% of viewport)
        if (sectionId && rect.top < window.innerHeight * 0.8 && rect.bottom > 0) {
          newVisibleSections[sectionId] = true;
        }
      });

      setVisibleSections(newVisibleSections);
    };

    window.addEventListener('scroll', handleScroll);
    // Initial check
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('localCart');
      if (stored) {
        setCart(JSON.parse(stored));
        // Trigger navbar update just in case
        window.dispatchEvent(new Event('cartUpdated'));
      }
    }
  }, []);

  useEffect(() => {
    const featureStrip = featureStripRef.current;
    if (!featureStrip) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShowFeatureCards(true);
          observer.unobserve(entry.target);
        }
      },
      {
        threshold: 0.28,
        rootMargin: '0px 0px -8% 0px',
      }
    );

    observer.observe(featureStrip);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visibleSections.hero) {
      return;
    }

    const emptyLines = HERO_HEADLINE_LINES.map(() => '');
    let stepTimer: ReturnType<typeof setTimeout> | null = null;
    let statsTimer: ReturnType<typeof setTimeout> | null = null;
    let lineIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let isCancelled = false;
    let hasRevealedHeroContent = false;

    const setLineValue = (index: number, value: string) => {
      setTypedHeadline((prev) => {
        const next = [...prev];
        next[index] = value;
        return next;
      });
    };

    const schedule = (delay: number, callback: () => void) => {
      stepTimer = setTimeout(callback, delay);
    };

    const runStep = () => {
      if (isCancelled) {
        return;
      }

      const currentLine = HERO_HEADLINE_LINES[lineIndex];

      if (!isDeleting) {
        if (charIndex < currentLine.length) {
          charIndex += 1;
          setActiveHeadlineLine(lineIndex);
          setLineValue(lineIndex, currentLine.slice(0, charIndex));
          schedule(HERO_TYPING_SPEED_MS, runStep);
          return;
        }

        if (lineIndex < HERO_HEADLINE_LINES.length - 1) {
          lineIndex += 1;
          charIndex = 0;
          setActiveHeadlineLine(lineIndex);
          schedule(HERO_NEXT_LINE_DELAY_MS, runStep);
          return;
        }

        if (!hasRevealedHeroContent) {
          hasRevealedHeroContent = true;
          setShowHeroCopy(true);
          if (statsTimer) {
            clearTimeout(statsTimer);
          }
          statsTimer = setTimeout(() => {
            if (!isCancelled) {
              setShowHeroStats(true);
            }
          }, HERO_STATS_REVEAL_DELAY_MS);
        }

        isDeleting = true;
        schedule(HERO_HOLD_DELAY_MS, runStep);
        return;
      }

      if (charIndex > 0) {
        charIndex -= 1;
        setActiveHeadlineLine(lineIndex);
        setLineValue(lineIndex, currentLine.slice(0, charIndex));
        schedule(HERO_DELETE_SPEED_MS, runStep);
        return;
      }

      if (lineIndex > 0) {
        lineIndex -= 1;
        charIndex = HERO_HEADLINE_LINES[lineIndex].length;
        setLineValue(lineIndex + 1, '');
        setActiveHeadlineLine(lineIndex);
        schedule(HERO_TYPING_SPEED_MS, runStep);
        return;
      }

      setTypedHeadline(emptyLines);
      setActiveHeadlineLine(0);
      isDeleting = false;
      schedule(HERO_RESTART_DELAY_MS, runStep);
    };

    schedule(HERO_NEXT_LINE_DELAY_MS, () => {
      if (isCancelled) {
        return;
      }
      setTypedHeadline(emptyLines);
      setShowHeroCopy(false);
      setShowHeroStats(false);
      setActiveHeadlineLine(0);
      runStep();
    });

    return () => {
      isCancelled = true;
      if (stepTimer) {
        clearTimeout(stepTimer);
      }
      if (statsTimer) {
        clearTimeout(statsTimer);
      }
    };
  }, [visibleSections.hero]);

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white overflow-x-hidden selection:bg-amber-400 selection:text-black">
      {/* Navbar is now global in layout.tsx */}
      {/* Scroll Progress Bar */}
      <div
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 z-50 transition-all duration-300"
        style={{ width: `${scrollProgress}%` }}
      />

      <style>{`
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        @keyframes ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes hero-cursor-blink {
          0%, 48% { opacity: 1; }
          49%, 100% { opacity: 0; }
        }

        .feature-card { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .feature-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 25px rgba(245, 158, 11, 0.15);
        }

        .btn-hover {
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .btn-hover:hover { transform: scale(1.05); }

        .btn-hover::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: rgba(255, 255, 255, 0.1);
          transition: left 0.3s ease;
          z-index: -1;
        }

        .btn-hover:hover::before { left: 100%; }

        .hero-cta {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 9999px;
          padding: 0.75rem 2.2rem;
          font-family: 'Cormorant Garamond', 'Baskerville', 'Times New Roman', serif;
          font-size: 1.15rem;
          font-weight: 600;
          letter-spacing: 0.02em;
          line-height: 1;
          transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.28s ease, border-color 0.28s ease, color 0.28s ease, background 0.28s ease;
          will-change: transform;
        }

        .hero-cta::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          opacity: 0;
          transition: opacity 0.28s ease;
          pointer-events: none;
        }

        .hero-cta:hover {
          transform: translateY(-3px) scale(1.01);
        }

        .hero-cta:focus-visible {
          outline: 2px solid rgba(250, 204, 21, 0.75);
          outline-offset: 2px;
        }

        .hero-cta-primary {
          color: #d4af37;
          border: 1px solid rgba(212, 175, 55, 0.8);
          background: transparent;
          shadow: 0 8px 20px rgba(212, 175, 55, 0.18);
        }

        .hero-cta-primary:hover {
          background: rgba(212, 175, 55, 0.1);
          color: #d4af37;
          transform: translateY(-2px) scale(1.05);
          box-shadow: 0 12px 25px rgba(212, 175, 55, 0.25);
        }

        .hero-cta-secondary {
          color: #f6efe2;
          border: 1px solid rgba(243, 226, 191, 0.26);
          background: linear-gradient(145deg, rgba(35, 44, 67, 0.78), rgba(17, 24, 44, 0.72));
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 8px 24px rgba(7, 10, 21, 0.4);
          backdrop-filter: blur(8px);
        }

        .hero-cta-secondary:hover {
          border-color: rgba(249, 220, 163, 0.5);
          color: #fff6e8;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.14), 0 12px 30px rgba(10, 14, 28, 0.48);
        }

        .hero-cta-secondary::after {
          background: radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.18), transparent 62%);
        }

        .hero-cta-secondary:hover::after {
          opacity: 1;
        }

        @media (max-width: 640px) {
          .hero-cta {
            padding: 0.72rem 1.3rem;
            font-size: 0.95rem;
            letter-spacing: 0.03em;
          }
        }

        .ticker-track {
          width: max-content;
          animation: ticker-scroll 28s linear infinite;
        }

        .ticker-wrap:hover .ticker-track {
          animation-play-state: paused;
        }

        .feature-strip-card {
          opacity: 0;
          transform: translateY(28px);
          transition-property: opacity, transform;
          transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
          will-change: opacity, transform;
        }

        .feature-strip-card.is-visible {
          opacity: 1;
          transform: translateY(0);
        }

        .feature-slice {
          position: relative;
          isolation: isolate;
          transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .feature-slice::before {
          content: '';
          position: absolute;
          inset: 10px 10px;
          border-radius: 18px;
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.09), rgba(255, 255, 255, 0.015));
          opacity: 0;
          transform: scale(0.98);
          transition: opacity 0.3s ease, transform 0.3s ease;
          z-index: -1;
        }

        .feature-slice:hover {
          transform: translateY(-7px);
        }

        .feature-slice:hover::before {
          opacity: 1;
          transform: scale(1);
        }

        .feature-slice-icon {
          transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .feature-slice:hover .feature-slice-icon {
          transform: translateY(-2px) scale(1.07);
        }

        .feature-slice-title {
          font-family: 'Cormorant Garamond', 'Baskerville', 'Times New Roman', serif;
          transition: color 0.3s ease, transform 0.3s ease;
        }

        .feature-slice:hover .feature-slice-title {
          color: #fff5e4;
          transform: translateX(2px);
        }

        .feature-slice-copy {
          transition: color 0.3s ease;
        }

        .feature-slice:hover .feature-slice-copy {
          color: #eadfd0;
        }

        .hero-premium-title {
          font-family: 'Cormorant Garamond', 'Baskerville', 'Times New Roman', serif;
          font-weight: 700;
          letter-spacing: -0.015em;
          line-height: 0.98;
          text-shadow: 0 12px 36px rgba(0, 0, 0, 0.38);
        }

        .hero-premium-copy {
          font-family: 'Libre Baskerville', 'Palatino Linotype', 'Book Antiqua', serif;
          font-size: clamp(1.2rem, 1.1vw, 1.42rem);
          line-height: 1.82;
          letter-spacing: 0.004em;
          color: #ffffff;
          text-shadow: 0 6px 22px rgba(0, 0, 0, 0.26);
        }

        .hero-type-cursor {
          display: inline-block;
          width: 2px;
          height: 0.9em;
          margin-left: 0.18em;
          background: #d4af37;
          box-shadow: 0 0 10px rgba(212, 175, 55, 0.65);
          vertical-align: baseline;
          animation: hero-cursor-blink 0.9s steps(1, end) infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .ticker-track { animation: none; }
          .hero-type-cursor { animation: none; opacity: 1; }
          .feature-strip-card,
          .feature-strip-card.is-visible {
            opacity: 1;
            transform: none;
            transition: none;
          }
        }
      `}</style>



      {/* Hero - Full Screen */}
      <section
        id="home"
        className="relative overflow-hidden min-h-screen flex items-center"
        data-section="hero"
      >
        <div className="pointer-events-none absolute inset-0">
          <video
            className="absolute inset-0 h-full w-full object-cover opacity-50"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          >
            <source src="/hero-bg.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-r from-[#0b0f19] via-[#0b0f19]/80 to-transparent" />

          <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-amber-500/20 blur-3xl" />
          <div className="absolute -right-24 top-24 h-80 w-80 rounded-full bg-orange-600/20 blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 w-full lg:grid-cols-2 lg:items-center">
          {/* Left Column: Content */}
          <div
            className={`animate-slide-left ${visibleSections.hero ? 'visible' : ''}`}
            style={{ animationDelay: visibleSections.hero ? '0.1s' : '0s' }}
          >
            <h1
              className="hero-premium-title mt-6 text-[2.8rem] sm:text-[4rem] lg:text-[5.2rem]"
              aria-label={HERO_HEADLINE_LINES.join(' ')}
            >
              {HERO_HEADLINE_LINES.map((line, index) => (
                <span
                  key={line}
                  className={`block min-h-[1.02em] ${index === 1 ? 'text-[#d4af37]' : ''}`}
                >
                  {typedHeadline[index]}
                  {activeHeadlineLine === index && (
                    <span aria-hidden="true" className="hero-type-cursor" />
                  )}
                </span>
              ))}
            </h1>
            <p
              className={`hero-premium-copy mt-8 max-w-xl transition-all duration-700 ease-out ${
                showHeroCopy ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              Discover chef-crafted dishes, quick ordering, and a smooth dining
              experience. Browse the menu, place your order, and we'll handle the
              rest.
            </p>

            <div
              className={`mt-8 hidden lg:flex flex-wrap items-center gap-4 transition-all duration-700 ease-out ${
                showHeroCopy ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
              }`}
            >
              <Link
                href={`/menu`}
                className="hero-cta hero-cta-primary"
              >
                Browse Menu
              </Link>
              <a
                href="#about"
                className="hero-cta hero-cta-secondary"
              >
                Read More
              </a>
            </div>

            {/* Mobile Buttons */}
            <div 
              className={`flex lg:hidden flex-nowrap items-center gap-2.5 mt-8 transition-all duration-700 ease-out ${
                showHeroCopy ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
              }`}
            >
              <Link
                href={`/menu`}
                className="hero-cta hero-cta-primary"
              >
                Browse Menu
              </Link>
              <a
                href="#about"
                className="hero-cta hero-cta-secondary"
              >
                Read More
              </a>
            </div>

            {/* Mobile Hero Stats - Now only on mobile column */}
            <div 
              className={`grid lg:hidden grid-cols-3 gap-3 mt-8 transition-all duration-700 ease-out ${
                showHeroStats ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5 pointer-events-none'
              }`}
            >
              {[
                { label: 'YEARS OF FLAVOUR', value: '10' },
                { label: 'MASTER CHEFS', value: '15' },
                { label: 'GOOGLE RATING', value: '4.8', icon: true },
              ].map((stat, i) => (
                <div key={i} className="border border-white/10 bg-white/10 p-3 backdrop-blur-md shadow-lg">
                  <div className="flex flex-col items-center text-center">
                    <div className="flex items-center gap-1">
                      <span className="font-serif text-xl font-bold text-[#d4af37]">
                        {stat.value}
                      </span>
                      {stat.icon && <Star size={12} fill="#d4af37" className="text-[#d4af37]" />}
                    </div>
                    <span className="font-sans mt-1 text-[0.5rem] font-bold tracking-[0.05em] text-white/50 uppercase leading-none">
                      {stat.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Desktop Stats */}
          <div 
            className={`hidden lg:flex items-end justify-end h-full pb-1.5 transition-all duration-700 ease-out ${
              showHeroStats ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8 pointer-events-none'
            }`}
          >
            <div className="grid grid-cols-3 gap-5 max-w-[440px] w-full">
              {[
                { label: 'YEARS OF FLAVOUR', value: '10' },
                { label: 'MASTER CHEFS', value: '15' },
                { label: 'GOOGLE RATING', value: '4.8', icon: true },
              ].map((stat, i) => (
                <div key={i} className="aspect-square relative group overflow-hidden border border-white/10 bg-white/10 p-5 backdrop-blur-xl transition-all hover:bg-white/20 hover:border-[#d4af37]/40 flex flex-col items-center justify-center text-center shadow-2xl">
                  <div className="flex flex-col items-center text-center">
                    <div className="flex items-center gap-1.5">
                      <span className="font-serif text-4xl font-bold text-[#d4af37]">
                        {stat.value}
                      </span>
                      {stat.icon && <Star size={22} fill="#d4af37" className="text-[#d4af37] -mt-1" />}
                    </div>
                    <span className="font-sans mt-3 text-[0.6rem] font-bold tracking-[0.15em] text-white/60 leading-tight px-1 uppercase">
                      {stat.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Scrolling Ticker */}
      <section className="bg-[#18181F] py-4 shadow-[inset_0_1px_0_rgba(212,175,55,0.34),inset_0_-1px_0_rgba(212,175,55,0.34)]">
        <div className="ticker-wrap overflow-hidden whitespace-nowrap">
          <div className="ticker-track flex items-center gap-10 px-8">
            {[...tickerItems, ...tickerItems].map((item, index) => (
              <span
                key={`${item}-${index}`}
                className="inline-flex items-center gap-10 text-[0.72rem] font-semibold uppercase tracking-[0.20em] text-[#d4af37]"
              >
                <span>{item}</span>
                <img
                  src="/crown.svg"
                  alt=""
                  width={26}
                  height={26}
                  className="h-[26px] w-[26px] shrink-0 object-contain"
                  aria-hidden="true"
                />
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Feature strip - Full Width */}
      <section
        ref={featureStripRef}
        className="relative overflow-hidden bg-[#18181F] py-16"
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-x-0 top-0 h-px bg-[#d4af37]/45" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-[#d4af37]/30" />
          <div className="absolute -left-20 top-12 h-56 w-56 rounded-full bg-slate-200/10 blur-3xl" />
          <div className="absolute -right-24 bottom-2 h-64 w-64 rounded-full bg-amber-300/10 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-1 gap-0 md:grid-cols-2 lg:grid-cols-4">
            {featureCards.map((card, index) => {
              const durationStep = featureCards.length > 1
                ? (FEATURE_CARD_FADE_MAX_MS - FEATURE_CARD_FADE_MIN_MS) / (featureCards.length - 1)
                : 0;
              const cardFadeDurationMs = Math.round(FEATURE_CARD_FADE_MIN_MS + (durationStep * index));

              return (
                <div
                  key={card.title}
                  className={`feature-slice feature-strip-card group cursor-pointer ${card.cardClass} ${showFeatureCards ? 'is-visible' : ''}`}
                  style={{
                    transitionDelay: showFeatureCards ? `${index * FEATURE_CARD_STAGGER_MS}ms` : '0ms',
                    transitionDuration: `${cardFadeDurationMs}ms`,
                  }}
                >
                  <div className="feature-slice-icon inline-flex h-11 w-11 items-center justify-center">
                    {card.icon}
                  </div>
                  <h3 className="feature-slice-title mt-6 text-[1.95rem] font-medium leading-[1.08] tracking-[0.01em] text-white">{card.title}</h3>
                  <p className="feature-slice-copy mt-4 max-w-[16rem] text-[1.08rem] leading-8 text-white/80">
                    {card.copy}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* About - Full Height */}
      <section
        id="about"
        className="bg-[#0b0f19] py-20"
        data-section="about"
      >
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 lg:grid-cols-2 lg:items-center">
          <div className="relative group pt-8 pl-8">
            {/* Anniversary Badge Overlay (Hanging Off) */}
            <div 
              className="absolute left-0 top-14 z-20 flex h-28 w-28 flex-col items-center justify-center bg-[#2c0808] p-4 text-center shadow-[20px_20px_60px_rgba(0,0,0,0.5)] transition-transform duration-500 group-hover:-translate-y-1 group-hover:-translate-x-1"
              style={{ border: '1px solid rgba(212, 175, 55, 0.2)' }}
            >
              <p className="text-3xl font-serif font-bold text-[#d4af37]">10</p>
              <p className="mt-2 text-[0.65rem] font-bold tracking-[0.3em] text-[#d4af37] uppercase leading-tight">Years</p>
              <p className="mt-1 text-[0.55rem] font-bold tracking-[0.15em] text-[#d4af37]/80 uppercase leading-tight">Serving Miri</p>
            </div>

            {/* Main Chef Image */}
            <div
              className={`overflow-hidden border border-white/10 bg-white/5 animate-scale glow-animation ${visibleSections.about ? 'visible' : ''}`}
              style={{ animationDelay: visibleSections.about ? '0.1s' : '0s' }}
            >
              <div className="relative aspect-[4/5] w-full overflow-hidden">
                <img
                  src="/chef.png"
                  alt="Our Master Chef"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f19] via-transparent to-transparent opacity-40 transition-opacity duration-500 group-hover:opacity-20" />
              </div>
            </div>
            
            {/* Subtle decorative elements matching hero style */}
            <div className="absolute -bottom-10 -right-10 -z-10 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl opacity-60" />
          </div>

          <div
            className={`animate-slide-left ${visibleSections.about ? 'visible' : ''}`}
            style={{ animationDelay: visibleSections.about ? '0.2s' : '0s' }}
          >
            <p className="text-base font-semibold text-[#d4af37] tracking-[0.2em] uppercase">Our Story</p>
            <h2 className="hero-premium-title mt-6 text-4xl sm:text-5xl lg:text-7xl leading-[1.1]">
              Welcome to <span className="text-[#efe3d2]">Makan</span><span className="text-[#d4af37]">Sedap</span>
            </h2>
            <div className="hero-premium-copy mt-8 space-y-6 text-base leading-relaxed text-white">
              <p>
                We take pride in our culinary diversity, bringing Western and traditional Bornean cuisines together on one menu. Whether you're craving the bold, rustic spices of a local heritage dish or the refined pull of a Western classic, our kitchen strikes the perfect balance.
              </p>
              <p>
                Founded in Miri, Sarawak in 2015, every dish we serve honours the rich food culture of this region — made with fresh, locally sourced ingredients and passed-down techniques.
              </p>
            </div>

            {/* Minimalist Stats Row (Inspired by second pic design) */}
            <div className="mt-12 py-8 border-y border-white/10">
              <div className="grid grid-cols-3 gap-4 text-center sm:text-left">
                <div>
                  <p className="text-4xl font-serif font-medium text-[#d4af37]">10+</p>
                  <p className="mt-2 text-[0.65rem] font-bold tracking-[0.2em] text-white/60 uppercase">Years Experience</p>
                </div>
                <div>
                  <p className="text-4xl font-serif font-medium text-[#d4af37]">15</p>
                  <p className="mt-2 text-[0.65rem] font-bold tracking-[0.2em] text-white/60 uppercase">Master Chefs</p>
                </div>
                <div>
                  <p className="text-4xl font-serif font-medium text-[#d4af37]">80+</p>
                  <p className="mt-2 text-[0.65rem] font-bold tracking-[0.2em] text-white/60 uppercase">Dishes on Menu</p>
                </div>
              </div>
            </div>

            <div className="mt-12 flex flex-nowrap items-center gap-3 sm:gap-6">
              <a
                href="#contact"
                className="btn-hover flex-1 flex items-center justify-center bg-[#d4af37] px-4 py-3 sm:px-10 sm:py-4 text-[0.7rem] sm:text-[0.85rem] font-bold tracking-[0.15em] sm:tracking-[0.2em] text-black uppercase text-center"
                style={{ fontFamily: "'Cormorant Garamond', 'Baskerville', 'Times New Roman', serif" }}
              >
                Contact Us
              </a>
              <Link
                href="/menu"
                className="btn-hover flex-1 flex items-center justify-center border border-[#d4af37]/60 bg-transparent px-4 py-3 sm:px-10 sm:py-4 text-[0.7rem] sm:text-[0.85rem] font-bold tracking-[0.15em] sm:tracking-[0.2em] text-[#d4af37] uppercase text-center hover:bg-[#d4af37]/10 transition-colors"
                style={{ fontFamily: "'Cormorant Garamond', 'Baskerville', 'Times New Roman', serif" }}
              >
                Order Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section
        id="contact"
        className="bg-[#0b0f19] py-24 border-t border-white/10"
        data-section="contact"
      >
        <div className="mx-auto max-w-5xl px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">
            
            {/* Left Column: Info */}
            <div className="space-y-12">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <p className="text-[0.65rem] font-black tracking-[0.4em] text-[#d4af37] uppercase">Find Us</p>
                  <div className="h-[1px] w-12 bg-[#d4af37]/30" />
                </div>
                <h2 className="text-6xl md:text-7xl font-serif text-white leading-[1.1]">
                  Get in <br />
                  <span className="italic">touch</span>
                </h2>
              </div>

              <div className="space-y-10">
                {/* Address */}
                <div className="flex gap-6 text-white">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-14 w-14 bg-[#151921] text-[#d4af37] shadow-xl border border-white/5">
                      <MapPin size={24} strokeWidth={2} />
                    </div>
                  </div>
                  <div>
                    <p className="text-[0.65rem] font-black tracking-[0.3em] text-[#d4af37] uppercase mb-1">Address</p>
                    <p className="text-[0.95rem] font-medium text-white/80 leading-relaxed">
                      Lot 683, Block 9, Jalan Pujut-Lutong<br />
                      C.D.T. 20, 98009 Miri, Sarawak, Malaysia
                    </p>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex gap-6 text-white">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-14 w-14 bg-[#151921] text-[#d4af37] shadow-xl border border-white/5">
                      <Phone size={24} strokeWidth={2} />
                    </div>
                  </div>
                  <div>
                    <p className="text-[0.65rem] font-black tracking-[0.3em] text-[#d4af37] uppercase mb-1">Phone</p>
                    <p className="text-[0.95rem] font-medium text-white/80 leading-relaxed">
                      +60 12-345 6789
                    </p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex gap-6 text-white">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-14 w-14 bg-[#151921] text-[#d4af37] shadow-xl border border-white/5">
                      <Mail size={24} strokeWidth={2} />
                    </div>
                  </div>
                  <div>
                    <p className="text-[0.65rem] font-black tracking-[0.3em] text-[#d4af37] uppercase mb-1">Email</p>
                    <p className="text-[0.95rem] font-medium text-white/80 leading-relaxed">
                      hello@makansedap.com
                    </p>
                  </div>
                </div>
              </div>

              {/* Opening Hours */}
              <div className="pt-4">
                <div className="inline-block bg-white/5 border border-white/10 px-3 py-1 mb-6">
                  <p className="text-[0.65rem] font-black tracking-[0.15em] text-[#d4af37] uppercase">Opening Hours</p>
                </div>
                <div className="space-y-3 text-white">
                  <div className="flex justify-between max-w-[280px]">
                    <p className="text-[0.9rem] font-medium text-white/50">Mon &ndash; Fri</p>
                    <p className="text-[0.9rem] font-bold text-[#efe3d2]">9:00 AM &ndash; 11:00 PM</p>
                  </div>
                  <div className="flex justify-between max-w-[280px]">
                    <p className="text-[0.9rem] font-medium text-white/50">Sat &ndash; Sun</p>
                    <p className="text-[0.9rem] font-bold text-[#efe3d2]">10:00 AM &ndash; 12:00 AM</p>
                  </div>
                  <div className="flex justify-between max-w-[280px] pt-1 border-t border-white/5">
                    <p className="text-[0.9rem] font-medium text-white/50">Delivery</p>
                    <p className="text-[0.9rem] font-bold text-[#d4af37]">Available Daily</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Map */}
            <div className="w-full aspect-square lg:mt-24 shadow-2xl relative">
              <iframe
                title="Miri Location Map"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15947.671040523!2d113.987!3d4.387!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNMKwMjMnMTMuMiJOIDExM8KwNTknMTMuMiJF!5e0!3m2!1sen!2smy!4v1617260000000!5m2!1sen!2smy"
                width="100%"
                height="100%"
                style={{ border: 0, filter: 'grayscale(0.4) invert(0.9) contrast(1.2)' }}
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0"
              />
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#0a0d16]">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
            {/* Company Info */}
            <div
              className={`animate-on-scroll ${visibleSections.footer ? 'visible' : ''}`}
              style={{ animationDelay: visibleSections.footer ? '0s' : '0s' }}
            >
              <div className="flex items-center gap-3 mb-4">
                <img
                  src="https://images.unsplash.com/photo-1644920437956-388353e26e28?q=80&w=627&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                  alt="MakanSedap Logo"
                  className="h-10 w-10 rounded-xl object-cover"
                />
                <p
                  className="text-[2rem] font-semibold leading-none tracking-[0.01em]"
                  style={{ fontFamily: "'Cormorant Garamond', 'Baskerville', 'Times New Roman', serif" }}
                >
                  <span className="text-[#f2e8d7]">Makan</span>
                  <span className="text-[#d4af37]">Sedap</span>
                </p>
              </div>
              <p className="text-base leading-7 text-white/70">
                A modern dining experience with fast ordering and great food.
              </p>
            </div>

            {/* Contact Info */}
            <div
              className={`animate-on-scroll ${visibleSections.footer ? 'visible' : ''}`}
              style={{ animationDelay: visibleSections.footer ? '0.1s' : '0s' }}
            >
              <p className="text-base font-bold text-white mb-4">Contact</p>
              <ul className="space-y-3 text-base text-white/70">
                <li className="flex items-center gap-2">
                  <MapPin size={18} className="text-amber-400 shrink-0 mt-1" strokeWidth={2.5} />
                  <span>LOT 683, BLOCK 9, JALAN PUJUT-LUTONG, C.D.T. 20, 98009 MIRI, SARAWAK</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone size={18} className="text-amber-400 shrink-0" strokeWidth={2.5} />
                  <span>+60 12-345 6789</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail size={18} className="text-amber-400 shrink-0" strokeWidth={2.5} />
                  <span>hello@makansedap.com</span>
                </li>
              </ul>
            </div>

            {/* Opening Hours */}
            <div
              className={`animate-on-scroll ${visibleSections.footer ? 'visible' : ''}`}
              style={{ animationDelay: visibleSections.footer ? '0.2s' : '0s' }}
            >
              <p className="text-base font-bold text-white mb-4">Opening Hours</p>
              <ul className="space-y-3 text-base text-white/70">
                <li>Mon – Fri: 9AM – 11PM</li>
                <li>Sat – Sun: 10AM – 12AM</li>
                <li className="pt-2 border-t border-white/10 mt-4">
                  <span className="text-amber-300">Delivery Available</span>
                </li>
              </ul>
            </div>

            {/* Newsletter */}
            <div
              className={`animate-on-scroll ${visibleSections.footer ? 'visible' : ''}`}
              style={{ animationDelay: visibleSections.footer ? '0.3s' : '0s' }}
            >
              <p className="text-base font-bold text-white mb-4">Newsletter</p>
              <p className="text-base text-white/70 mb-4">
                Get updates about new dishes and exclusive promos.
              </p>
              <div className="flex overflow-hidden rounded-lg border border-white/10 bg-white/5">
                <input
                  type="email"
                  placeholder="Your email"
                  className="w-full bg-transparent px-4 py-3 text-base text-white placeholder:text-white/40 focus:outline-none transition-all"
                />
                <button className="btn-hover bg-amber-400 px-4 py-3 text-base font-extrabold text-black hover:bg-amber-300 whitespace-nowrap">
                  Join
                </button>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="my-8 border-t border-white/10" />

          {/* Bottom Footer */}
          <div className="flex flex-col items-center justify-between gap-4 text-sm text-white/50 md:flex-row">
            <p>© {new Date().getFullYear()} MakanSedap. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white/80 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white/80 transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0b0f19] flex items-center justify-center text-white">Loading...</div>}>
      <LandingPage />
    </Suspense>
  );
}
