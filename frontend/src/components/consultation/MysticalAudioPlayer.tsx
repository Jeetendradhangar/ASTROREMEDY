'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Volume1, RotateCcw } from 'lucide-react';

interface MysticalAudioPlayerProps {
  src: string;
  className?: string;
}

export default function MysticalAudioPlayer({ src, className = '' }: MysticalAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  // Track hovered index on the waveform for visual seek feedback
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Predefined beautiful, symmetrical wave height pattern (30 bars)
  const waveHeights = [
    12, 18, 14, 24, 28, 20, 36, 42, 30, 48, 
    54, 38, 44, 28, 22, 26, 32, 20, 34, 46, 
    52, 36, 40, 24, 32, 22, 14, 18, 10, 12
  ];

  useEffect(() => {
    // Reset states when source changes
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setIsLoaded(false);
    setHasError(false);

    const audio = audioRef.current;
    if (!audio) return;

    // Load new source
    audio.load();
    audio.playbackRate = playbackSpeed;
    audio.volume = isMuted ? 0 : volume;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const onLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      setIsLoaded(true);
      setHasError(false);
    };

    const onCanPlay = () => {
      setIsLoaded(true);
    };

    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const onError = () => {
      setHasError(true);
      setIsLoaded(false);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };
  }, [src]);

  // Sync playback speed changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Sync volume / mute changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const togglePlay = () => {
    if (hasError || !audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => {
          console.error("Audio playback error:", err);
          setIsPlaying(false);
        });
    }
  };

  const handleSeek = (seconds: number) => {
    if (!audioRef.current || isNaN(seconds) || duration === 0) return;
    audioRef.current.currentTime = seconds;
    setCurrentTime(seconds);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleSeek(parseFloat(e.target.value));
  };

  const handleWaveformClick = (index: number) => {
    if (duration === 0) return;
    const clickRatio = index / waveHeights.length;
    handleSeek(clickRatio * duration);
  };

  const cycleSpeed = () => {
    const speeds = [1, 1.25, 1.5, 2];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    setPlaybackSpeed(nextSpeed);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (val > 0) {
      setIsMuted(false);
    }
  };

  const resetPlayback = () => {
    handleSeek(0);
  };

  const formatAudioTime = (seconds: number) => {
    if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Color constants for reliable rendering
  const colors = {
    gold: '#c9a84c',
    goldLight: 'rgba(201, 168, 76, 0.25)',
    goldGlow: 'rgba(201, 168, 76, 0.35)',
    textPrimary: '#f0ead6',      // warm cream – high contrast on dark
    textSecondary: 'rgba(240, 234, 214, 0.55)',
    barInactive: 'rgba(74, 63, 107, 0.5)',  // muted mystic purple
    barHover: 'rgba(201, 168, 76, 0.8)',
    surface: '#1a1a2e',
    surfaceLight: 'rgba(74, 63, 107, 0.25)',
    danger: '#e05252',
  };

  // Neumorphism shadow presets for dark surfaces
  const nm = {
    raised: '6px 6px 14px rgba(5, 5, 15, 0.7), -4px -4px 10px rgba(50, 50, 80, 0.2)',
    raisedHover: '8px 8px 18px rgba(5, 5, 15, 0.8), -5px -5px 12px rgba(50, 50, 80, 0.25)',
    inset: 'inset 4px 4px 10px rgba(5, 5, 15, 0.6), inset -3px -3px 8px rgba(50, 50, 80, 0.15)',
    btnRaised: '3px 3px 8px rgba(5, 5, 15, 0.6), -2px -2px 6px rgba(50, 50, 80, 0.15)',
    btnPressed: 'inset 2px 2px 6px rgba(5, 5, 15, 0.5), inset -2px -2px 4px rgba(50, 50, 80, 0.1)',
    playRaised: '4px 4px 12px rgba(5, 5, 15, 0.7), -3px -3px 8px rgba(201, 168, 76, 0.15)',
    playPressed: 'inset 3px 3px 8px rgba(100, 75, 20, 0.4), inset -2px -2px 6px rgba(220, 200, 120, 0.2)',
  };

  return (
    <div 
      ref={containerRef}
      className={`relative flex flex-col w-full overflow-hidden ${className}`}
      style={{
        background: `linear-gradient(145deg, #1e1e34, #161628)`,
        border: `1px solid rgba(201, 168, 76, 0.12)`,
        borderRadius: '20px',
        padding: '22px',
        transition: 'all 0.3s ease',
        boxShadow: nm.raised,
      }}
    >
      {/* Top accent bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: `linear-gradient(90deg, transparent, ${colors.gold}, transparent)`,
          opacity: isPlaying ? 1 : 0.5,
          transition: 'opacity 0.5s ease',
        }}
      />

      <audio ref={audioRef} src={src} preload="metadata" className="hidden" />

      {hasError ? (
        <div 
          className="flex items-center justify-center p-3 gap-2"
          style={{
            fontSize: '13px',
            fontFamily: "'EB Garamond', serif",
            color: colors.danger,
          }}
        >
          <span 
            className="animate-ping"
            style={{
              height: '6px',
              width: '6px',
              borderRadius: '50%',
              backgroundColor: colors.danger,
              display: 'inline-block',
            }}
          />
          Failed to load audio source. Please verify it is uploaded correctly.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {/* Main Controls Row */}
          <div className="flex items-center justify-between gap-4">
            
            {/* Play Button & Reset */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={togglePlay}
                disabled={!isLoaded}
                style={{
                  height: '46px',
                  width: '46px',
                  flexShrink: 0,
                  borderRadius: '50%',
                  background: isPlaying
                    ? `linear-gradient(145deg, #a07c2c, ${colors.gold})`
                    : `linear-gradient(145deg, ${colors.gold}, #a07c2c)`,
                  color: '#111122',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(201, 168, 76, 0.3)',
                  cursor: isLoaded ? 'pointer' : 'not-allowed',
                  opacity: isLoaded ? 1 : 0.5,
                  transition: 'all 0.2s ease',
                  boxShadow: isPlaying
                    ? `${nm.playPressed}, 0 0 20px ${colors.goldGlow}`
                    : nm.playRaised,
                }}
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause style={{ height: '18px', width: '18px', fill: '#111122', color: '#111122' }} />
                ) : (
                  <Play style={{ height: '18px', width: '18px', fill: '#111122', color: '#111122', marginLeft: '2px' }} />
                )}
              </button>

              <button
                type="button"
                onClick={resetPlayback}
                disabled={!isLoaded || currentTime === 0}
                style={{
                  height: '32px',
                  width: '32px',
                  borderRadius: '50%',
                  border: '1px solid rgba(50, 50, 80, 0.3)',
                  background: 'linear-gradient(145deg, #1e1e34, #161628)',
                  color: colors.textPrimary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isLoaded && currentTime !== 0 ? 'pointer' : 'not-allowed',
                  opacity: isLoaded && currentTime !== 0 ? 0.8 : 0.3,
                  transition: 'all 0.2s ease',
                  boxShadow: nm.btnRaised,
                }}
                title="Restart"
              >
                <RotateCcw style={{ height: '14px', width: '14px' }} />
              </button>
            </div>

            {/* Waveform Visualization (Interactive) */}
            <div 
              className="flex-1 flex items-end justify-center gap-0.5 relative select-none"
              style={{
                height: '52px',
                padding: '6px 12px',
                borderRadius: '12px',
                background: 'linear-gradient(145deg, #141426, #1c1c32)',
                boxShadow: nm.inset,
              }}
            >
              {waveHeights.map((maxHeight, index) => {
                const barRatio = index / waveHeights.length;
                const isPassed = currentTime / (duration || 1) >= barRatio;
                const isHovered = hoveredIndex !== null && index <= hoveredIndex;
                
                let barColor = colors.barInactive;
                if (isHovered) {
                  barColor = colors.barHover;
                } else if (isPassed) {
                  barColor = colors.gold;
                }

                // Dynamic height bounce if playing
                const animationFactor = isPlaying ? Math.abs(Math.sin(currentTime * 4 + index * 0.4)) * 0.4 + 0.6 : 0.85;
                const currentHeight = Math.max(4, maxHeight * animationFactor);
                const isPulse = !isLoaded && !hasError;

                return (
                  <div
                    key={index}
                    onClick={() => handleWaveformClick(index)}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className={isPulse ? 'animate-pulse' : ''}
                    style={{
                      width: '6px',
                      borderRadius: '9999px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      height: `${currentHeight}px`,
                      backgroundColor: barColor,
                      boxShadow: isPassed && isPlaying ? `0 0 6px ${colors.goldGlow}` : 'none',
                    }}
                    title={`Seek to ${Math.round(barRatio * 100)}%`}
                  />
                );
              })}
            </div>

            {/* Auxiliary Controls (Speed + Volume) */}
            <div className="flex items-center gap-3" style={{ flexShrink: 0 }}>
              
              {/* Playback Speed Toggle */}
              <button
                type="button"
                onClick={cycleSpeed}
                disabled={!isLoaded}
                style={{
                  padding: '5px 12px',
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  minWidth: '42px',
                  textAlign: 'center' as const,
                  color: colors.gold,
                  background: 'linear-gradient(145deg, #1e1e34, #161628)',
                  border: '1px solid rgba(50, 50, 80, 0.25)',
                  borderRadius: '9999px',
                  cursor: isLoaded ? 'pointer' : 'not-allowed',
                  opacity: isLoaded ? 1 : 0.4,
                  transition: 'all 0.2s ease',
                  boxShadow: nm.btnRaised,
                }}
                title="Playback Speed"
              >
                {playbackSpeed.toFixed(2).replace('.00', '')}x
              </button>

              {/* Volume Slider Combo */}
              <div className="flex items-center gap-1 group/volume relative">
                <button
                  type="button"
                  onClick={toggleMute}
                  style={{
                    height: '32px',
                    width: '32px',
                    borderRadius: '50%',
                    border: '1px solid rgba(50, 50, 80, 0.3)',
                    background: 'linear-gradient(145deg, #1e1e34, #161628)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: nm.btnRaised,
                  }}
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX style={{ height: '16px', width: '16px', color: colors.danger }} />
                  ) : volume < 0.5 ? (
                    <Volume1 style={{ height: '16px', width: '16px', color: colors.gold }} />
                  ) : (
                    <Volume2 style={{ height: '16px', width: '16px', color: colors.gold }} />
                  )}
                </button>

                {/* Slider reveals on hover/focus */}
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-0 overflow-hidden opacity-0 group-hover/volume:w-16 group-hover/volume:opacity-100 focus:w-16 focus:opacity-100 transition-all duration-300"
                  style={{
                    height: '4px',
                    borderRadius: '9999px',
                    appearance: 'none' as const,
                    cursor: 'pointer',
                    accentColor: colors.gold,
                    background: `linear-gradient(to right, ${colors.gold} ${(isMuted ? 0 : volume) * 100}%, ${colors.barInactive} ${(isMuted ? 0 : volume) * 100}%)`,
                  }}
                  title="Volume"
                />
              </div>

            </div>

          </div>

          {/* Time Progress Slider & Labels Row */}
          <div className="flex items-center gap-3 w-full">
            <span 
              className="w-8 text-right select-none"
              style={{
                fontFamily: "'EB Garamond', serif",
                fontSize: '11px',
                color: colors.textSecondary,
              }}
            >
              {formatAudioTime(currentTime)}
            </span>
            <div 
              className="flex-1 relative flex items-center"
              style={{
                borderRadius: '9999px',
                padding: '4px 6px',
                background: 'linear-gradient(145deg, #141426, #1c1c32)',
                boxShadow: 'inset 2px 2px 6px rgba(5, 5, 15, 0.5), inset -2px -2px 4px rgba(50, 50, 80, 0.1)',
              }}
            >
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSliderChange}
                disabled={!isLoaded}
                className="w-full"
                style={{
                  height: '4px',
                  borderRadius: '9999px',
                  appearance: 'none' as const,
                  cursor: isLoaded ? 'pointer' : 'default',
                  opacity: isLoaded ? 1 : 0.5,
                  accentColor: colors.gold,
                  background: `linear-gradient(to right, ${colors.gold} ${progressPercent}%, rgba(74, 63, 107, 0.35) ${progressPercent}%)`,
                }}
              />
            </div>
            <span 
              className="w-8 text-left select-none"
              style={{
                fontFamily: "'EB Garamond', serif",
                fontSize: '11px',
                color: colors.textSecondary,
              }}
            >
              {formatAudioTime(duration)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
