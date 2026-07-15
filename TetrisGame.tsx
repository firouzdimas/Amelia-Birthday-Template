'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Volume2, VolumeX, Play, Pause, RotateCcw, ArrowLeft, ArrowRight, ArrowDown, ArrowUp, Zap, Heart } from 'lucide-react';
import { gsap } from 'gsap';

// Tetris Game constants
const COLS = 10;
const ROWS = 20;

const SHAPES = {
  I: [[1, 1, 1, 1]],
  O: [[1, 1], [1, 1]],
  T: [[0, 1, 0], [1, 1, 1]],
  S: [[0, 1, 1], [1, 1, 0]],
  Z: [[1, 1, 0], [0, 1, 1]],
  J: [[1, 0, 0], [1, 1, 1]],
  L: [[0, 0, 1], [1, 1, 1]]
};

const COLORS = {
  I: '#00f5d4', // Teal
  O: '#ffd700', // Gold
  T: '#9d4edd', // Purple
  S: '#10b981', // Green
  Z: '#ef4444', // Red
  J: '#3b82f6', // Blue
  L: '#f97316'  // Orange
};

type ShapeKey = keyof typeof SHAPES;

const createEmptyBoard = () => Array.from({ length: ROWS }, () => Array(COLS).fill(0));

export default function TetrisGame() {
  const [board, setBoard] = useState<(string | 0)[][]>(createEmptyBoard());
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [showLoveMessage, setShowLoveMessage] = useState(false);
  const [customMsg, setCustomMsg] = useState('');

  // Active piece and Next piece states
  const [activePiece, setActivePiece] = useState({
    shape: SHAPES.I as number[][],
    color: COLORS.I,
    x: 3,
    y: 0,
    type: 'I' as ShapeKey
  });

  const [nextPiece, setNextPiece] = useState<{
    shape: number[][];
    color: string;
    type: ShapeKey;
  }>({
    shape: SHAPES.O,
    color: COLORS.O,
    type: 'O'
  });

  // Audio state
  const [isSoundOn, setIsSoundOn] = useState(true);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Web Audio synth for retro game sounds
  const playSound = useCallback((type: 'move' | 'rotate' | 'clear' | 'gameover' | 'start') => {
    if (!isSoundOn) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'move') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      } else if (type === 'rotate') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(450, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } else if (type === 'clear') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16); // G5
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else if (type === 'start') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(261.63, ctx.currentTime); // C4
        osc.frequency.setValueAtTime(329.63, ctx.currentTime + 0.1); // E4
        osc.frequency.setValueAtTime(392.00, ctx.currentTime + 0.2); // G4
        osc.frequency.setValueAtTime(523.25, ctx.currentTime + 0.3); // C5
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
        osc.start();
        osc.stop(ctx.currentTime + 0.45);
      } else if (type === 'gameover') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      }
    } catch (e) {
      console.log('Web Audio failed to initialize', e);
    }
  }, [isSoundOn]);

  // Generate random piece
  const generateRandomPiece = useCallback(() => {
    const keys = Object.keys(SHAPES) as ShapeKey[];
    const randKey = keys[Math.floor(Math.random() * keys.length)];
    return {
      shape: SHAPES[randKey],
      color: COLORS[randKey],
      type: randKey
    };
  }, []);

  // Collision detection utility
  const checkCollision = useCallback((pieceX: number, pieceY: number, shape: number[][], currentBoard: (string | 0)[][]) => {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] !== 0) {
          const nextX = pieceX + c;
          const nextY = pieceY + r;

          if (nextX < 0 || nextX >= COLS || nextY >= ROWS) {
            return true;
          }
          if (nextY >= 0 && currentBoard[nextY][nextX] !== 0) {
            return true;
          }
        }
      }
    }
    return false;
  }, []);

  // Merge block shape into board layout
  const mergeToBoard = useCallback((piece: typeof activePiece, currentBoard: (string | 0)[][]) => {
    const updated = currentBoard.map(row => [...row]);
    for (let r = 0; r < piece.shape.length; r++) {
      for (let c = 0; c < piece.shape[r].length; c++) {
        if (piece.shape[r][c] !== 0) {
          const targetY = piece.y + r;
          const targetX = piece.x + c;
          if (targetY >= 0 && targetY < ROWS && targetX >= 0 && targetX < COLS) {
            updated[targetY][targetX] = piece.color;
          }
        }
      }
    }
    return updated;
  }, []);

  const triggerLoveAlert = useCallback(() => {
    setCustomMsg("Hadiahnya, minta orang kesayangan ayangg yahh 🎁");
    setShowLoveMessage(true);
    
    // Heart expansion effect using GSAP
    gsap.fromTo('.love-heart-pop', 
      { scale: 0.2, opacity: 0, rotate: -20 },
      { scale: 1, opacity: 1, rotate: 0, duration: 0.6, ease: 'back.out(1.7)' }
    );

    setTimeout(() => {
      gsap.to('.love-heart-pop', {
        scale: 0,
        opacity: 0,
        duration: 0.4,
        onComplete: () => setShowLoveMessage(false)
      });
    }, 2800);
  }, []);

  // Check and process full lines
  const processLineClears = useCallback((nextBoard: (string | 0)[][]) => {
    // Find completely filled rows
    const cleared = nextBoard.filter(row => row.some(cell => cell === 0));
    const clearedCount = ROWS - cleared.length;

    let updatedBoard = nextBoard;

    if (clearedCount > 0) {
      // Add empty rows on top
      const emptyRows = Array.from({ length: clearedCount }, () => Array(COLS).fill(0));
      updatedBoard = [...emptyRows, ...cleared];

      setBoard(updatedBoard);
      setLines(prev => {
        const nextLines = prev + clearedCount;
        // Raise level every 10 lines
        const calculatedLevel = Math.floor(nextLines / 10) + 1;
        setLevel(calculatedLevel);
        return nextLines;
      });

      // Classic Tetris scoring system
      const points = [0, 100, 300, 500, 800];
      setScore(prev => prev + (points[clearedCount] || 800) * level);
      
      playSound('clear');
      triggerLoveAlert();
    } else {
      setBoard(nextBoard);
    }

    // Load next piece
    const nextSpawn = generateRandomPiece();
    const newActivePiece = {
      shape: nextPiece.shape,
      color: nextPiece.color,
      x: Math.floor((COLS - nextPiece.shape[0].length) / 2),
      y: 0,
      type: nextPiece.type
    };

    setActivePiece(newActivePiece);
    setNextPiece(nextSpawn);

    // Game Over condition
    if (checkCollision(newActivePiece.x, newActivePiece.y, newActivePiece.shape, updatedBoard)) {
      setGameOver(true);
      setIsPlaying(false);
      playSound('gameover');
    }
  }, [level, playSound, generateRandomPiece, checkCollision, nextPiece, triggerLoveAlert]);

  // Move active piece
  const movePiece = useCallback((dirX: number, dirY: number) => {
    if (!isPlaying || isPaused || gameOver) return false;

    let moved = false;
    setActivePiece(prev => {
      if (!checkCollision(prev.x + dirX, prev.y + dirY, prev.shape, board)) {
        moved = true;
        return {
          ...prev,
          x: prev.x + dirX,
          y: prev.y + dirY
        };
      }
      return prev;
    });

    if (moved && dirX !== 0) playSound('move');
    return moved;
  }, [isPlaying, isPaused, gameOver, checkCollision, board, playSound]);

  // Rotate shape matrix
  const rotatePiece = useCallback(() => {
    if (!isPlaying || isPaused || gameOver) return;

    setActivePiece(prev => {
      const n = prev.shape.length;
      const m = prev.shape[0].length;
      const rotated = Array.from({ length: m }, () => Array(n).fill(0));

      for (let r = 0; r < n; r++) {
        for (let c = 0; c < m; c++) {
          rotated[c][n - 1 - r] = prev.shape[r][c];
        }
      }

      // Wall kick simulation
      let kickX = 0;
      if (prev.x + rotated[0].length > COLS) {
        kickX = COLS - (prev.x + rotated[0].length);
      }

      if (!checkCollision(prev.x + kickX, prev.y, rotated, board)) {
        playSound('rotate');
        return {
          ...prev,
          shape: rotated,
          x: prev.x + kickX
        };
      }
      return prev;
    });
  }, [isPlaying, isPaused, gameOver, checkCollision, board, playSound]);

  // Instant drop down
  const hardDrop = useCallback(() => {
    if (!isPlaying || isPaused || gameOver) return;

    setActivePiece(prev => {
      let dropDist = 0;
      while (!checkCollision(prev.x, prev.y + dropDist + 1, prev.shape, board)) {
        dropDist++;
      }
      const finalPiece = {
        ...prev,
        y: prev.y + dropDist
      };
      
      const nextBoard = mergeToBoard(finalPiece, board);
      // Run on next tick/effect or defer
      setTimeout(() => {
        processLineClears(nextBoard);
      }, 0);

      return finalPiece;
    });
  }, [isPlaying, isPaused, gameOver, checkCollision, board, mergeToBoard, processLineClears]);

  // Init/Restart game handler
  const initGame = useCallback(() => {
    setBoard(createEmptyBoard());
    setScore(0);
    setLines(0);
    setLevel(1);
    setGameOver(false);
    setIsPaused(false);
    setShowLoveMessage(false);

    // Initial pieces setup
    const first = generateRandomPiece();
    const second = generateRandomPiece();

    setActivePiece({
      shape: first.shape,
      color: first.color,
      x: 3,
      y: 0,
      type: first.type
    });

    setNextPiece({
      shape: second.shape,
      color: second.color,
      type: second.type
    });

    setIsPlaying(true);
    playSound('start');
  }, [generateRandomPiece, playSound]);

  // Core Game Loop ticks
  useEffect(() => {
    if (!isPlaying || isPaused || gameOver) return;

    // Calculate game tick delay based on current level
    const speed = Math.max(800 - (level - 1) * 90, 120);

    const interval = setInterval(() => {
      setActivePiece(prev => {
        if (!checkCollision(prev.x, prev.y + 1, prev.shape, board)) {
          return {
            ...prev,
            y: prev.y + 1
          };
        } else {
          // Merge and process line clears
          const nextBoard = mergeToBoard(prev, board);
          setTimeout(() => {
            processLineClears(nextBoard);
          }, 0);
          return prev;
        }
      });
    }, speed);

    return () => clearInterval(interval);
  }, [isPlaying, isPaused, gameOver, level, board, checkCollision, mergeToBoard, processLineClears]);

  // Keyboard Event Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying || isPaused || gameOver) return;

      switch (e.key) {
        case 'ArrowLeft':
          movePiece(-1, 0);
          e.preventDefault();
          break;
        case 'ArrowRight':
          movePiece(1, 0);
          e.preventDefault();
          break;
        case 'ArrowDown':
          movePiece(0, 1);
          e.preventDefault();
          break;
        case 'ArrowUp':
          rotatePiece();
          e.preventDefault();
          break;
        case ' ':
          hardDrop();
          e.preventDefault();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isPaused, gameOver, movePiece, rotatePiece, hardDrop]);

  // Render combined view of board and active piece
  const displayBoard = useMemo(() => {
    const currentView = board.map(row => [...row]);
    if (isPlaying && !isPaused && !gameOver) {
      for (let r = 0; r < activePiece.shape.length; r++) {
        for (let c = 0; c < activePiece.shape[r].length; c++) {
          if (activePiece.shape[r][c] !== 0) {
            const displayY = activePiece.y + r;
            const displayX = activePiece.x + c;
            if (displayY >= 0 && displayY < ROWS && displayX >= 0 && displayX < COLS) {
              currentView[displayY][displayX] = activePiece.color;
            }
          }
        }
      }
    }
    return currentView;
  }, [board, isPlaying, isPaused, gameOver, activePiece]);

  return (
    <div className="glass-card glass-glow-pink" style={{ maxWidth: '640px', padding: '32px 20px', margin: '40px auto 0 auto', position: 'relative' }}>
      
      {/* Love alert pop-up when lines are cleared */}
      {showLoveMessage && (
        <div className="love-heart-pop" style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 50,
          background: 'rgba(236, 72, 153, 0.95)',
          padding: '16px 24px',
          borderRadius: '16px',
          boxShadow: '0 0 25px rgba(236,72,153,0.7)',
          textAlign: 'center',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.2)',
          color: '#fff',
          fontWeight: 600,
          pointerEvents: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          width: '280px'
        }}>
          <Heart className="w-8 h-8 text-white fill-white" style={{ animation: 'pulse 1.2s infinite' }} />
          <p style={{ fontSize: '13px', margin: 0, lineHeight: 1.4 }}>{customMsg}</p>
        </div>
      )}

      {/* Header controls & Volume */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 className="font-cursive text-glow-gold" style={{ fontSize: '1.8rem', color: 'var(--color-gold)', margin: 0 }}>
          Ayang&apos;s Tetris Space 🛸
        </h3>
        <button 
          onClick={() => setIsSoundOn(!isSoundOn)} 
          className="audio-btn" 
          style={{ position: 'relative', top: 'auto', right: 'auto', opacity: 0.8 }}
          title={isSoundOn ? 'Mute Sounds' : 'Unmute Sounds'}
        >
          {isSoundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>

      <div className="tetris-game-grid-layout" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '20px' }}>
        
        {/* The Game Board */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="tetris-board-frame" style={{
            background: 'rgba(15, 10, 36, 0.65)',
            border: '2px solid rgba(236, 72, 153, 0.4)',
            borderRadius: '12px',
            padding: '4px',
            boxShadow: '0 0 20px rgba(236,72,153,0.15)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            
            {/* Grid Cells */}
            <div style={{
              display: 'grid',
              gridTemplateRows: `repeat(${ROWS}, 20px)`,
              gridTemplateColumns: `repeat(${COLS}, 20px)`,
              gap: '1px',
              background: 'rgba(255,255,255,0.02)'
            }}>
              {displayBoard.map((row, r) => 
                row.map((cell, c) => (
                  <div
                    key={`${r}-${c}`}
                    style={{
                      width: '20px',
                      height: '20px',
                      backgroundColor: cell !== 0 ? cell : 'transparent',
                      border: cell !== 0 ? '1px solid rgba(255,255,255,0.3)' : '1px solid rgba(255,255,255,0.03)',
                      borderRadius: cell !== 0 ? '4px' : '0px',
                      boxShadow: cell !== 0 ? `inset 0 0 6px rgba(255,255,255,0.4), 0 0 8px ${cell}` : 'none',
                      transition: 'background-color 0.1s ease'
                    }}
                  />
                ))
              )}
            </div>

            {/* Overlay (Game Over, Start screen, Pause screen) */}
            {!isPlaying && !gameOver && (
              <div className="tetris-overlay" style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                background: 'rgba(10, 5, 28, 0.85)', display: 'flex', flexDirection: 'column',
                justifyContent: 'center', alignItems: 'center', gap: '16px', borderRadius: '8px'
              }}>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', textAlign: 'center', padding: '0 20px' }}>
                  Clear the lines to unlock sweet love messages! 💖
                </p>
                <button onClick={initGame} className="btn-primary" style={{ minWidth: '130px', padding: '10px 16px' }}>
                  <Play className="w-4 h-4 mr-2" /> Start Game
                </button>
              </div>
            )}

            {isPaused && isPlaying && (
              <div className="tetris-overlay" style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                background: 'rgba(10, 5, 28, 0.8)', display: 'flex', flexDirection: 'column',
                justifyContent: 'center', alignItems: 'center', gap: '12px'
              }}>
                <h4 style={{ color: '#fff', fontSize: '1.2rem', letterSpacing: '0.1em', fontWeight: 600 }}>GAME PAUSED</h4>
                <button onClick={() => setIsPaused(false)} className="btn-primary" style={{ minWidth: '120px' }}>
                  Resume
                </button>
              </div>
            )}

            {gameOver && (
              <div className="tetris-overlay" style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                background: 'rgba(15, 5, 28, 0.9)', display: 'flex', flexDirection: 'column',
                justifyContent: 'center', alignItems: 'center', gap: '16px'
              }}>
                 <h4 className="text-glow-pink" style={{ color: 'var(--color-pink)', fontSize: '1.5rem', fontWeight: 700 }}>GAME OVER</h4>
                 <div style={{ textAlign: 'center', padding: '0 16px' }}>
                   <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Final Score</p>
                   <p className="text-glow-gold font-cursive" style={{ color: 'var(--color-gold)', fontSize: '2rem', margin: '0 0 12px 0' }}>{score}</p>
                   <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '12px', lineHeight: 1.4, margin: 0 }}>
                     Walaupun kamu gagal, tapi kamu tetap jadi pemenang di hatiku. ❤️
                   </p>
                 </div>
                 <button onClick={initGame} className="btn-primary" style={{ minWidth: '130px', marginTop: '4px' }}>
                   <RotateCcw className="w-4 h-4 mr-2" /> Play Again
                 </button>
              </div>
            )}

          </div>
        </div>

        {/* Sidebar Info Panels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: '110px' }}>
          
          {/* Next Piece Preview */}
          <div className="sidebar-hud-box" style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '12px',
            textAlign: 'center'
          }}>
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', display: 'block', marginBottom: '8px' }}>NEXT</span>
            <div style={{
              display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50px'
            }}>
              {isPlaying && !gameOver ? (
                <div style={{
                  display: 'grid',
                  gridTemplateRows: `repeat(${nextPiece.shape.length}, 10px)`,
                  gridTemplateColumns: `repeat(${nextPiece.shape[0].length}, 10px)`,
                  gap: '1px'
                }}>
                  {nextPiece.shape.map((row, r) => 
                    row.map((cell, c) => (
                      <div
                        key={`next-${r}-${c}`}
                        style={{
                          width: '10px',
                          height: '10px',
                          backgroundColor: cell !== 0 ? nextPiece.color : 'transparent',
                          borderRadius: cell !== 0 ? '2px' : '0px',
                          boxShadow: cell !== 0 ? `0 0 5px ${nextPiece.color}` : 'none'
                        }}
                      />
                    ))
                  )}
                </div>
              ) : (
                <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '12px' }}>—</span>
              )}
            </div>
          </div>

          {/* Scores, Level, Lines */}
          <div className="sidebar-hud-box" style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div>
              <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', display: 'block' }}>SCORE</span>
              <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-pink)' }}>{score}</span>
            </div>
            <div>
              <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', display: 'block' }}>LEVEL</span>
              <span style={{ fontSize: '1rem', fontWeight: 600, color: '#fff' }}>{level}</span>
            </div>
            <div>
              <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', display: 'block' }}>LINES</span>
              <span style={{ fontSize: '1rem', fontWeight: 600, color: '#fff' }}>{lines}</span>
            </div>
          </div>

          {/* Menu Action buttons */}
          {isPlaying && (
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="btn-portal"
              style={{ padding: '8px 12px', fontSize: '11px', display: 'flex', gap: '6px', justifyContent: 'center' }}
            >
              {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              <span>{isPaused ? 'Resume' : 'Pause'}</span>
            </button>
          )}

        </div>
      </div>

      {/* On-screen gamepad controls for mobile layout */}
      <div className="mobile-gamepad" style={{
        marginTop: '24px',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '8px',
        maxWidth: '280px',
        margin: '24px auto 0 auto'
      }}>
        <div />
        <button 
          onClick={rotatePiece} 
          className="btn-portal" 
          style={{ padding: '12px', display: 'flex', justifyContent: 'center' }}
          title="Rotate Piece"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
        <div />

        <button 
          onClick={() => movePiece(-1, 0)} 
          className="btn-portal" 
          style={{ padding: '12px', display: 'flex', justifyContent: 'center' }}
          title="Move Left"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <button 
          onClick={hardDrop} 
          className="btn-portal" 
          style={{ padding: '12px', display: 'flex', justifyContent: 'center', backgroundColor: 'rgba(236,72,153,0.15)', borderColor: 'var(--color-pink)' }}
          title="Instant Drop"
        >
          <Zap className="w-4 h-4" style={{ color: 'var(--color-pink)' }} />
        </button>
        <button 
          onClick={() => movePiece(1, 0)} 
          className="btn-portal" 
          style={{ padding: '12px', display: 'flex', justifyContent: 'center' }}
          title="Move Right"
        >
          <ArrowRight className="w-4 h-4" />
        </button>

        <div />
        <button 
          onClick={() => movePiece(0, 1)} 
          className="btn-portal" 
          style={{ padding: '12px', display: 'flex', justifyContent: 'center' }}
          title="Soft Drop"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
        <div />
      </div>

      <div style={{ textAlign: 'center', marginTop: '16px', opacity: 0.4, fontSize: '10px', letterSpacing: '0.05em' }}>
        KEYBOARD: ARROWS TO MOVE/ROTATE • SPACE TO DROP
      </div>

    </div>
  );
}
