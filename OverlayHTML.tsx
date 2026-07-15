'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Heart, ExternalLink } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

import TetrisGame from './TetrisGame';

export default function OverlayHTML() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<HTMLDivElement>(null);

  // State to manage candle blowing
  const [isBlown, setIsBlown] = useState(false);

  // Generate 100 procedural stars in CSS to represent a rich, lag-free universe
  const starArray = useMemo(() => {
    const stars = [];
    let seed = 42;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
    for (let i = 0; i < 100; i++) {
      stars.push({
        id: i,
        top: `${Math.round(random() * 100)}%`,
        left: `${Math.round(random() * 100)}%`,
        size: `${(0.8 + random() * 2.2).toFixed(2)}px`,
        delay: `${(random() * 4).toFixed(2)}s`,
        duration: `${(2 + random() * 3).toFixed(2)}s`,
      });
    }
    return stars;
  }, []);

  // Generate 32 scroll-driven particle sparkles centered inside the gift box frame
  const sparkleParticles = useMemo(() => {
    const particles = [];
    let seed = 777;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
    const colors = [
      '#ec4899', // Pink
      '#00f5d4', // Teal
      '#ffd700', // Gold
      '#9d4edd', // Purple
      '#ffffff', // White
    ];

    for (let i = 0; i < 32; i++) {
      const angle = random() * Math.PI * 2;
      // Radial explosion distance: 100px to 280px
      const distance = 100 + random() * 180;
      
      particles.push({
        id: i,
        targetX: Math.round(Math.cos(angle) * distance),
        // Upward bias simulation (fireworks rocket style) and round to prevent decimal mismatches
        targetY: Math.round(Math.sin(angle) * distance - 60),
        color: colors[Math.floor(random() * colors.length)],
        size: Math.round(6 + random() * 8), // 6px to 14px size particles
      });
    }
    return particles;
  }, []);

  // Split string into letter spans for staggered reveals
  const title1Spans = useMemo(() => {
    return "HAPPY BIRTHDAY".split("").map((char, index) => ({
      char: char === " " ? "\u00A0" : char,
      index
    }));
  }, []);

  const title2Spans = useMemo(() => {
    return "Amelia".split("").map((char, index) => ({
      char: char === " " ? "\u00A0" : char,
      index
    }));
  }, []);

  // Mouse tilt parallax effect for the message card
  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const xc = rect.width / 2;
    const yc = rect.height / 2;
    const tiltX = (yc - y) / 10;
    const tiltY = (x - xc) / 10;
    
    gsap.to(card, {
      transform: `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.02, 1.02, 1.02)`,
      duration: 0.3,
      ease: 'power2.out',
      overwrite: 'auto'
    });
  };

  const handleCardMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    gsap.to(card, {
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
      duration: 0.5,
      ease: 'power2.out',
      overwrite: 'auto'
    });
  };

  // Blow out candles with rising smoke particle bubbles
  const handleBlowCandles = () => {
    setIsBlown(true);
    
    // Animate smoke bubbles floating upwards from the candles
    gsap.fromTo('.smoke-bubble', 
      { y: 0, opacity: 0.8, scale: 0.3 },
      { 
        y: -100, 
        x: (i) => (i === 0 ? -30 : i === 2 ? 30 : 0) + (Math.random() * 12 - 6),
        opacity: 0, 
        scale: 1.8, 
        stagger: 0.08, 
        duration: 2.0, 
        ease: 'power2.out' 
      }
    );
  };

  // Relight candles on double clicking the card
  const handleRelightCake = () => {
    if (isBlown) {
      setIsBlown(false);
      gsap.set('.smoke-bubble', { y: 0, opacity: 0, scale: 0.5 });
    }
  };

  useEffect(() => {
    // 1. Intro Section Text Fade & Scale on Scroll
    gsap.to('#intro-content', {
      opacity: 0,
      y: -60,
      scale: 0.95,
      scrollTrigger: {
        trigger: '#section-intro',
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      }
    });

    // 2. Interactive CSS Gift Box opening ScrollTrigger (100% scroll-bound)
    const openTl = gsap.timeline({
      scrollTrigger: {
        trigger: '#section-opening',
        start: 'top 80%',
        end: 'bottom center',
        scrub: 1.0,
      }
    });

    // Box lid flies off, core glow expands
    openTl
      .to('#box-lid', {
        y: -120,
        x: 60,
        rotation: 45,
        opacity: 0,
        ease: 'power2.inOut',
      })
      .to('#box-glow', {
        opacity: 1,
        scale: 1.5,
        ease: 'power1.out',
      }, 0);

    // Staggered radial explosion of sparkles (moves and fades matching scroll exactly)
    openTl
      .to('.scroll-sparkle', {
        x: (i, el) => el.getAttribute('data-x'),
        y: (i, el) => el.getAttribute('data-y'),
        scale: 1.2,
        opacity: 1.0,
        stagger: {
          each: 0.008,
          from: 'random',
        },
        duration: 0.6,
        ease: 'power2.out',
      }, 0.05)
      // Fade out particles towards the end of scroll
      .to('.scroll-sparkle', {
        opacity: 0,
        scale: 0.2,
        duration: 0.35,
        ease: 'power1.in',
      }, 0.55)
      // Gradually shrink and fade out the opened box container to prepare for next section
      .to('#css-gift-box', {
        opacity: 0,
        scale: 0.2,
        y: -50,
        duration: 0.45,
      }, 0.55);

    // 3. Birthday Title Reveal Stagger
    const titleTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: '#section-birthday',
        start: 'top 80%',
        end: 'top 30%',
        scrub: 1.0,
      }
    });

    titleTimeline
      .fromTo('.title1-char', 
        { opacity: 0, scale: 0.5, y: 30, filter: 'blur(10px)' },
        { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)', stagger: 0.03, ease: 'power2.out' }
      )
      .fromTo('.title2-char',
        { opacity: 0, scale: 0.4, y: 40, filter: 'blur(12px)' },
        { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)', stagger: 0.04, ease: 'back.out(1.4)' },
        '-=0.2'
      )
      .fromTo(cardRef.current,
        { opacity: 0, y: 60, scale: 0.93 },
        { opacity: 1, y: 0, scale: 1, ease: 'back.out(1.1)' },
        '-=0.3'
      );

    // Floating idle animation for birthday text
    gsap.to('.birthday-title-2', {
      y: '-=12',
      duration: 3,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });

    // 4. Interactive Birthday Cake Reveal
    gsap.fromTo('#birthday-cake-card',
      { opacity: 0, y: 50, scale: 0.95 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '#birthday-cake-card',
          start: 'top 85%',
          end: 'top 55%',
          scrub: true,
        }
      }
    );

    // 5. Memory Gallery reveals
    const galleryItems = galleryRef.current?.querySelectorAll('.gallery-card, .gallery-card-portal');
    if (galleryItems) {
      gsap.fromTo(galleryItems,
        { opacity: 0, y: 50, scale: 0.94 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          stagger: 0.1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: '#section-gallery',
            start: 'top 80%',
            end: 'center center',
            scrub: true,
          }
        }
      );
    }

    // 6. Closing Video reveal
    gsap.fromTo(videoRef.current,
      { opacity: 0, scale: 0.93, y: 60 },
      {
        opacity: 1,
        scale: 1,
        y: 0,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '#section-closing',
          start: 'top 85%',
          end: 'center center',
          scrub: true,
        }
      }
    );

    // 7. Playable Game reveal
    gsap.fromTo(gameRef.current,
      { opacity: 0, scale: 0.93, y: 60 },
      {
        opacity: 1,
        scale: 1,
        y: 0,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '#section-game',
          start: 'top 85%',
          end: 'center center',
          scrub: true,
        }
      }
    );

  }, []);

  return (
    <div ref={containerRef} style={{ width: '100%', position: 'relative', zIndex: 10 }}>
      {/* Immersive solar system starry sky background */}
      <div className="stars-bg">
        {/* Deep Nebulas */}
        <div className="nebula-pink" />
        <div className="nebula-blue" />
        
        {/* Illustrated 2D Planets */}
        <div className="bg-planet bg-saturn" />
        <div className="bg-planet bg-jupiter" />

        {/* Shooting Stars / Comets */}
        <div className="shooting-star ss-1" />
        <div className="shooting-star ss-2" />
        <div className="shooting-star ss-3" />

        <div className="stars-container">
          {starArray.map((star) => (
            <div
              key={star.id}
              className="star"
              style={{
                top: star.top,
                left: star.left,
                width: star.size,
                height: star.size,
                animationDelay: star.delay,
                animationDuration: star.duration,
              }}
            />
          ))}
        </div>
      </div>

      {/* SECTION 1: INTRO COVER */}
      <section id="section-intro" className="scroll-section">
        <div id="intro-content" className="section-intro-text">
          <p className="intro-badge text-glow-pink">
            A Journey of Beautiful Moments
          </p>
          <h1 className="intro-title font-cursive text-glow-gold">
            For Amelia
          </h1>
          <p className="intro-desc">
            Welcome to a cosmic journey celebrating the starlight you bring into our lives. A visual orbit through memories, laughter, and milestones.
          </p>
        </div>
        
        <div className="scroll-indicator-container">
          <span className="scroll-indicator-text">Scroll to begin</span>
          <div className="scroll-indicator-line">
            <div className="scroll-indicator-dot" />
          </div>
        </div>
      </section>

      {/* SECTION 2: MAGICAL GIFT OPENING */}
      <section id="section-opening" className="scroll-section">
        <div className="sticky-opening-header" style={{ marginBottom: '40px' }}>
          <p className="sticky-opening-badge">Reaching the orbital core...</p>
          <h2 className="sticky-opening-title">
            A magical gift is opening. Keep scrolling.
          </h2>
        </div>

        {/* Interactive CSS 3D Gift Box */}
        <div className="gift-box-wrapper" id="css-gift-box">
          <div className="box-glow-core" id="box-glow" />

          {/* Scroll-driven fireworks sparkles nested within the box frame */}
          {sparkleParticles.map((p) => (
            <div
              key={p.id}
              className="scroll-sparkle"
              data-x={p.targetX}
              data-y={p.targetY}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: `${p.size}px`,
                height: `${p.size}px`,
                backgroundColor: p.color,
                borderRadius: '50%',
                transform: 'translate(-50%, -50%) scale(0)',
                opacity: 0,
                boxShadow: `0 0 10px ${p.color}, 0 0 20px ${p.color}`,
                pointerEvents: 'none',
                zIndex: 8,
              }}
            />
          ))}

          <div className="gift-box-lid" id="box-lid">
            <div className="bow-left" />
            <div className="bow-right" />
            <div className="lid-ribbon-horiz" />
            <div className="lid-ribbon-vert" />
          </div>
          <div className="gift-box-body">
            <div className="ribbon-horiz" />
            <div className="ribbon-vert" />
          </div>
        </div>
      </section>

      {/* SECTION 3: BIRTHDAY REVEAL & MESSAGE CARD */}
      <section id="section-birthday" className="scroll-section">
        <div className="page-container" style={{ maxWidth: '1024px', padding: '0 16px', marginBottom: '64px' }}>
          <h2 className="birthday-header select-none">
            <span className="birthday-title-1 shimmer-text">
              {title1Spans.map((item) => (
                <span key={item.index} className="title1-char" style={{ display: 'inline-block' }}>
                  {item.char}
                </span>
              ))}
            </span>
            <span className="birthday-title-2 font-cursive text-glow-gold">
              {title2Spans.map((item) => (
                <span key={item.index} className="title2-char" style={{ display: 'inline-block' }}>
                  {item.char}
                </span>
              ))}
            </span>
          </h2>

          <div
            ref={cardRef}
            onMouseMove={handleCardMouseMove}
            onMouseLeave={handleCardMouseLeave}
            className="glass-card glass-glow-pink interactive-content"
            style={{ transformStyle: 'preserve-3d', transition: 'border-color 0.4s ease, box-shadow 0.4s ease' }}
          >
            <div className="card-quote-start select-none">“</div>
            <div className="card-quote-end select-none">”</div>
            
            <div className="card-text" style={{ transform: 'translateZ(30px)', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 className="font-cursive text-glow-gold" style={{ fontSize: '2.0rem', color: 'var(--color-gold)', textAlign: 'center', marginBottom: '8px' }}>
                Happy Birthday Ayangkuuuu Ameliaa ❤️
              </h3>
              <p>
                Selamat Ulang Tahun Yaa Cintaa, tepat di hari ini 16 Juli adalah hari yang sangat spesial buat aku. Karena hari ini adalah hari lahir orang yang paling berharga di sepanjang umurku hingga sekarang. Aku tahu momen ini adalah momen yang sebenarnya ingin kamu lewati ayangg, tapi percayalah ayang ada satu manusia yang sangat berharap kamu panjang umur, sehat selalu dan bahagia selamanya.
              </p>
              <p>
                Terimakasih udah selalu ada, sudah bikin hari-hariku lebih bahagia, dan sudah menjadi alasan aku untuk menjalani hidup menjadi orang yang lebih baik, tersenyum setiap hari liat ayang. Aku sangat bersyukur bisa kenal dan mempunyai ayang hingga sekarang.
              </p>
              <p>
                Tetap jadi perempuan yang kuat, baik, dan hebat seperti sekarang yaah ayangkuu. Sekarang dan selamanya aku akan selalu ada untuk ayang. Yang sabar yah ayang, kita hadapi bersama. Forever !
              </p>
            </div>
            
            <div className="card-footer" style={{ transform: 'translateZ(20px)', marginTop: '16px' }}>
              <Heart className="w-4 h-4" style={{ fill: 'var(--color-pink)', color: 'var(--color-pink)' }} />
              <span className="card-footer-text">
                Forever & Always
              </span>
            </div>
          </div>
        </div>

        <div className="section-intro-text" style={{ marginTop: '48px', marginBottom: '40px' }}>
          <h2 className="intro-title text-glow-gold font-cursive" style={{ fontSize: '3.0rem' }}>
            Make a Wish, Amelia
          </h2>
        </div>

        {/* Interactive Birthday Cake element */}
        <div
          id="birthday-cake-card"
          onDoubleClick={handleRelightCake}
          className="glass-card glass-glow-pink interactive-content select-none"
          style={{ maxWidth: '540px', padding: '40px 24px', cursor: 'pointer' }}
          title="Double click card to relight candles!"
        >
          <div className="cake-wrapper">
            <div className="cake-candles">
              {/* Candle 1 */}
              <div className="candle-container">
                <div className={`candle-flame ${isBlown ? 'blown' : ''} flame-1`} />
                <div className="candle-stick" />
              </div>
              {/* Candle 2 (Center) */}
              <div className="candle-container">
                <div className={`candle-flame ${isBlown ? 'blown' : ''} flame-2`} />
                <div className="candle-stick" />
              </div>
              {/* Candle 3 */}
              <div className="candle-container">
                <div className={`candle-flame ${isBlown ? 'blown' : ''} flame-3`} />
                <div className="candle-stick" />
              </div>
            </div>

            {/* Rising smoke bubbles */}
            <div className="smoke-container">
              <div className="smoke-bubble s-1" />
              <div className="smoke-bubble s-2" />
              <div className="smoke-bubble s-3" />
            </div>

            <div className="cake-top-frosting" />
            <div className="cake-layer-top">
              <div className="cake-drips" />
            </div>
            <div className="cake-layer-bottom" />
            <div className="cake-plate" />
          </div>

          {/* Blow Candles Button */}
          <div style={{ marginTop: '36px' }}>
            <button
              onClick={handleBlowCandles}
              disabled={isBlown}
              className="btn-primary"
              style={{ margin: '0 auto', textTransform: 'none', minWidth: '220px' }}
            >
              {isBlown ? 'Wishes Sent! ✨' : 'Tiup Lilin 🕯️'}
            </button>
          </div>

          {/* Hidden Wish message revealed on blow */}
          <div
            id="wish-message"
            style={{
              marginTop: '24px',
              opacity: 0,
              height: 0,
              overflow: 'hidden',
              transition: 'all 0.8s cubic-bezier(0.25, 1, 0.5, 1)'
            }}
            className={isBlown ? 'show-message' : ''}
          >
            <p className="font-cursive text-glow-gold" style={{ fontSize: '1.8rem', color: 'var(--color-gold)' }}>
              May all your wishes come true, Amelia!
            </p>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '8px', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              Double click card to relight candles ❤️
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 4: MEMORY GALLERY */}
      <section id="section-gallery" className="scroll-section">
        <div className="section-intro-text" style={{ marginBottom: '80px' }}>
          <p className="intro-badge text-glow-pink">Shared Moments</p>
          <h2 className="intro-title text-glow-gold font-cursive" style={{ fontSize: '3.0rem' }}>
            Memory Gallery
          </h2>
        </div>

        <div ref={galleryRef} style={{ display: 'flex', justifyContent: 'center', width: '100%', padding: '0 16px' }}>
          <div className="gallery-card-portal interactive-content" style={{ width: '100%', maxWidth: '480px' }}>
            <div className="portal-glow-1" />
            <div className="portal-glow-2" />
            <div className="portal-content">
              <div className="portal-icon-container">
                <span>🌌</span>
              </div>
              <h3 className="portal-title">Amelia&apos;s Memory Galaxy</h3>
              <p className="portal-desc">
                Explore an immersive 3D orbiting galaxy holding over 200 interactive photo memories mapped dynamically in WebGL space.
              </p>
            </div>
            <a
              href="https://amelia-birthday-universe.netlify.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-portal"
              onClick={() => {
                const win = window as unknown as { pauseAudioForLink?: () => void };
                if (win.pauseAudioForLink) win.pauseAudioForLink();
              }}
            >
              <span>Klik Ini ya ayang</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </section>

      {/* SECTION 5: CLOSING VIDEO */}
      <section id="section-closing" className="scroll-section">
        <div ref={videoRef} className="video-content-wrapper">
          <div className="section-intro-text">
            <p className="intro-badge text-glow-pink" style={{ fontSize: '10px' }}>
              A Final Message
            </p>
            <h2 className="font-cursive text-glow-gold" style={{ fontSize: '2.5rem', fontWeight: 700 }}>
              Captured in Time
            </h2>
          </div>

          <div className="video-container interactive-content">
            <video
              className="video-element"
              src="/video.mp4"
              loop
              muted={true}
              playsInline
              autoPlay={true}
            />
            <div className="video-overlay-hud">
              <div className="hud-top">
                <span className="hud-rec">REC ●</span>
                <span className="hud-ch">CH 01</span>
              </div>
              <div className="hud-bottom">
                <span className="hud-filename">Memory.mp4</span>
                <span className="hud-sub">To Amelia with Love</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 6: PLAYABLE MINIGAME */}
      <section id="section-game" className="scroll-section" style={{ minHeight: '120vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '80px 0' }}>
        <div ref={gameRef} style={{ width: '100%' }}>
          <div className="section-intro-text" style={{ marginBottom: '20px' }}>
            <p className="intro-badge text-glow-pink">Fun Time</p>
            <h2 className="intro-title text-glow-gold font-cursive" style={{ fontSize: '3.0rem' }}>
              Play a Game, Ayang!
            </h2>
          </div>
          
          <TetrisGame />

          <div className="footer-copyright" style={{ marginTop: '80px', textTransform: 'none' }}>
            CREATED WITH LOVE BY FIROUZ DIMAS © 2026
          </div>
        </div>
      </section>
    </div>
  );
}
