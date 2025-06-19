import { useMotionValueEvent, useScroll, useTransform, motion, AnimatePresence } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSpring } from 'framer-motion';

const TOTAL_IMAGES = 2102; // Total frames in images_main
const CHUNK_SIZE = 100; // Larger chunk for faster loading
const LOAD_DELAY = 20; // Milliseconds between chunk loads

const LOADING_WORD = 'BYTES PLATFORM';

interface Overlay {
	start: number;
	end: number;
	element: JSX.Element;
	hideDuringLoading?: boolean;
}

function App() {
	const ref = useRef<HTMLCanvasElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [loadedCount, setLoadedCount] = useState(0);
	const [canvasSize, setCanvasSize] = useState({ width: window.innerWidth, height: window.innerHeight });
	const [frame, setFrame] = useState(1);

	// Update canvas size on window resize
	useEffect(() => {
		const handleResize = () => {
			setCanvasSize({
				width: window.innerWidth,
				height: window.innerHeight
			});
		};

		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	const { scrollYProgress } = useScroll({
		target: containerRef,
		offset: ['start start', 'end start']
	});

	const images = useMemo(() => {
		const loadedImages: HTMLImageElement[] = [];
		let loadCount = 0;

		const onLoad = () => {
			loadCount++;
			setLoadedCount(loadCount);
			if (loadCount === TOTAL_IMAGES) {
				setIsLoading(false);
			}
		};

		const onError = (index: number) => {
			console.error(`Failed to load image ${index}`);
			onLoad(); // Still increment counter to prevent hanging
		};

		// Load images in smaller chunks with optimized delay
		const loadImageChunk = (startIdx: number, endIdx: number) => {
			for (let i = startIdx; i <= endIdx; i++) {
				const img = new Image();
				img.onload = onLoad;
				img.onerror = () => onError(i);
				const frameNumber = i.toString().padStart(4, '0');
				img.src = `/images_main/frame_${frameNumber}.webp`;
				loadedImages[i - 1] = img;
			}
		};

		// Load first chunk immediately for fast initial display
		loadImageChunk(1, CHUNK_SIZE);

		// Load remaining chunks with delay
		for (let i = CHUNK_SIZE + 1; i <= TOTAL_IMAGES; i += CHUNK_SIZE) {
			const endIdx = Math.min(i + CHUNK_SIZE - 1, TOTAL_IMAGES);
			const chunkIndex = Math.floor(i / CHUNK_SIZE);
			setTimeout(() => loadImageChunk(i, endIdx), chunkIndex * LOAD_DELAY);
		}

		return loadedImages;
	}, []);

	const render = useCallback(
		(index: number) => {
			if (!isLoading && images[index - 1] && ref.current) {
				const ctx = ref.current.getContext('2d');
				const img = images[index - 1];
				
				if (ctx && img.complete) {
					// Use requestAnimationFrame for smoother rendering
					requestAnimationFrame(() => {
						// Get the canvas dimensions
						const canvasWidth = ref.current!.width;
						const canvasHeight = ref.current!.height;

						// Calculate the scaling ratios
						const scaleWidth = canvasWidth / img.width;
						const scaleHeight = canvasHeight / img.height;
						
						// Use the larger scale to ensure the image covers the entire canvas
						const scale = Math.max(scaleWidth, scaleHeight);
						
						// Calculate dimensions that will cover the entire canvas
						const drawWidth = img.width * scale;
						const drawHeight = img.height * scale;
						
						// Center the image
						const x = (canvasWidth - drawWidth) / 2;
						const y = (canvasHeight - drawHeight) / 2;
						
						// Clear the canvas and draw the new image
						ctx.clearRect(0, 0, canvasWidth, canvasHeight);
						ctx.drawImage(img, x, y, drawWidth, drawHeight);
					});
				}
			}
		},
		[images, isLoading]
	);

	const currentIndex = useTransform(scrollYProgress, [0, 1], [1, TOTAL_IMAGES]);

	// Add spring smoothing with optimized parameters for smoother scrolling
	const smoothIndex = useSpring(currentIndex, {
		stiffness: 45,    // Lower stiffness for smoother transitions
		damping: 25,      // Higher damping to reduce oscillation
		mass: 0.3,        // Light mass for responsiveness
		restSpeed: 0.1    // Lower rest speed for more precise settling
	});

	useMotionValueEvent(smoothIndex, 'change', (latest) => {
		const index = Math.min(Math.max(Math.round(latest), 1), TOTAL_IMAGES);
		setFrame(index);
		render(index);
	});

	useEffect(() => {
		if (!isLoading) {
			render(1);
		}
	}, [render, isLoading]);

	// Overlay definitions (mountain ridge pointers & contact form)
	const pointerStyleBase = {
		position: 'absolute' as const,
		transform: 'translate(-50%, -50%)',
		fontFamily: 'sans-serif',
		pointerEvents: 'none' as const
	};

	const cardStyle: React.CSSProperties = {
		background: 'rgba(17,17,17,0.55)',
		backdropFilter: 'blur(8px)',
		WebkitBackdropFilter: 'blur(8px)',
		padding: '24px 28px',
		borderRadius: 12,
		boxShadow: '0 6px 20px rgba(0,0,0,0.6)',
		color: 'white',
		minWidth: 300,
		textAlign: 'center',
		pointerEvents: 'none',
		position: 'relative',
	};

	const Line: React.FC<{ x1: string; y1: string; x2: string; y2: string }> = ({ x1, y1, x2, y2 }) => (
		<svg
			style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
		>
			<line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#00e5ff" strokeWidth="2" strokeDasharray="4 4" />
		</svg>
	);

	const overlays: Overlay[] = [
		{
			start: 1,
			end: 160,
			hideDuringLoading: true,
			element: (
				<div style={{ position: 'fixed', inset: 0 }}>
					<div style={{ ...pointerStyleBase, top: '50%', left: '50%' }}>
						<motion.div
							className="glass-card"
							initial={{ scale: 0.8, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							exit={{ scale: 0.8, opacity: 0 }}
							transition={{ duration: 0.8 }}
							style={{
								...cardStyle,
								padding: '32px 48px',
								maxWidth: 320,
								textAlign: 'center',
							}}
						>
							<div style={{ fontSize: 32, fontWeight: 700, marginBottom: 12, color: '#00e5ff' }}>Bytes Platform</div>
							<div style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Digital Services Suite</div>
							<div style={{ fontSize: 14, lineHeight: 1.4 }}>
								Crafting world-class apps, websites &amp; marketing campaigns that
								elevate brands in the digital era.
							</div>
							<button style={{ marginTop: 24, padding: '12px 28px', borderRadius: 30, border: 'none', background: 'linear-gradient(90deg,#E3B873 0%,#8D5A20 100%)', color: '#0B0D0F', fontWeight: 700, cursor: 'pointer', pointerEvents:'auto' }}>
								Learn More
							</button>
						</motion.div>
					</div>
				</div>
			)
		},
		{
			start: 190,
			end: 320,
			element: (
				<div style={{ position: 'fixed', inset: 0 }}>
					<div style={{ ...pointerStyleBase, top: '25%', left: '20%' }}>
						<div style={cardStyle}>
							<div style={{ position: 'absolute', right: '105%', top: '50%', transform: 'translateY(-50%)' }}>
								<span style={{ fontSize: 64, display: 'block', animation: 'float 6s ease-in-out infinite' }}>📱</span>
							</div>
							<div style={{ fontWeight: 700, color: '#00e5ff', marginBottom: 10, fontSize: 24 }}>App Development</div>
							<div style={{ fontSize: 14, maxWidth: 230, lineHeight: 1.4 }}>
								Native, cross-platform & PWA apps built with React&nbsp;Native,
								Flutter and Swift/Kotlin. From MVP to App&nbsp;Store launch—plus
								continuous delivery, crash reporting & analytics.
							</div>
						</div>
					</div>
				</div>
			)
		},
		{
			start: 390,
			end: 470,
			element: (
				<div style={{ position: 'fixed', inset: 0 }}>
					{/* connecting line from AppDev to WebDev */}
					<Line x1="20%" y1="25%" x2="85%" y2="20%" />
					<div style={{ ...pointerStyleBase, top: '20%', left: '85%' }}>
						<div style={cardStyle}>
							<span style={{ fontSize: 64, display: 'block', animation: 'float 6s ease-in-out infinite' }}>🌐</span>
							<div style={{ fontWeight: 700, color: '#00e5ff', marginBottom: 6 }}>Web Development</div>
							<div style={{ fontSize: 14, maxWidth: 240, lineHeight: 1.4 }}>
								Jamstack / Next.js sites that load in under&nbsp;1&nbsp;sec, score 95+ on
								Lighthouse and integrate seamlessly with headless CMS or
								e-commerce back-ends.
							</div>
						</div>
					</div>
				</div>
			)
		},
		{
			start: 610,
			end: 800,
			element: (
				<div style={{ position: 'fixed', inset: 0 }}>
					<Line x1="85%" y1="20%" x2="55%" y2="55%" />
					<div style={{ ...pointerStyleBase, top: '55%', left: '55%' }}>
						<div style={cardStyle}>
							<span style={{ fontSize: 64, display: 'block', animation: 'float 6s ease-in-out infinite' }}>📈</span>
							<div style={{ fontWeight: 700, color: '#00e5ff', marginBottom: 6 }}>Social Media Marketing</div>
							<div style={{ fontSize: 14, maxWidth: 240, lineHeight: 1.4 }}>
								Strategy, creative, paid ads and community management. Weekly KPI
								reviews and data-driven tweaks to maximise engagement &amp; reach.
							</div>
						</div>
					</div>
				</div>
			)
		},
		{
			start: 1300,
			end: 1500,
			element: (
				<div style={{ position: 'fixed', inset: 0 }}>
					<Line x1="55%" y1="55%" x2="30%" y2="25%" />
					<div style={{ ...pointerStyleBase, top: '25%', left: '30%' }}>
						<div style={cardStyle}>
							<span style={{ fontSize: 64, display: 'block', animation: 'float 6s ease-in-out infinite' }}>🔍</span>
							<div style={{ fontWeight: 700, color: '#00e5ff', marginBottom: 6 }}>SEO</div>
							<div style={{ fontSize: 14, maxWidth: 220, lineHeight: 1.4 }}>
								Technical audits, Core&nbsp;Web&nbsp;Vitals, schema markup and backlink
								outreach to rank you on page&nbsp;1—and keep you there.
							</div>
						</div>
					</div>
				</div>
			)
		},
		{
			start: 1580,
			end: 2000,
			element: (
				<motion.div
					initial={{ opacity: 0, y: 40 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -40 }}
					style={{
						position: 'fixed',
						top: '50%',
						left: '50%',
						transform: 'translate(-50%, -50%)',
						zIndex: 10
					}}
				>
					<div style={{ ...cardStyle, padding: '24px 32px', minWidth: 260 }}>
						<div style={{ fontWeight: 700, color: '#00e5ff', fontSize: 24, marginBottom: 12 }}>Get in touch</div>
						<div style={{ fontSize: 14, marginBottom: 8 }}>Email: contact@bytesplatform.io</div>
						<div style={{ fontSize: 14, marginBottom: 8 }}>Phone: +1&nbsp;(555)&nbsp;123-4567</div>
						<div style={{ fontSize: 14 }}>Address: 42 Innovation Way, Tech City</div>
					</div>
				</motion.div>
			)
		}
	];

	return (
		<div
			ref={containerRef}
			style={{
				minHeight: '800vh', // Increased scroll height for more images
				backgroundColor: 'black',
				position: 'relative',
				display: 'flex',
				flexDirection: 'column',
			}}
		>
			<style>{`
				@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
				@keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }
				@keyframes bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
				@keyframes float { 0% { transform: translateY(0); } 50% { transform: translateY(-12px); } 100% { transform: translateY(0); } }

				.glass-card {
					position: relative;
				}
				.glass-card::before {
					content: '';
					position: absolute; inset: 0;
					border-radius: 20px;
					padding: 2px;
					background: linear-gradient(140deg,#E3B873 0%,#8D5A20 100%);
					-webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
					-webkit-mask-composite: xor;
					mask-composite: exclude;
				}
			`}</style>
			{isLoading && (
				<div style={{
					position: 'fixed',
					top: '50%',
					left: '50%',
					transform: 'translate(-50%, -50%)',
					color: 'white',
					fontSize: '48px',
					textAlign: 'center',
					fontFamily: 'monospace',
					letterSpacing: '4px',
					zIndex: 1000
				}}>
					{(() => {
						const lettersOnly = LOADING_WORD.replace(/\s/g, '');
						const currentIdx = Math.floor((loadedCount / TOTAL_IMAGES) * lettersOnly.length);
						let letterCounter = 0;
						return Array.from(LOADING_WORD).map((char, idx) => {
							let myIndex = null;
							if (char !== ' ') {
								myIndex = letterCounter;
								letterCounter++;
							}

							const isVisible = myIndex !== null && myIndex <= currentIdx;
							const isCurrent = myIndex !== null && myIndex === currentIdx;

							return (
								<span key={idx} style={{
									opacity: char === ' ' ? 1 : isVisible ? 1 : 0.05,
									color: isCurrent ? '#00e5ff' : 'white',
									textShadow: isCurrent ? '0 0 8px #00e5ff' : 'none',
									transition: 'opacity 0.3s ease, color 0.3s ease'
								}}>{char}</span>
							);
						});
					})()}
					<div style={{ fontSize: '14px', marginTop: '16px' }}>
						Loading {loadedCount}/{TOTAL_IMAGES}
					</div>
				</div>
			)}
			<div style={{
				position: 'fixed',
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				overflow: 'hidden'
			}}>
				<canvas
					ref={ref}
					width={canvasSize.width}
					height={canvasSize.height}
					style={{
						width: '100%',
						height: '100%',
						opacity: isLoading ? 0 : 1,
						transition: 'opacity 0.5s ease'
					}}
				/>
				{/* Overlay container */}
				<AnimatePresence>
					{overlays.map((o, i) => {
						const active = frame >= o.start && frame <= o.end;
						if (!active) return null;
						if (o.hideDuringLoading && isLoading) return null;
						return (
							<motion.div
								key={i}
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								style={{
									position: 'fixed',
									top: 0,
									left: 0,
									right: 0,
									bottom: 0,
									display: 'flex',
									justifyContent: 'center',
									alignItems: 'center',
									pointerEvents: 'none'
								}}
							>
								{o.element}
							</motion.div>
						);
					})}
				</AnimatePresence>
			</div>
		</div>
	);
}

export default App;
