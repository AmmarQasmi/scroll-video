import { useEffect, useRef, useState } from 'react';
import {
  useMotionValueEvent,
  useScroll,
  useTransform,
  motion,
  AnimatePresence,
} from 'framer-motion';
import {
  FaMobileAlt,
  FaGlobe,
  FaSearch,
  FaChartLine,
  FaEnvelope,
} from 'react-icons/fa';

// Path to the optimized video placed in /public for static serving by Vite.
const VIDEO_SRC = '/landingVideo_1080.mp4';

// Define the ServiceCard interface
interface ServiceCard {
  start: number; // seconds
  end: number;   // seconds
  side: 'left' | 'right' | 'center';
  title: string;
  desc: string;
  image?: string; // optional illustrative image URL
  emoji?: string; // Optional for backward compatibility
}

function VideoScroll() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // State for video duration and readiness
  const [duration, setDuration] = useState<number>(0);
  const [isReady, setIsReady] = useState<boolean>(false);

  // Capture scroll progress for the video section
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Map scroll progress to video time directly
  const videoTime = useTransform(scrollYProgress, [0, 1], [0, duration]);

  // Track desired video time and intro overlay
  const desiredTimeRef = useRef<number>(0);
  const [showIntro, setShowIntro] = useState<boolean>(true);
  const [isMobile, setIsMobile] = useState<boolean>(window.matchMedia('(max-width: 768px)').matches);

  useEffect(() => {
    const mobileQuery = window.matchMedia('(max-width: 768px)');
    const handleChange = () => setIsMobile(mobileQuery.matches);
    mobileQuery.addEventListener('change', handleChange);
    return () => mobileQuery.removeEventListener('change', handleChange);
  }, []);

  useMotionValueEvent(videoTime, 'change', (t) => {
    desiredTimeRef.current = Math.max(0, Math.min(t, duration));
    setShowIntro(t < 7); // Show intro for first 7 seconds
  });

  useEffect(() => {
    if (!isReady) return;
    let animationId: number;
    const THRESHOLD = 1 / 30; // seconds – ignore gaps smaller than one 30 fps frame

    const tick = () => {
      const video = videoRef.current;
      if (video) {
        const wanted = desiredTimeRef.current;
        if (Math.abs(wanted - video.currentTime) > THRESHOLD) {
          video.currentTime = wanted;
        }
      }
      animationId = requestAnimationFrame(tick);
    };
    animationId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationId);
  }, [isReady, duration]);

  // Handle video metadata loading
  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
    videoRef.current.pause();
    setIsReady(true);
  };

  // Ensure video is paused and muted initially
  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.pause();
    videoRef.current.muted = true;
  }, []);

  // Service card data
  const services: ServiceCard[] = [
    {
      start: 32,
      end: 38,
      side: 'left',
      title: 'App Development',
      desc: 'Native, cross-platform & PWA apps built with React Native, Flutter and Swift/Kotlin. From MVP to App Store launch—plus continuous delivery & analytics.',
      image: '/app-dev.gif',
    },
    {
      start: 38,
      end: 44,
      side: 'right',
      title: 'Web Development',
      desc: 'Jamstack / Next.js sites that load in under 1 sec, score 95+ on Lighthouse and integrate seamlessly with headless CMS or e-commerce back-ends.',
      image: '/web-dev.gif',
    },
    {
      start: 45,
      end: 51,
      side: 'left',
      title: 'Search Engine Optimization',
      desc: 'Technical audits, Core Web Vitals, schema markup and backlink outreach to rank you on page 1—and keep you there.',
      image: '/seo.gif',
    },
    {
      start: 52,
      end: 56,
      side: 'right',
      title: 'Social Media Marketing',
      desc: 'Strategy, creative, paid ads and community management. Weekly KPI reviews and data-driven tweaks to maximize engagement & reach.',
      image: '/smm.gif',
    },
    {
      start: 63,
      end: 70,
      side: 'center',
      title: 'Contact Us',
      desc: 'Email: contact@bytesplatform.io\nPhone: +1 (555) 123-4567',
      image: '/contact.gif',
    },
  ];

  const [currentT, setCurrentT] = useState<number>(0);
  const [activeCard, setActiveCard] = useState<ServiceCard | null>(null);
  // Auto-open disabled, but keep placeholder to avoid further logic changes
  const [autoDisabledFor, setAutoDisabledFor] = useState<string | null>(null);

  useMotionValueEvent(videoTime, 'change', (t) => {
    if (!activeCard) {
      setCurrentT(t);
    }
  });

  // Freeze scroll position and video timeline when modal is open
  useEffect(() => {
    if (activeCard) {
      const lockedY = window.scrollY;
      // lock scroll
      const handleScroll = () => {
        window.scrollTo({ top: lockedY, behavior: 'auto' });
      };
      window.addEventListener('scroll', handleScroll);

      // lock video to the opening card's start time
      desiredTimeRef.current = activeCard.start;
      if (videoRef.current) {
        videoRef.current.currentTime = activeCard.start;
      }
      setCurrentT(activeCard.start);

      // Also snap the scroll position to exact location of this time
      scrollToTime(activeCard.start);

      return () => {
        window.removeEventListener('scroll', handleScroll);
      };
    }
  }, [activeCard]);

  // Auto-opening of cards has been disabled per user request
  useEffect(() => {}, []);

  // Disable background scroll when a card is opened
  useEffect(() => {
    if (activeCard) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [activeCard]);

  // Scroll to a specific time in the video by adjusting window scroll position
  const scrollToTime = (time: number) => {
    if (!containerRef.current || duration === 0) return;

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    // distance from top of page to container top
    const containerTop = window.scrollY + containerRect.top;
    const containerHeight = container.offsetHeight;
    const viewportHeight = window.innerHeight;

    const progress = Math.min(Math.max(time / duration, 0), 1);
    const scrollRange = containerHeight - viewportHeight;

    const targetY = containerTop + progress * scrollRange;

    // Jump video timeline immediately to minimize lag
    desiredTimeRef.current = time;
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
    setCurrentT(time);

    // Smooth scroll viewport to corresponding position
    window.scrollTo({ top: targetY, behavior: 'smooth' });
  };

  return (
    <div
      ref={containerRef}
      style={{
        minHeight: '600vh',
        background: 'black',
      }}
    >
      <video
        ref={videoRef}
        src={VIDEO_SRC}
        playsInline
        preload="auto"
        muted
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          objectFit: 'cover', // Fills viewport, removing black bars
          pointerEvents: 'none',
        }}
        onLoadedMetadata={handleLoadedMetadata}
      />

      {/* Intro Text Overlay */}
      <AnimatePresence>
        {showIntro && (
          <motion.div
            key="intro-text"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            style={{
              position: 'fixed',
              top: isMobile ? '18%' : '50%',
              left: '50%',
              transform: isMobile ? 'translate(-50%, 0)' : 'translate(-50%, -50%)',
              pointerEvents: 'none',
              textAlign: 'center',
            }}
          >
            <div style={{ textAlign: 'center', lineHeight: 1 }}>
              <div
                style={{
                  fontFamily: 'Poppins, Arial, sans-serif',
                  fontWeight: 900,
                  fontSize: 'clamp(40px, 10vw, 120px)',
                  color: '#ffffff',
                  letterSpacing: '-2px',
                  textShadow: '0 4px 12px rgba(0,0,0,0.6)',
                  WebkitTextStroke: '2px #000',
                  marginBottom: 4,
                }}
              >
                BYTES<span style={{ color: '#ffffff' }}>.</span>
              </div>
              <div
                style={{
                  fontFamily: 'Poppins, Arial, sans-serif',
                  fontWeight: 700,
                  fontSize: 'clamp(14px, 4vw, 32px)',
                  color: '#FFB300',
                  letterSpacing: '0.4em',
                  textShadow: '0 2px 6px rgba(0,0,0,0.4)',
                  display: 'inline-block',
                  transform: 'translateX(1.5em)',
                }}
              >
                PLATFORM
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Glow keyframes */}
      <style>{`
        @keyframes pulseGlow {
          0%   { text-shadow: 0 0 6px #00e5ff, 0 0 12px #00e5ff; }
          50%  { text-shadow: 0 0 16px #00e5ff, 0 0 32px #00e5ff; }
          100% { text-shadow: 0 0 6px #00e5ff, 0 0 12px #00e5ff; }
        }
      `}</style>

      {/* Water shift keyframes for glossy navbar */}
      <style>{`
        @keyframes waterShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>

      {/* Service Cards */}
      <AnimatePresence>
        {services.map((s, i) => {
          const active = currentT >= s.start && currentT < s.end;
          if (!active) return null;

          const isLeft = s.side === 'left';
          const isCenter = s.side === 'center';

          let baseStyle: React.CSSProperties = {
            position: 'fixed',
            top: isMobile
              ? '5vh'
              : (s.title === 'App Development' || s.title === 'Web Development'
                  ? '120px'
                  : s.title === 'Search Engine Optimization'
                  ? '26vh'
                  : s.title === 'Social Media Marketing'
                  ? '18vh'
                  : '50vh'),
            left: isMobile ? '50vw' : isLeft ? (s.title === 'Search Engine Optimization' ? '8vw' : '10vw') : undefined,
            right: isMobile ? undefined : !isLeft ? (s.title === 'Web Development' ? '5vw' : '10vw') : undefined,
            transform: isMobile ? 'translate(-50%, -50%)' : 'translateY(-50%)',
            maxWidth: isMobile ? '90vw' : 'clamp(300px, 25vw, 400px)',
            pointerEvents: 'none',
            textAlign: isMobile ? 'center' : isLeft ? 'left' : 'right',
          };

          if (isCenter) {
            baseStyle = {
              position: 'fixed',
              inset: 0,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              pointerEvents: 'none',
            };
          }

          const IconComponent = s.title === 'App Development' ? FaMobileAlt
            : s.title === 'Web Development' ? FaGlobe
            : s.title === 'Search Engine Optimization' ? FaSearch
            : s.title === 'Social Media Marketing' ? FaChartLine
            : FaEnvelope;

          const isCardActive = activeCard && activeCard.title === s.title;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              style={{
                position: 'fixed',
                top: '30vh',
                left: s.side === 'left' ? '8vw' : s.side === 'right' ? undefined : '50%',
                right: s.side === 'right' ? '8vw' : undefined,
                transform: s.side === 'center' ? 'translateX(-50%)' : undefined,
                maxWidth: '500px',
                padding: '32px 36px',
                background: 'rgba(0,0,0,0.45)',
                backdropFilter: 'blur(10px)',
                borderRadius: 12,
                color: '#fff',
                pointerEvents: 'none',
              }}
            >
              {s.image && (
                <img
                  src={s.image}
                  alt={s.title}
                  style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 10, marginBottom: 16 }}
                />
              )}
              {s.title && (
                <div style={{ fontSize: 26, fontWeight: 700, color: '#00e5ff', marginBottom: 12 }}>{s.title}</div>
              )}
              <div style={{ fontSize: 16, lineHeight: 1.5, whiteSpace: 'pre-line' }}>{s.desc}</div>
              {s.title === 'Contact Us' && (
                <a
                  href="mailto:contact@bytesplatform.io"
                  style={{
                    display: 'inline-block',
                    marginTop: 16,
                    padding: '10px 22px',
                    background: '#00e5ff',
                    color: '#000',
                    borderRadius: 30,
                    fontWeight: 700,
                    textDecoration: 'none',
                  }}
                >
                  Email Us
                </a>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {activeCard && (
          <motion.div
            key="detail-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.85)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
            }}
            onClick={(e) => {
              if (activeCard) {
                scrollToTime(activeCard.start);
                setAutoDisabledFor(activeCard.title);
              }
              setActiveCard(null);
            }}
          >
            <motion.div
              layoutId={`card-${activeCard.title}`}
              initial={{ scale: 0.8, y: 40, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.8, y: 40, opacity: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              style={{
                background: '#0d0d0d',
                borderRadius: 16,
                padding: '32px 24px',
                width: '80vw',
                maxWidth: '1100px',
                maxHeight: '80vh',
                overflowY: 'auto',
                boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
                color: '#fff',
                position: 'relative',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {activeCard.image && (
                <img
                  src={activeCard.image}
                  alt={activeCard.title}
                  style={{ width: '100%', borderRadius: 12, marginBottom: 20 }}
                />
              )}
              <h2 style={{ color: '#00e5ff', marginBottom: 12 }}>{activeCard.title}</h2>
              <p style={{ fontSize: 16, lineHeight: 1.5, whiteSpace: 'pre-line' }}>{activeCard.desc}</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (activeCard) {
                    scrollToTime(activeCard.start);
                    setAutoDisabledFor(activeCard.title);
                  }
                  setActiveCard(null);
                }}
                style={{
                  marginTop: 24,
                  padding: '10px 24px',
                  background: '#00e5ff',
                  color: '#000',
                  border: 'none',
                  borderRadius: 6,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky Rounded Navbar */}
      <nav
        style={{
          position: 'fixed',
          top: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, rgba(0,140,255,0.25), rgba(0,200,255,0.20), rgba(0,140,255,0.25))',
          backgroundSize: '200% 200%',
          animation: 'waterShift 8s ease-in-out infinite',
          border: '1px solid rgba(0,229,255,0.4)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          padding: '10px 20px',
          borderRadius: 9999,
          display: 'flex',
          gap: '14px',
          zIndex: 10000,
          boxShadow: '0 6px 24px rgba(0,179,255,0.35), inset 0 0 12px rgba(0,229,255,0.2)',
        }}
      >
        {/* Home / Start Button */}
        {(() => {
          const firstStart = services[0]?.start ?? 10;
          const isActiveHome = currentT < firstStart;
          return (
            <button
              onClick={() => scrollToTime(0)}
              style={{
                background: isActiveHome ? '#00e5ff' : 'transparent',
                color: isActiveHome ? '#000' : '#fff',
                border: '1px solid rgba(255,255,255,0.25)',
                padding: '6px 14px',
                borderRadius: 9999,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
                marginRight: 8,
              }}
            >
              Home
            </button>
          );
        })()}

        {services.map((s, idx) => {
          const isActive = currentT >= s.start && currentT < s.end;
          const isContact = s.title === 'Contact Us';
          const blueShades = ['#0099ff', '#00b3ff', '#00ccff', '#00e5ff'];
          const shade = blueShades[idx % blueShades.length];
          return (
            <button
              key={s.title}
              onClick={() => scrollToTime(s.start)}
              style={{
                background: isContact
                  ? isActive
                    ? '#ff4d4f'
                    : 'rgba(255,77,79,0.12)'
                  : isActive
                  ? shade
                  : 'rgba(255,255,255,0.08)',
                color: isContact
                  ? '#fff'
                  : isActive
                  ? '#000'
                  : '#fff',
                border: isContact ? '1px solid #ff4d4f' : `1px solid ${shade}`,
                padding: '8px 18px',
                borderRadius: 9999,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                whiteSpace: 'nowrap',
                boxShadow: isActive
                  ? `0 2px 10px ${shade}66`
                  : `0 2px 6px ${shade}33`,
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
              }}
            >
              {s.title}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export default VideoScroll;