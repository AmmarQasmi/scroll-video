import { useEffect, useRef, useState, useCallback } from 'react';
import {
  useMotionValueEvent,
  useScroll,
  useTransform,
  useSpring,
  motion,
  AnimatePresence,
  animate,
} from 'framer-motion';

// Path to the optimized video placed in /public for static serving by Vite.
const VIDEO_SRC = '/landingVideo_1080.mp4';

// Define the ServiceCard interface
interface ServiceCard {
  start: number;
  end: number;
  side: 'left' | 'right' | 'center';
  title: string;
  desc: string;
  features: string[];
  stats?: { label: string; value: string }[];
  image?: string;
  emoji?: string;
}

// Helper CountUp component
function CountUp({ target, isActive }: { target: number; isActive: boolean }) {
  const [display, setDisplay] = useState<number>(0);

  useEffect(() => {
    if (isActive) {
      const decimals = Number.isInteger(target) ? 0 : 1;
      animate(0, target, {
        duration: 2,
        ease: 'easeOut',
        onUpdate: (v) => {
          const formatted = decimals ? parseFloat(v.toFixed(decimals)) : Math.round(v);
          setDisplay(formatted);
        },
      });
    } else {
      setDisplay(0);
    }
  }, [isActive, target]);

  return (
    <>
      {Number.isInteger(target) ? display.toLocaleString() : display.toFixed(1)}
    </>
  );
}

// Inject keyframes for App Development title shine once
if (typeof document !== 'undefined' && !document.getElementById('appdev-gradient-style')) {
  const style = document.createElement('style');
  style.id = 'appdev-gradient-style';
  style.textContent = `@keyframes AppDevGradientShift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }`;
  document.head.appendChild(style);
}

// Inject global keyframes for golden shine effect applied to all headings
if (typeof document !== 'undefined' && !document.getElementById('gold-shine-style')) {
  const goldStyle = document.createElement('style');
  goldStyle.id = 'gold-shine-style';
  goldStyle.textContent = `@keyframes GoldShine {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }`;
  document.head.appendChild(goldStyle);
}

