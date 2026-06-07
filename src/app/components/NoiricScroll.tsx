"use client";

import React, { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { Coffee, MapPin, Clock } from "lucide-react";

export default function NoiricScroll() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [images, setImages] = useState<HTMLImageElement[]>([]);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // Responsive layout tracking
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Scroll tracking
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Smooth out the scroll progress to make animations feel luxury-grade and non-snappy
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 80,
    damping: 26,
    restDelta: 0.001
  });

  // Transform values for Phase 1 (0% - 30% scroll)
  // Frame sequence mapping
  const frameProgress = useTransform(smoothProgress, [0, 0.3], [1, 50]);
  
  // Title animations in Phase 1
  const titleOpacity = useTransform(smoothProgress, [0, 0.15, 0.2], [1, 0.5, 0]);
  const titleScale = useTransform(smoothProgress, [0, 0.2], [1, 1.1]);
  const titleY = useTransform(smoothProgress, [0, 0.2], ["0px", "-50px"]);

  // Background Blur transition (from 20% to 30% scroll)
  const blurValue = useTransform(smoothProgress, [0.2, 0.3], ["blur(0px)", "blur(20px)"]);

  // Phase 2: Cup Y animation
  const cupYDesktop = useTransform(smoothProgress, [0.3, 0.42, 0.65, 0.85, 1.0], ["100vh", "0vh", "0vh", "6vh", "6vh"]);
  const cupYMobile = useTransform(smoothProgress, [0.3, 0.42, 0.65, 0.85, 1.0], ["100vh", "0vh", "0vh", "-18vh", "-18vh"]);
  const cupY = isMobile ? cupYMobile : cupYDesktop;

  // Phase 2: Cup X animation
  const cupXDesktop = useTransform(smoothProgress, [0.3, 0.42, 0.65, 1.0], ["0vw", "0vw", "25vw", "25vw"]);
  const cupXMobile = useTransform(smoothProgress, [0.3, 0.42, 0.65, 1.0], ["0vw", "0vw", "0vw", "0vw"]);
  const cupX = isMobile ? cupXMobile : cupXDesktop;

  // Rotate cup (42% to 65%) and settle flat (65% to 85%)
  const cupRotate = useTransform(smoothProgress, [0.3, 0.42, 0.65, 0.85, 1.0], [0, 0, 12, 3, 3]);

  // Phase 2: Cup Scale
  const cupScaleDesktop = useTransform(smoothProgress, [0.3, 0.42, 0.65, 0.85, 1.0], [0.8, 1, 1, 0.93, 0.93]);
  const cupScaleMobile = useTransform(smoothProgress, [0.3, 0.42, 0.65, 0.85, 1.0], [0.55, 0.75, 0.75, 0.7, 0.7]);
  const cupScale = isMobile ? cupScaleMobile : cupScaleDesktop;

  // Cup Shadow Transforms (Simulates table contact)
  const shadowYDesktop = useTransform(smoothProgress, [0.3, 0.42, 0.65, 0.85, 1.0], ["100vh", "220px", "220px", "240px", "240px"]);
  const shadowYMobile = useTransform(smoothProgress, [0.3, 0.42, 0.65, 0.85, 1.0], ["100vh", "130px", "130px", "80px", "80px"]);
  const shadowY = isMobile ? shadowYMobile : shadowYDesktop;

  const shadowOpacity = useTransform(smoothProgress, [0.3, 0.42, 0.65, 0.85, 1.0], [0, 0, 0.2, 0.65, 0.65]);

  const shadowScaleDesktop = useTransform(smoothProgress, [0.65, 0.85], [1.3, 0.9]);
  const shadowScaleMobile = useTransform(smoothProgress, [0.65, 0.85], [0.9, 0.65]);
  const shadowScale = isMobile ? shadowScaleMobile : shadowScaleDesktop;

  // Phase 2: About Us Content (Left side) fade-in (38% to 50%, locked until end)
  const textOpacity = useTransform(smoothProgress, [0.38, 0.48, 0.65, 1.0], [0, 1, 1, 1]);
  
  const textYDesktop = useTransform(smoothProgress, [0.38, 0.48, 1.0], ["20px", "0px", "0px"]);
  const textYMobile = useTransform(smoothProgress, [0.38, 0.48, 1.0], ["40px", "0px", "0px"]);
  const textY = isMobile ? textYMobile : textYDesktop;

  // Phase 2 Parallax elements: scattered coffee beans and leaves (settling down next to the cup)
  const scatteredOpacity = useTransform(smoothProgress, [0.0, 0.3, 0.42, 1.0], [0, 0, 0.4, 0.4]);

  const scatteredXDesktop = useTransform(smoothProgress, [0.3, 0.42, 0.65, 1.0], ["40vw", "35vw", "37vw", "37vw"]);
  const scatteredXMobile = useTransform(smoothProgress, [0.3, 0.42, 0.65, 1.0], ["25vw", "20vw", "25vw", "25vw"]);
  const scatteredX = isMobile ? scatteredXMobile : scatteredXDesktop;

  const scatteredYDesktop = useTransform(smoothProgress, [0.3, 0.42, 0.65, 0.85, 1.0], ["-80vh", "-10vh", "15vh", "28vh", "28vh"]);
  const scatteredYMobile = useTransform(smoothProgress, [0.3, 0.42, 0.65, 0.85, 1.0], ["-80vh", "-10vh", "-10vh", "-12vh", "-12vh"]);
  const scatteredY = isMobile ? scatteredYMobile : scatteredYDesktop;

  const scatteredRotate = useTransform(smoothProgress, [0.3, 0.65, 0.85, 1.0], [-10, 5, 15, 15]);

  const scatteredScaleDesktop = useTransform(smoothProgress, [0.3, 0.65, 0.85, 1.0], [0.5, 0.7, 0.6, 0.6]);
  const scatteredScaleMobile = useTransform(smoothProgress, [0.3, 0.65, 0.85, 1.0], [0.35, 0.45, 0.4, 0.4]);
  const scatteredScale = isMobile ? scatteredScaleMobile : scatteredScaleDesktop;

  const leafOpacity = useTransform(smoothProgress, [0.0, 0.3, 0.42, 1.0], [0, 0, 0.6, 0.6]);

  const leafXDesktop = useTransform(smoothProgress, [0.3, 0.42, 0.65, 1.0], ["-20vw", "-10vw", "13vw", "13vw"]);
  const leafXMobile = useTransform(smoothProgress, [0.3, 0.42, 0.65, 1.0], ["-25vw", "-20vw", "-25vw", "-25vw"]);
  const leafX = isMobile ? leafXMobile : leafXDesktop;

  const leafYDesktop = useTransform(smoothProgress, [0.3, 0.42, 0.65, 0.85, 1.0], ["60vh", "30vh", "12vh", "18vh", "18vh"]);
  const leafYMobile = useTransform(smoothProgress, [0.3, 0.42, 0.65, 0.85, 1.0], ["60vh", "30vh", "-12vh", "-14vh", "-14vh"]);
  const leafY = isMobile ? leafYMobile : leafYDesktop;

  const leafRotate = useTransform(smoothProgress, [0.3, 0.65, 0.85, 1.0], [45, 15, -10, -10]);

  const leafScaleDesktop = useTransform(smoothProgress, [0.3, 0.65, 0.85, 1.0], [0.6, 0.8, 0.7, 0.7]);
  const leafScaleMobile = useTransform(smoothProgress, [0.3, 0.65, 0.85, 1.0], [0.4, 0.5, 0.45, 0.45]);
  const leafScale = isMobile ? leafScaleMobile : leafScaleDesktop;

  // Phase 3: Keep elements anchored and fully visible at the end of the scroll (no zoom-out/fade-out)
  const globalScale = useTransform(smoothProgress, [0.65, 1.0], [1, 1]);
  const globalOpacity = useTransform(smoothProgress, [0.65, 1.0], [1, 1]);
  const globalY = useTransform(smoothProgress, [0.65, 1.0], ["0px", "0px"]);

  // Keep background stable dark espresso to maintain premium white text legibility
  const bgColor = useTransform(smoothProgress, [0.65, 1.0], ["#2B2523", "#2B2523"]);

  // Pre-load images
  useEffect(() => {
    const loadedImages: HTMLImageElement[] = [];
    let loadedCount = 0;
    const totalFrames = 50;

    for (let i = 1; i <= totalFrames; i++) {
      const img = new Image();
      const frameNum = String(i).padStart(3, "0");
      img.src = `/hero-section-frame/ezgif-frame-${frameNum}.jpg`;
      img.onload = () => {
        loadedCount++;
        if (loadedCount === totalFrames) {
          setImagesLoaded(true);
        }
      };
      loadedImages.push(img);
    }
    setImages(loadedImages);
  }, []);

  // Draw frame on canvas
  useEffect(() => {
    if (!imagesLoaded || images.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions based on container/viewport size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // Draw first frame initially
      drawFrame(1);
    };

    const drawFrame = (index: number) => {
      const imgIndex = Math.min(50, Math.max(1, Math.round(index))) - 1;
      const img = images[imgIndex];
      if (img && img.complete) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // object-cover logic for canvas
        const imgRatio = img.width / img.height;
        const canvasRatio = canvas.width / canvas.height;
        
        let drawWidth = canvas.width;
        let drawHeight = canvas.height;
        let offsetX = 0;
        let offsetY = 0;
        
        if (canvasRatio > imgRatio) {
          drawHeight = canvas.width / imgRatio;
          offsetY = (canvas.height - drawHeight) / 2;
        } else {
          drawWidth = canvas.height * imgRatio;
          offsetX = (canvas.width - drawWidth) / 2;
        }
        
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Subscribe to frame progress changes
    const unsubscribe = frameProgress.on("change", (latest) => {
      requestAnimationFrame(() => drawFrame(latest));
    });

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      unsubscribe();
    };
  }, [imagesLoaded, images, frameProgress]);

  return (
    <div ref={containerRef} className="relative w-full h-[400vh] bg-[#2B2523]">
      {/* Sticky viewport container */}
      <motion.div
        style={{ backgroundColor: bgColor }}
        className="sticky top-0 left-0 w-full h-screen overflow-hidden flex items-center justify-center"
      >
        {/* Canvas for Phase 1 & 2 Frame sequence background */}
        <motion.div
          style={{ filter: blurValue, WebkitFilter: blurValue }}
          className="absolute inset-0 w-full h-full -z-20"
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full object-cover"
          />
          {/* Overlay gradient to darken/contrast the text */}
          <div className="absolute inset-0 bg-[#2B2523]/30" />
        </motion.div>

        {/* Phase 1 Overlay Centered Title */}
        <motion.div
          style={{ opacity: titleOpacity, scale: titleScale, y: titleY }}
          className="absolute z-10 text-center pointer-events-none select-none px-4"
        >
          <span className="text-xs sm:text-sm font-bold tracking-[0.3em] text-[#EADACF] uppercase block mb-3 animate-pulse">
            Something Delicious is Brewing
          </span>
          <h1 className="text-5xl sm:text-8xl md:text-9xl font-serif font-black tracking-wider text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
            NOIRIC CAFE
          </h1>
          <div className="w-20 sm:w-24 h-1 bg-[#d2b48c] mx-auto mt-4 sm:mt-6 rounded-full" />
        </motion.div>

        {/* Phase 2 Content Container */}
        <motion.div
          style={{ scale: globalScale, opacity: globalOpacity, y: globalY }}
          className="relative w-full h-full max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-center md:justify-between pointer-events-none z-20"
        >
          {/* Left Side: About Us Text Content */}
          <motion.div
            style={{ opacity: textOpacity, y: textY }}
            className="w-full md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left px-4 md:pr-4 mt-[32vh] md:mt-0"
          >
            <span className="text-xs font-bold tracking-widest text-[#d2b48c] uppercase mb-2">
              Our Philosophy
            </span>
            <h2 className="text-3xl sm:text-5xl font-serif font-bold text-white mb-4 sm:mb-6 leading-tight">
              Dark Vibes.<br />Rich Flavours.
            </h2>
            <p className="text-[#EADACF]/80 text-xs sm:text-base leading-relaxed mb-6 sm:mb-8 max-w-md">
              Step into a space where artisanal coffee crafting meets a dark, immersive sanctuary. We brew select single-origin beans, bake wood-fired pizzas, and design every moment to inspire you.
            </p>
            <div className="flex gap-4 items-center">
              <span className="text-[10px] sm:text-xs font-serif italic text-coffee-300">
                MG Road, Ambikapur
              </span>
            </div>
          </motion.div>

          {/* Right Side / Centered: Parallax floating elements */}
          
          {/* Cup Shadow (Simulates table contact) */}
          <motion.div
            style={{
              x: cupX,
              y: shadowY,
              scale: shadowScale,
              opacity: shadowOpacity,
            }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[160px] sm:w-[260px] h-[20px] bg-black/60 rounded-full filter blur-md z-10 pointer-events-none"
          />

          {/* Background Scattered Beans (Parallax - settles next to cup) */}
          <motion.div
            style={{
              x: scatteredX,
              y: scatteredY,
              rotate: scatteredRotate,
              scale: scatteredScale,
              opacity: scatteredOpacity,
            }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 sm:w-64 sm:h-64 select-none pointer-events-none"
          >
            <img
              src="/Coffe-scatterd.png"
              alt="Floating Coffee Beans"
              className="w-full h-full object-contain"
            />
          </motion.div>

          {/* Floating Leaf (Parallax - settles next to cup) */}
          <motion.div
            style={{
              x: leafX,
              y: leafY,
              rotate: leafRotate,
              scale: leafScale,
              opacity: leafOpacity,
            }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 sm:w-40 sm:h-40 select-none pointer-events-none"
          >
            <img
              src="/leaf.png"
              alt="Floating Leaf"
              className="w-full h-full object-contain"
            />
          </motion.div>

          {/* Main Hero Coffee Cup (slides in, rotates, and moves right) */}
          <motion.div
            style={{
              x: cupX,
              y: cupY,
              rotate: cupRotate,
              scale: cupScale,
            }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[220px] h-[330px] sm:w-[350px] sm:h-[520px] pointer-events-auto flex items-center justify-center"
          >
            <img
              src="/Coffe-front.png"
              alt="Noiric Coffee Cup"
              className="w-full h-full object-contain drop-shadow-[0_25px_60px_rgba(0,0,0,0.6)]"
            />
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          style={{ opacity: titleOpacity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/50 text-[10px] uppercase tracking-widest pointer-events-none select-none z-10"
        >
          <span>Scroll to Brew</span>
          <div className="w-1 h-8 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              animate={{ y: ["-100%", "100%"] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              className="w-full h-1/2 bg-[#d2b48c] rounded-full"
            />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
