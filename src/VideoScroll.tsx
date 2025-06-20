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
  FaArrowRight,
  FaPlay,
} from 'react-icons/fa';

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
      start: 32,
      end: 38,
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
      start: 38,
      end: 44,
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
      start: 45,
      end: 51,
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
      start: 52,
      end: 56,
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
      start: 63,
      end: 70,
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

    window.scrollTo({ top: targetY, behavior: 'smooth' });
  };

  // Get current active service
  const currentService = services.find(s => currentT >= s.start && currentT < s.end);

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
            : 'rgba(0,0,0,0.2)',
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
                  fontSize: 'clamp(48px, 12vw, 140px)',
                  color: '#ffffff',
                  letterSpacing: '-3px',
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
                  fontSize: 'clamp(16px, 4vw, 28px)',
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
                  marginTop: 24,
                  fontSize: 'clamp(14px, 2vw, 18px)',
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
              pointerEvents: 'none',
              zIndex: 50,
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                gap: isMobile ? '2rem' : '4rem',
                maxWidth: '1400px',
                width: '90%',
                alignItems: 'center',
              }}
            >
              {/* Text Content */}
              <motion.div
                initial={{ x: currentService.side === 'right' ? 100 : -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                style={{
                  order: currentService.side === 'right' ? 2 : 1,
                  textAlign: currentService.side === 'center' ? 'center' : 'left',
                }}
              >
                {/* Service Icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, duration: 0.6, type: 'spring' }}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #00e5ff, #0099ff)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 24,
                    boxShadow: '0 8px 32px rgba(0, 229, 255, 0.4)',
                  }}
                >
                  {currentService.title === 'App Development' ? <FaMobileAlt size={32} color="#000" />
                    : currentService.title === 'Web Development' ? <FaGlobe size={32} color="#000" />
                    : currentService.title === 'Search Engine Optimization' ? <FaSearch size={32} color="#000" />
                    : currentService.title === 'Social Media Marketing' ? <FaChartLine size={32} color="#000" />
                    : <FaEnvelope size={32} color="#000" />}
                </motion.div>

                {/* Title */}
                <motion.h1
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  style={{
                    fontSize: 'clamp(32px, 6vw, 64px)',
                    fontWeight: 800,
                    color: '#ffffff',
                    marginBottom: 16,
                    lineHeight: 1.1,
                    textShadow: '0 4px 16px rgba(0,0,0,0.8)',
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
                    fontSize: 'clamp(16px, 2.5vw, 24px)',
                    color: '#ffffff',
                    opacity: 0.9,
                    marginBottom: 32,
                    lineHeight: 1.6,
                    fontWeight: 300,
                  }}
                >
                  {currentService.desc}
                </motion.p>

                {/* Features List */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                  style={{ marginBottom: 32 }}
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
                        fontSize: 'clamp(14px, 2vw, 18px)',
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
                      gap: '2rem',
                      flexWrap: 'wrap',
                      marginBottom: 32,
                    }}
                  >
                    {currentService.stats.map((stat, idx) => (
                      <div key={idx} style={{ textAlign: 'center' }}>
                        <div
                          style={{
                            fontSize: 'clamp(24px, 4vw, 36px)',
                            fontWeight: 800,
                            color: '#00e5ff',
                            textShadow: '0 0 12px rgba(0, 229, 255, 0.6)',
                          }}
                        >
                          {stat.value}
                        </div>
                        <div
                          style={{
                            fontSize: 'clamp(12px, 1.5vw, 16px)',
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
                      fontSize: isMobile ? 18 : 14,
                      background: 'linear-gradient(135deg, #00e5ff, #0099ff)',
                      color: '#000',
                      fontWeight: 700,
                      textDecoration: 'none',
                      boxShadow: '0 8px 32px rgba(0, 229, 255, 0.4)',
                      transition: 'transform 0.2s ease',
                      pointerEvents: 'auto',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    Get Started <FaArrowRight />
                  </motion.a>
                )}
              </motion.div>

              {/* Visual Element */}
              {currentService.image && currentService.title !== 'Contact Us' && (
                <motion.div
                  initial={{ 
                    x: currentService.side === 'right' ? -100 : 100, 
                    opacity: 0,
                    scale: 0.8 
                  }}
                  animate={{ x: 0, opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  style={{
                    order: currentService.side === 'right' ? 1 : 2,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      maxWidth: 400,
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

      {/* Enhanced Navbar */}
      <nav
        style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          padding: '12px 24px',
          borderRadius: '50px',
          display: 'flex',
          gap: '8px',
          zIndex: 10000,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        }}
      >
        {/* Home Button */}
        {(() => {
          const firstStart = services[0]?.start ?? 10;
          const isActiveHome = currentT < firstStart;
          if (isMobile && !isActiveHome) {
            return null; // mobile: show Home only when active
          }
          return (
            <button
              onClick={() => scrollToTime(0)}
              style={{
                background: isActiveHome 
                  ? 'linear-gradient(135deg, #00e5ff, #0099ff)' 
                  : 'transparent',
                color: isActiveHome ? '#000' : '#fff',
                border: 'none',
                padding: isMobile ? '12px 24px' : '8px 16px',
                minWidth: isMobile ? 48 : undefined,
                minHeight: isMobile ? 48 : undefined,
                borderRadius: '25px',
                fontSize: isMobile ? 18 : 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                whiteSpace: 'nowrap',
                boxShadow: isActiveHome ? '0 4px 16px rgba(0, 229, 255, 0.4)' : 'none',
              }}
            >
              Home
            </button>
          );
        })()}

        {services.map((s, idx) => {
          const isActive = currentT >= s.start && currentT < s.end;
          const isContact = s.title === 'Contact Us';
          if (isMobile && !isActive) {
            return null; // mobile: hide inactive section buttons
          }
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
                padding: isMobile ? '12px 24px' : '8px 16px',
                minWidth: isMobile ? 48 : undefined,
                minHeight: isMobile ? 48 : undefined,
                borderRadius: '25px',
                fontSize: isMobile ? 18 : 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                whiteSpace: 'nowrap',
                boxShadow: isActive
                  ? isContact
                    ? '0 4px 16px rgba(255, 77, 79, 0.4)'
                    : '0 4px 16px rgba(0, 229, 255, 0.4)'
                  : 'none',
              }}
            >
              {s.title}
            </button>
          );
        })}
      </nav>

      {/* Progress indicator */}
      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '200px',
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
    </div>
  );
}

export default VideoScroll;