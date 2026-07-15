'use client';

import { useState, useEffect, useRef } from 'react';
import OverlayHTML from '@/components/OverlayHTML';
import SmoothScroll from '@/components/SmoothScroll';
import { Volume2, VolumeX, Sparkles } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);
  // Track when music was paused specifically because the user navigated away via link
  const pausedForLinkRef = useRef(false);

  // Simulate loader bar progression
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress >= 100) {
          clearInterval(interval);
          return 100;
        }
        const diff = Math.random() * 15;
        return Math.min(oldProgress + diff, 100);
      });
    }, 150);

    return () => clearInterval(interval);
  }, []);

  const handleEnterExperience = () => {
    // Force scroll positions to 0 immediately to sync start trigger calculations
    const win = window as unknown as { lenis?: { scrollTo: (target: number, options?: { immediate?: boolean }) => void } };
    if (win.lenis) {
      win.lenis.scrollTo(0, { immediate: true });
    }
    window.scrollTo(0, 0);

    // Refresh layout calculations before starting animations
    ScrollTrigger.refresh();

    // Play background audio (user interaction allows autoplay now)
    if (audioRef.current) {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.log('Audio autoplay blocked: ', err);
      });
    }

    // Fade out loader screen smoothly
    if (loaderRef.current) {
      gsap.to(loaderRef.current, {
        opacity: 0,
        scale: 1.05,
        duration: 1.2,
        ease: 'power2.inOut',
        onComplete: () => {
          setIsLoaded(true);
          // Refresh trigger bounds again once layout visibility updates
          ScrollTrigger.refresh();
        }
      });
    }
  };

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.log('Playback error: ', err);
      });
    }
  };

  // Pause music when user opens the portal link, resume when they scroll back
  useEffect(() => {
    // Expose a global function for the portal button click to call
    const win = window as unknown as { pauseAudioForLink?: () => void };
    win.pauseAudioForLink = () => {
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
        setIsPlaying(false);
        pausedForLinkRef.current = true;
      }
    };

    // When tab becomes visible again (user returned), set a flag
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // User left the page — if music was playing, pause and mark it
        if (audioRef.current && !audioRef.current.paused) {
          audioRef.current.pause();
          setIsPlaying(false);
          pausedForLinkRef.current = true;
        }
      }
    };

    // When user scrolls on return, resume the music
    const handleScrollResume = () => {
      if (
        pausedForLinkRef.current &&
        audioRef.current &&
        audioRef.current.paused &&
        document.visibilityState === 'visible'
      ) {
        audioRef.current.play().then(() => {
          setIsPlaying(true);
          pausedForLinkRef.current = false;
        }).catch(() => {
          // Autoplay policy may block — silently ignore
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('scroll', handleScrollResume, { passive: true });

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('scroll', handleScrollResume);
      delete win.pauseAudioForLink;
    };
  }, []);

  return (
    <main id="main-scroll-container" style={{ position: 'relative', width: '100%', minHeight: '100vh', backgroundColor: '#03030b' }}>
      {/* Background Audio */}
      <audio
        ref={audioRef}
        src="/song.mp3"
        loop
      />

      {/* Smooth scroll engine (Lenis + GSAP) */}
      <SmoothScroll />

      {/* Scrolling HTML Overlay content with integrated star backdrops */}
      <OverlayHTML />

      {/* Floating Audio controller (Visible after load) */}
      {isLoaded && (
        <button
          onClick={toggleAudio}
          className="audio-btn"
          title={isPlaying ? 'Mute Music' : 'Play Music'}
        >
          {isPlaying ? (
            <Volume2 className="w-5 h-5" style={{ color: 'var(--color-pink)' }} />
          ) : (
            <VolumeX className="w-5 h-5" style={{ opacity: 0.6 }} />
          )}
        </button>
      )}

      {/* Premium Loader Overlay */}
      {isLoaded ? null : (
        <div ref={loaderRef} className="loader-container">
          {/* Animated Glowing Ring Loader */}
          <div className="loader-ring-wrapper">
            <div className="loader-glow" />
            <div className="loader-spin-outer" style={{ animationDuration: '1.2s' }} />
            <div className="loader-ping-inner" style={{ animationDuration: '2.5s' }} />
            <Sparkles className="w-8 h-8 loader-sparkle" />
          </div>

          <h1 className="loader-title">
            Amelia&apos;s Orbit
          </h1>
          <p className="loader-subtitle">
            {progress < 100 ? `Synchronizing universe... ${Math.floor(progress)}%` : 'Ready to Orbit'}
          </p>

          {/* Progress bar container */}
          {progress < 100 ? (
            <div className="progress-bar-container">
              <div
                className="progress-bar-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
          ) : (
            <button
              onClick={handleEnterExperience}
              className="btn-primary"
            >
              Enter Galaxy 🪐
            </button>
          )}
        </div>
      )}
    </main>
  );
}