function VideoScroll() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // State for video duration and readiness
  const [duration, setDuration] = useState<number>(0);
  const [isReady, setIsReady] = useState<boolean>(false);

  // State for mobile menu
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  // State for mobile detection
  const [isMobile, setIsMobile] = useState<boolean>(window.matchMedia('(max-width: 768px)').matches);

  // Capture scroll progress for the video section
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Map scroll progress to video time and apply spring inertia
  const rawVideoTime = useTransform(scrollYProgress, [0, 1], [0, duration]);
  const videoTime = useSpring(rawVideoTime, {
    stiffness: 80, // Increased stiffness for more responsive tracking
    damping: 25,  // Slightly higher damping to reduce overshoot
  });

  // Track desired video time and intro overlay
  const desiredTimeRef = useRef<number>(0);
  const [showIntro, setShowIntro] = useState<boolean>(true);
  const [currentService, setCurrentService] = useState<ServiceCard | null>(null);

  // Media query for mobile detection
  useEffect(() => {
    const mobileQuery = window.matchMedia('(max-width: 768px)');
    const handleChange = () => setIsMobile(mobileQuery.matches);
    mobileQuery.addEventListener('change', handleChange);
    return () => mobileQuery.removeEventListener('change', handleChange);
  }, []);

  // Debounced service selection logic
  const selectService = useCallback((t: number) => {
    const DISPLAY_BUFFER = 1; // Reduced buffer to minimize overlap
    const GAP = 1; // Reduced gap to ensure smooth transitions

    const service = services.find((s, idx) => {
      const start = s.start;
      const end = s.end + DISPLAY_BUFFER;
      const nextStart = idx < services.length - 1 ? services[idx + 1].start : Infinity;
      return t >= start && t < Math.min(end, nextStart - GAP);
    });

    setCurrentService(service || null);
    setShowIntro(t < 7);
  }, []);

  // Update video time and service selection
  useMotionValueEvent(videoTime, 'change', (t) => {
    desiredTimeRef.current = Math.max(0, Math.min(t, duration));
    selectService(t);
  });

  // Sync video time with scroll
  useEffect(() => {
    if (!isReady) return;
    let animationId: number;
    const THRESHOLD = 1 / 30;

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

  // Initialize video settings
  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.pause();
    videoRef.current.muted = true;
  }, []);

  // Service data
  const services: ServiceCard[] = [
    {
      start: 20,
      end: 26,
      side: 'left',
      title: 'App Development',
      desc: 'Build impactful mobile apps',
      features: [
        'Native iOS & Android',
        'Cross-platform React Native',
        'App Launch & ASO'
      ],
      stats: [
        { label: 'Apps Launched', value: '150+' },
        { label: 'Active Users', value: '2M+' },
        { label: 'App Store Rating', value: '4.8★' }
      ],
      image: '/app-dev.gif',
    },
    {
      start: 32,
      end: 38,
      side: 'right',
      title: 'Web Development',
      desc: 'Create lightning-fast websites',
      features: [
        'Next.js / React',
        'Jamstack builds',
        'E-commerce solutions'
      ],
      stats: [
        { label: 'Load Time', value: '<1s' },
        { label: 'Lighthouse Score', value: '95+' },
        { label: 'Conversion Rate', value: '+40%' }
      ],
      image: '/web-dev.gif',
    },
    {
      start: 44,
      end: 50,
      side: 'left',
      title: 'SEO',
      desc: 'Boost organic search visibility',
      features: [
        'SEO audits',
        'Core Web Vitals',
        'Backlink outreach'
      ],
      stats: [
        { label: 'Avg. Ranking Improvement', value: '+250%' },
        { label: 'Organic Traffic Growth', value: '+180%' },
        { label: 'Keywords Ranked', value: '1000+' }
      ],
      image: '/seo.gif',
    },
    {
      start: 56,
      end: 62,
      side: 'right',
      title: 'Social Media Marketing',
      desc: 'Grow your brand on social',
      features: [
        'Content strategy',
        'Paid campaigns',
        'Community management'
      ],
      stats: [
        { label: 'Engagement Rate', value: '+320%' },
        { label: 'Follower Growth', value: '+150%' },
        { label: 'ROAS', value: '4.2x' }
      ],
      image: '/smm.gif',
    },
    {
      start: 68,
      end: 75,
      side: 'center',
      title: 'Contact Us',
      desc: 'Ready to get started?',
      features: [
        'Free 30-min consult',
        'Custom proposal',
        '24/7 support'
      ],
      image: '/contact.gif',
    },
  ];

  // Scroll to specific time
  const scrollToTime = (time: number) => {
    if (!containerRef.current || duration === 0) return;

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const containerTop = window.scrollY + containerRect.top;
    const containerHeight = container.offsetHeight;
    const viewportHeight = window.innerHeight;

    const progress = Math.min(Math.max(time / duration, 0), 1);
    const scrollRange = containerHeight - viewportHeight;
    const targetY = containerTop + progress * scrollRange;

    desiredTimeRef.current = time;
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
    selectService(time);
    setIsMenuOpen(false);

    window.scrollTo({ top: targetY, behavior: 'smooth' });
  };

  const isEnhanced = currentService && currentService.title !== 'Contact Us';
  const isAppDev = currentService?.title === 'App Development';
  const isRightService = currentService && ['Web Development', 'Social Media Marketing'].includes(currentService.title);

  return (
    <div
      ref={containerRef}
      style={{
        minHeight: '600vh',
        background: 'black',
        position: 'relative',
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

      {/* Dark overlay for better text readability */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: currentService
            ? 'linear-gradient(135deg, rgba(0,0,0,0.3), rgba(0,0,0,0.6))'
            : 'transparent',
          pointerEvents: 'none',
          transition: 'background 0.8s ease',
        }}
      />

      {/* Intro Text Overlay */}
      <AnimatePresence>
        {showIntro && (
          <motion.div
            key="intro-text"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
              textAlign: 'center',
              zIndex: 100,
              padding: isMobile ? '0 16px' : '0',
            }}
          >
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              style={{ textAlign: 'center', lineHeight: 1 }}
            >
              <div
                style={{
                  fontFamily: 'Vidaloka, Georgia, serif',
                  fontWeight: 900,
                  fontSize: isMobile ? 'clamp(36px, 11vw, 54px)' : 'clamp(54px, 13vw, 150px)',
                  color: '#ffd65a',
                  letterSpacing: isMobile ? '-1px' : '-3px',
                  textShadow: '0 8px 24px rgba(0,0,0,0.7)',
                  marginBottom: 8,
                  background: 'none',
                }}
              >
                BYTES<span style={{ color: '#ffd65a' }}>.</span>
              </div>
              <div
                style={{
                  fontFamily: 'Source Sans Pro, Helvetica, sans-serif',
                  fontWeight: 300,
                  fontSize: isMobile ? 'clamp(12px, 3vw, 16px)' : 'clamp(16px, 4vw, 28px)',
                  color: '#ffffff',
                  letterSpacing: '0.3em',
                  textShadow: '0 4px 16px rgba(0,0,0,0.6)',
                  opacity: 0.9,
                }}
              >
                PLATFORM
              </div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                style={{
                  marginTop: isMobile ? 16 : 24,
                  fontSize: isMobile ? 'clamp(12px, 2vw, 14px)' : 'clamp(14px, 2vw, 18px)',
                  color: '#ffffff',
                  opacity: 0.8,
                  fontWeight: 300,
                }}
              >
                Scroll to explore our digital solutions
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Canvas-style Content Overlay */}
      <AnimatePresence mode="wait">
        {currentService && (
          <motion.div
            key={currentService.title}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: isMobile ? 'auto' : 'none',
              overflowY: isMobile ? 'auto' : 'visible',
              zIndex: 50,
              padding: isMobile ? '16px 8px 8px' : '0 16px',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                gap: isMobile ? '1.5rem' : '4rem',
                maxWidth: isMobile ? '100%' : '1400px',
                width: '100%',
                alignItems: isMobile ? 'center' : 'center',
                justifyContent: 'center',
              }}
            >
              {/* Text Content */}
              <motion.div
                initial={{
                  x: isEnhanced ? 0 : (currentService.side === 'right' ? 100 : -100),
                  opacity: 0,
                }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                style={{
                  order: currentService.side === 'right' ? 2 : 1,
                  textAlign: currentService.side === 'center' ? 'center' : 'left',
                  width: isMobile ? '100%' : '50%',
                  maxWidth: isMobile ? '400px' : 'none',
                }}
              >
                {/* Title */}
                <motion.h1
                  initial={{ y: isEnhanced ? -60 : 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  style={{
                    fontFamily: 'Vidaloka, Georgia, serif',
                    fontSize: isMobile ? 'clamp(32px, 8vw, 56px)' : 'clamp(56px, 8vw, 112px)',
                    fontWeight: 400,
                    color: '#ffd65a',
                    marginBottom: isMobile ? 12 : 16,
                    lineHeight: 1.1,
                    textShadow: '0 4px 16px rgba(0,0,0,0.8)',
                    textAlign: currentService.side === 'center' ? 'center' : 'left',
                    background: 'none',
                    animation: undefined,
                  }}
                >
                  {currentService.title}
                </motion.h1>

                {/* Description */}
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  style={{
                    fontFamily: 'Source Sans Pro, Helvetica, sans-serif',
                    fontSize: isMobile ? 'clamp(14px, 2.5vw, 16px)' : 'clamp(16px, 2.5vw, 24px)',
                    color: '#ffffff',
                    textShadow: '0 2px 8px rgba(0,0,0,0.7)',
                    marginBottom: isMobile ? 24 : 32,
                    lineHeight: 1.6,
                    fontWeight: 300,
                    textAlign: currentService.side === 'center' ? 'center' : 'left',
                  }}
                >
                  {currentService.desc}
                </motion.p>

                {/* Features List */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  style={{ marginBottom: isMobile ? 24 : 32 }}
                >
                  {currentService.features.map((feature, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.5 + idx * 0.1, duration: 0.3 }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: 12,
                        fontSize: isMobile ? 'clamp(12px, 2vw, 14px)' : 'clamp(14px, 2vw, 18px)',
                        color: '#ffffff',
                        textShadow: '0 2px 6px rgba(0,0,0,0.6)',
                        opacity: 0.85,
                        fontFamily: 'Source Sans Pro, Helvetica, sans-serif',
                      }}
                    >
                      <div
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: '#FBBF24',
                          marginRight: 16,
                          boxShadow: '0 0 8px rgba(251, 191, 36, 0.6)',
                        }}
                      />
                      {feature}
                    </motion.div>
                  ))}
                </motion.div>

                {/* Stats */}
                {currentService.stats && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                    style={{
                      display: 'flex',
                      gap: isMobile ? '0.75rem' : '2rem',
                      flexWrap: 'wrap',
                      marginBottom: isMobile ? 24 : 32,
                      justifyContent: currentService.side === 'center' ? 'center' : 'flex-start',
                    }}
                  >
                    {currentService.stats.map((stat, idx) => (
                      <div key={idx} style={{ textAlign: 'center' }}>
                        <div
                          style={{
                            fontFamily: 'Vidaloka, Georgia, serif',
                            fontSize: isMobile ? 'clamp(24px, 6vw, 32px)' : 'clamp(36px, 6vw, 56px)',
                            color: '#ffd65a',
                            textShadow: '0 0 8px rgba(255, 214, 90, 0.6)',
                            background: 'none',
                          }}
                        >
                          {(() => {
                            const match = stat.value.match(/([^0-9]*)([0-9.,]*\.?[0-9]+)(.*)/);
                            if (!match) return stat.value;
                            const prefix = match[1];
                            const num = parseFloat(match[2].replace(/,/g, ''));
                            if (isNaN(num)) return stat.value;
                            const suffix = match[3];
                            return (
                              <>
                                {prefix}
                                <CountUp target={num} isActive={!!currentService} />
                                {suffix}
                              </>
                            );
                          })()}
                        </div>
                        <div
                          style={{
                            fontFamily: 'Source Sans Pro, Helvetica, sans-serif',
                            fontSize: isMobile ? 'clamp(12px, 2vw, 14px)' : 'clamp(16px, 2vw, 20px)',
                            color: '#ffffff',
                            opacity: 0.7,
                            fontWeight: 300,
                          }}
                        >
                          {stat.label}
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}

                {/* CTA Button for Contact */}
                {currentService.title === 'Contact Us' && (
                  <motion.a
                    href="mailto:contact@bytesplatform.io"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.7, duration: 0.4 }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: isMobile ? '12px 24px' : '8px 16px',
                      minWidth: isMobile ? 48 : undefined,
                      minHeight: isMobile ? 48 : undefined,
                      borderRadius: '25px',
                      fontFamily: 'Source Sans Pro, Helvetica, sans-serif',
                      fontSize: isMobile ? 16 : 14,
                      background: 'linear-gradient(135deg, #fff4d2, #ffd65a)',
                      color: '#000000',
                      fontWeight: 700,
                      textDecoration: 'none',
                      boxShadow: '0 8px 32px rgba(255, 214, 90, 0.4)',
                      transition: 'transform 0.2s ease',
                      pointerEvents: 'auto',
                      margin: currentService.side === 'center' ? '0 auto' : '0',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    Get Started →
                  </motion.a>
                )}

                {/* Purple Flower Effect for App Development */}
                {isEnhanced && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      pointerEvents: 'none',
                      overflow: 'hidden',
                      zIndex: 1,
                    }}
                  >
                    {[...Array(12)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                        animate={{
                          opacity: [0, 0.8, 0],
                          scale: [0, 1, 1.2],
                          x: [0, (Math.random() - 0.5) * 300],
                          y: [0, (Math.random() - 0.5) * 300],
                          rotate: [0, 360],
                        }}
                        transition={{
                          duration: 4,
                          delay: i * 0.2,
                          repeat: 1,
                          repeatType: 'loop',
                        }}
                        style={{
                          position: 'absolute',
                          top: '50%',
                          left: isRightService ? '80%' : '50%',
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          background: 'radial-gradient(circle at 30% 30%, #fff4d2, #ffd65a)',
                          mixBlendMode: 'screen',
                        }}
                      />
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Visual Element */}
              {currentService.image && currentService.title !== 'Contact Us' && (
                <motion.div
                  initial={{ 
                    x: isEnhanced ? -100 : (currentService.side === 'right' ? -100 : 100), 
                    opacity: 0,
                    scale: 0.8 
                  }}
                  animate={{ x: 0, opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  style={{
                    order: isMobile ? 1 : currentService.side === 'right' ? 1 : 2,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: isMobile ? '100%' : '50%',
                    maxWidth: isMobile ? '120px' : '400px',
                  }}
                >
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      maxWidth: isMobile ? '120px' : '400px',
                      aspectRatio: '1',
                      borderRadius: 24,
                      overflow: 'hidden',
                      boxShadow: 'none',
                      border: 'none',
                      background: 'transparent',
                      backdropFilter: 'none',
                    }}
                  >
                    <img
                      src={currentService.image}
                      alt={currentService.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        mixBlendMode: 'screen',
                      }}
                    />
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress indicator */}
      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: isMobile ? '80%' : '300px',
          height: '4px',
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '2px',
          overflow: 'hidden',
          zIndex: 10000,
        }}
      >
        <div
          style={{
            width: `${(desiredTimeRef.current / duration) * 100}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #93C5FD, #FBBF24)',
            borderRadius: '2px',
            transition: 'width 0.1s ease',
            boxShadow: '0 0 8px rgba(255, 214, 90, 0.6)',
          }}
        />
      </div>

      {/* Blinking Book Now Button – fixed position */}
      <motion.a
        href="mailto:contact@bytesplatform.io?subject=Project%20Booking"
        initial={{ opacity: 1 }}
        animate={{ opacity: [1, 0.35] }}
        transition={{ duration: 0.8, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
        style={{
          position: 'fixed',
          bottom: isMobile ? '24px' : '20px',
          right: isMobile ? '24px' : '20px',
          padding: isMobile ? '14px 28px' : '14px 32px',
          borderRadius: '32px',
          background: 'linear-gradient(135deg, #fff4d2, #ffd65a)',
          color: '#000000',
          fontWeight: 700,
          fontSize: isMobile ? 14 : 16,
          textDecoration: 'none',
          boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
          zIndex: 10001,
          fontFamily: 'Source Sans Pro, Helvetica, sans-serif',
          transition: 'background 0.25s ease, color 0.25s ease, transform 0.25s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#ffd65a';
          e.currentTarget.style.color = '#ffffff';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'linear-gradient(135deg, #fff4d2, #ffd65a)';
          e.currentTarget.style.color = '#000000';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        Book Now
      </motion.a>
    </div>
  );
}

export default VideoScroll;