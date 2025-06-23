import { useEffect, useRef, useState } from 'react';
import {
  useMotionValueEvent,
  useScroll,
  useTransform,
  useSpring,
  motion,
  AnimatePresence,
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

function VideoScroll() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // State for video duration and readiness
  const [duration, setDuration] = useState<number>(0);
  const [isReady, setIsReady] = useState<boolean>(false);

  // State for mobile menu
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  // Capture scroll progress for the video section
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Map scroll progress to video time and apply spring inertia
  const rawVideoTime = useTransform(scrollYProgress, [0, 1], [0, duration]);
  const videoTime = useSpring(rawVideoTime, {
    stiffness: 60, // lower stiffness for smoother motion
    damping: 20,   // controls how long it keeps moving (~2s feel)
  });

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
    setShowIntro(t < 7);
  });

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

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
    videoRef.current.pause();
    setIsReady(true);
  };

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.pause();
    videoRef.current.muted = true;
  }, []);

  // Enhanced service data with more detailed content
  const services: ServiceCard[] = [
    {
      start: 20,
      end: 26,
      side: 'left',
      title: 'App Development',
      desc: 'Transform your ideas into powerful mobile experiences',
      features: [
        'Native iOS & Android Development',
        'Cross-platform React Native & Flutter',
        'Progressive Web Apps (PWA)',
        'App Store Optimization & Launch',
        'Real-time Analytics Integration'
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
      desc: 'Lightning-fast websites that convert visitors into customers',
      features: [
        'Next.js & React Development',
        'Jamstack Architecture',
        'Headless CMS Integration',
        'E-commerce Solutions',
        'Performance Optimization'
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
      title: 'Search Engine Optimization',
      desc: 'Dominate search results and drive organic traffic',
      features: [
        'Technical SEO Audits',
        'Core Web Vitals Optimization',
        'Schema Markup Implementation',
        'Backlink Strategy & Outreach',
        'Local SEO & Google My Business'
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
      desc: 'Build communities and amplify your brand across all platforms',
      features: [
        'Content Strategy & Creation',
        'Paid Advertising Campaigns',
        'Community Management',
        'Influencer Partnerships',
        'Analytics & Performance Tracking'
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
      desc: 'Ready to transform your digital presence?',
      features: [
        'Free 30-minute consultation',
        'Custom project proposal',
        '24/7 support available',
        'Transparent pricing',
        'Money-back guarantee'
      ],
      image: '/contact.gif',
    },
  ];

  const [currentT, setCurrentT] = useState<number>(0);
  const DISPLAY_BUFFER = 2; // seconds to extend each component visibility
  const GAP = 2; // seconds gap between successive cards

  useMotionValueEvent(videoTime, 'change', (t) => {
    setCurrentT(t);
  });

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
    setCurrentT(time);
    setIsMenuOpen(false); // Close menu on navigation

    window.scrollTo({ top: targetY, behavior: 'smooth' });
  };

  // Get current active service
  const currentService = services.find((s, idx) => {
    const start = s.start;
    const end = s.end + DISPLAY_BUFFER;
    const nextStart = idx < services.length - 1 ? services[idx + 1].start : Infinity;
    return currentT >= start && currentT < end && currentT < nextStart - GAP;
  });

  const isEnhanced = currentService && (currentService.title as string) !== 'Contact Us';
  const isRightService = currentService && ['Web Development', 'Social Media Marketing'].includes(currentService.title as string);

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
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  fontWeight: 900,
                  fontSize: isMobile ? 'clamp(32px, 10vw, 48px)' : 'clamp(48px, 12vw, 140px)',
                  color: '#ffffff',
                  letterSpacing: isMobile ? '-1px' : '-3px',
                  textShadow: '0 8px 32px rgba(0,0,0,0.8)',
                  marginBottom: 8,
                  background: 'linear-gradient(135deg, #ffffff, #00e5ff)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                BYTES<span style={{ color: '#00e5ff' }}>.</span>
              </div>
              <div
                style={{
                  fontFamily: 'system-ui, -apple-system, sans-serif',
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
            transition={{ duration: 0.6 }}
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
              padding: isMobile ? '16px 8px 8px' : '0 16px', // no navbar now
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
                transition={{ duration: 0.8, ease: 'easeOut' }}
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
                  transition={{ delay: 0.3, duration: 0.6 }}
                  style={{
                    fontSize: isMobile ? 'clamp(24px, 6vw, 32px)' : 'clamp(32px, 6vw, 64px)',
                    fontWeight: 900,
                    color: '#ffffff',
                    marginBottom: isMobile ? 12 : 16,
                    lineHeight: 1.1,
                    textShadow: '0 4px 16px rgba(0,0,0,0.8)',
                    textAlign: currentService.side === 'center' ? 'center' : 'left',
                    background: isEnhanced
                      ? 'linear-gradient(90deg, #a6f9ff, #d4b0ff)'
                      : 'none',
                    WebkitBackgroundClip: isEnhanced ? 'text' : undefined,
                    WebkitTextFillColor: isEnhanced ? 'transparent' : undefined,
                  }}
                >
                  {currentService.title}
                </motion.h1>

                {/* Description */}
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  style={{
                    fontSize: isMobile ? 'clamp(14px, 2.5vw, 16px)' : 'clamp(16px, 2.5vw, 24px)',
                    color: '#ffffff',
                    opacity: 0.9,
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
                  transition={{ delay: 0.5, duration: 0.6 }}
                  style={{ marginBottom: isMobile ? 24 : 32 }}
                >
                  {currentService.features.map((feature, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.6 + idx * 0.1, duration: 0.4 }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: 12,
                        fontSize: isMobile ? 'clamp(12px, 2vw, 14px)' : 'clamp(14px, 2vw, 18px)',
                        color: '#ffffff',
                        opacity: 0.85,
                      }}
                    >
                      <div
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: '#00e5ff',
                          marginRight: 16,
                          boxShadow: '0 0 8px rgba(0, 229, 255, 0.6)',
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
                    transition={{ delay: 0.7, duration: 0.6 }}
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
                            fontSize: isMobile ? 'clamp(16px, 4vw, 20px)' : 'clamp(24px, 4vw, 36px)',
                            fontWeight: 900,
                            color: '#00e5ff',
                            textShadow: '0 0 12px rgba(0, 229, 255, 0.6)',
                          }}
                        >
                          {stat.value}
                        </div>
                        <div
                          style={{
                            fontSize: isMobile ? 'clamp(9px, 1.5vw, 11px)' : 'clamp(12px, 1.5vw, 16px)',
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
                    transition={{ delay: 0.8, duration: 0.4 }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: isMobile ? '12px 24px' : '8px 16px',
                      minWidth: isMobile ? 48 : undefined,
                      minHeight: isMobile ? 48 : undefined,
                      borderRadius: '25px',
                      fontSize: isMobile ? 16 : 14,
                      background: 'linear-gradient(135deg, #00e5ff, #0099ff)',
                      color: '#000',
                      fontWeight: 700,
                      textDecoration: 'none',
                      boxShadow: '0 8px 32px rgba(0, 229, 255, 0.4)',
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
                          background: 'radial-gradient(circle at 30% 30%, #f0c9ff, #9f3dff)',
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
                  transition={{ duration: 0.8, ease: 'easeOut' }}
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
                      width: '100%',
                      maxWidth: isMobile ? '120px' : '400px',
                      aspectRatio: '1',
                      borderRadius: 24,
                      overflow: 'hidden',
                      boxShadow: '0 20px 60px rgba(0, 229, 255, 0.2)',
                      border: '1px solid rgba(0, 229, 255, 0.3)',
                      background: 'rgba(0, 229, 255, 0.1)',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    <img
                      src={currentService.image}
                      alt={currentService.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navbar removed */}
      {false && <></>}

      {/* Mobile Menu */}
      {false && (
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              style={{
                position: 'fixed',
                top: '80px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(0, 0, 0, 0.8)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                padding: '16px',
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                zIndex: 9999,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                width: '90%',
                maxWidth: '400px',
              }}
            >
              <button
                onClick={() => scrollToTime(0)}
                style={{
                  background: currentT < services[0]?.start 
                    ? 'linear-gradient(135deg, #00e5ff, #0099ff)' 
                    : 'transparent',
                  color: currentT < services[0]?.start ? '#000' : '#fff',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '25px',
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textAlign: 'left',
                }}
              >
                Home
              </button>
              {services.map((s) => {
                const isActive = currentT >= s.start && currentT < s.end;
                const isContact = s.title === 'Contact Us';
                return (
                  <button
                    key={s.title}
                    onClick={() => scrollToTime(s.start)}
                    style={{
                      background: isActive
                        ? isContact
                          ? 'linear-gradient(135deg, #ff4d4f, #ff7875)'
                          : 'linear-gradient(135deg, #00e5ff, #0099ff)'
                        : 'transparent',
                      color: isActive ? '#000' : '#fff',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '25px',
                      fontSize: 16,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      textAlign: 'left',
                    }}
                  >
                    {s.title}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Progress indicator */}
      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: isMobile ? '80%' : '200px',
          height: '4px',
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '2px',
          overflow: 'hidden',
          zIndex: 10000,
        }}
      >
        <div
          style={{
            width: `${(currentT / duration) * 100}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #00e5ff, #0099ff)',
            borderRadius: '2px',
            transition: 'width 0.1s ease',
            boxShadow: '0 0 8px rgba(0, 229, 255, 0.6)',
          }}
        />
      </div>

      {/* Blinking Book Now Button */}
      <motion.a
        href="mailto:contact@bytesplatform.io?subject=Project%20Booking"
        initial={{ opacity: 1 }}
        animate={{ opacity: [1, 0.3] }}
        transition={{ duration: 0.8, repeat: Infinity, repeatType: 'reverse' }}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          padding: isMobile ? '10px 20px' : '12px 28px',
          borderRadius: '30px',
          background: 'linear-gradient(135deg, #00e5ff, #0099ff)',
          color: '#fff',
          fontSize: isMobile ? 14 : 16,
          fontWeight: 700,
          textDecoration: 'none',
          boxShadow: '0 4px 16px rgba(0, 229, 255, 0.4)',
          zIndex: 10001,
        }}
      >
        Book&nbsp;Now
      </motion.a>
    </div>
  );
}

export default VideoScroll;