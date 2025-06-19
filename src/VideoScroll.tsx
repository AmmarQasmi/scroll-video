import { useEffect, useRef, useState } from 'react';
import { useMotionValueEvent, useScroll, useSpring, useTransform, motion, AnimatePresence } from 'framer-motion';

// Path to the optimised video placed in /public so it is served statically by Vite.
const VIDEO_SRC = '/landingVideo_1080.mp4';

/**
 * The component pins a full-viewport <video> element and scrubs its currentTime based on scroll position.
 * The user does NOT actually play the video – audio is muted and playback is paused – we simply seek.
 */
function VideoScroll() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Once we know the video duration we can map scroll → time.
  const [duration, setDuration] = useState<number>(0);
  const [isReady, setIsReady] = useState<boolean>(false);

  // Capture scroll progress (0 → 1) for the section that hosts the video.
  const { scrollYProgress } = useScroll({
    target: containerRef,
    // 0 → when the section's top hits the viewport top
    // 1 → when the section's bottom hits the viewport bottom
    // This way the progress range matches the total scrollable distance (sectionHeight - viewportHeight)
    offset: ['start start', 'end end'],
  });

  // Map scroll progress across the ENTIRE video duration once metadata is loaded.
  const targetTime = useTransform(scrollYProgress, [0, 1], [0, duration]);
  /**
   * Tune the spring so the video eases into the new time instead of tracking scroll 1-to-1.
   * Lower stiffness  = slower catch-up.
   * Higher damping   = less overshoot.
   * Higher mass      = more momentum (slower acceleration & deceleration).
   */
  const smoothTime = useSpring(targetTime, {
    stiffness: 20,
    damping: 30,
    mass: 0.8,
  });

  /*
   * Instead of setting currentTime immediately on every motion-value tick (which may fire >100× per
   * second and force a costly seek each time), we:
   *   1. keep the *desired* time in a ref;  2. on every animation frame apply it only if the gap
   *      from the actual video time is large enough ( >33 ms ≈ one 30 fps frame).
   */
  const desiredTimeRef = useRef(0);

  // Intro overlay visible for first 7 seconds
  const [showIntro, setShowIntro] = useState(true);

  // Detect mobile viewport for overlay positioning
  const mobileQuery = useRef<MediaQueryList | null>(null);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 768px)').matches);

  useEffect(() => {
    mobileQuery.current = window.matchMedia('(max-width: 768px)');
    const upd = () => setIsMobile(mobileQuery.current!.matches);
    mobileQuery.current.addEventListener('change', upd);
    return () => mobileQuery.current?.removeEventListener('change', upd);
  }, []);

  useMotionValueEvent(smoothTime, 'change', (t) => {
    desiredTimeRef.current = Math.max(0, Math.min(t, duration));
    const visible = t < 7; // show for first 7 seconds
    setShowIntro(visible);
  });

  useEffect(() => {
    if (!isReady) return;
    let id: number;
    const THRESHOLD = 1 / 30; // seconds – ignore smaller gaps (≈ one frame)

    const tick = () => {
      const video = videoRef.current;
      if (video) {
        const wanted = desiredTimeRef.current;
        if (Math.abs(wanted - video.currentTime) > THRESHOLD) {
          video.currentTime = wanted;
        }
      }
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [isReady, duration]);

  // When metadata has loaded we know the duration.
  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
    // Pause just in case the browser tried to autoplay.
    videoRef.current.pause();
    setIsReady(true);
  };

  // Make sure the video is initially paused and muted.
  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.pause();
    videoRef.current.muted = true;
  }, []);

  // Optional: expose a frame index that other logic/overlays might rely on.
  // const currentFrame = useTransform(smoothTime, (t) =>
  //   Math.round((t / duration) * (TOTAL_FRAMES - 1) + 1),
  // );

  /* ------------------ Service Overlays ------------------ */
  interface ServiceCard {
    start: number; // seconds
    end: number;   // seconds
    side: 'left' | 'right' | 'center';
    title: string;
    desc: string;
    emoji: string;
  }

  const services: ServiceCard[] = [
    {
      start: 32,
      end: 38,
      side: 'left',
      title: 'App Development',
      desc: 'Native, cross-platform & PWA apps built with React Native, Flutter and Swift/Kotlin. From MVP to App Store launch—plus continuous delivery & analytics.',
      emoji: '📱',
    },
    {
      start: 38,
      end: 44,
      side: 'right',
      title: 'Web Development',
      desc: 'Jamstack / Next.js sites that load in under 1 sec, score 95+ on Lighthouse and integrate seamlessly with headless CMS or e-commerce back-ends.',
      emoji: '🌐',
    },
    {
      start: 45,
      end: 51,
      side: 'left',
      title: 'SEO',
      desc: 'Technical audits, Core Web Vitals, schema markup and backlink outreach to rank you on page 1—and keep you there.',
      emoji: '🔍',
    },
    {
      start: 52,
      end: 56,
      side: 'right',
      title: 'Social Media Marketing',
      desc: 'Strategy, creative, paid ads and community management. Weekly KPI reviews and data-driven tweaks to maximise engagement & reach.',
      emoji: '📈',
    },
    {
      start: 63,
      end: 70,
      side: 'center',
      title: 'Contact Us',
      desc: 'Email: contact@bytesplatform.io\nPhone: +1 (555) 123-4567',
      emoji: '✉️',
    },
  ];

  const [currentT, setCurrentT] = useState(0);

  useMotionValueEvent(smoothTime, 'change', (t) => {
    setCurrentT(t);
  });

  return (
    <div
      ref={containerRef}
      style={{
        minHeight: '600vh', // Increase/decrease to control scroll length
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
          objectFit: 'cover',
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
            <span
              style={{
                fontFamily: 'sans-serif',
                fontWeight: 700,
                fontSize: 'clamp(28px, 8vw, 64px)',
                color: '#00e5ff',
                textShadow: '0 0 12px #00e5ff, 0 0 24px #00e5ff',
                animation: 'pulseGlow 3s ease-in-out infinite',
              }}
            >
              Bytes Platform
            </span>
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

      {/* Service cards */}
      <AnimatePresence>
        {services.map((s, i) => {
          const active = currentT >= s.start && currentT <= s.end;
          if (!active) return null;

          const isLeft = s.side === 'left';
          const isCenter = s.side === 'center';

          let baseStyle: React.CSSProperties;
          if (isCenter) {
            baseStyle = {
              position: 'fixed',
              inset: 0,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              pointerEvents: 'none',
            };
          } else {
            baseStyle = {
              position: 'fixed',
              top: isMobile
                ? (isLeft ? '5%' : '70%')
                : (
                    s.title === 'App Development' || s.title === 'Web Development'
                      ? '10%'
                      : s.title === 'SEO'
                        ? '22%'
                        : s.title === 'Social Media Marketing'
                          ? '15%'
                          : '50%'
                  ),
              left: isLeft ? (isMobile ? '50%' : (s.title === 'SEO' ? '8%' : '10%')) : undefined,
              right: !isLeft
                ? (isMobile ? '50%' : (s.title === 'Web Development' ? '5%' : '10%'))
                : undefined,
              transform: isMobile ? 'translate(-50%, -50%)' : 'translateY(-50%)',
              maxWidth: isMobile ? '90vw' : 300,
              pointerEvents: 'none',
              textAlign: isMobile ? 'center' : (isLeft ? 'left' : 'right'),
            };
          }

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              transition={{ duration: 0.6 }}
              style={baseStyle}
            >
              <div
                style={{
                  background: 'rgba(17,17,17,0.55)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  padding: '24px 28px',
                  borderRadius: 12,
                  boxShadow: '0 6px 20px rgba(0,0,0,0.6)',
                  color: 'white',
                  pointerEvents: 'auto',
                  width: isCenter ? '70vw' : undefined,
                  maxWidth: isCenter ? 600 : undefined,
                  textAlign: 'center',
                }}
              >
                <span style={{ fontSize: 48, display: 'block', marginBottom: 8 }}>{s.emoji}</span>
                <div style={{ fontWeight: 700, color: '#00e5ff', fontSize: 22, marginBottom: 8 }}>
                  {s.title}
                </div>
                <div style={{ fontSize: 14, whiteSpace: 'pre-line' }}>{s.desc}</div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export default VideoScroll; 