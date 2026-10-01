import { useEffect, useRef } from 'react';
import Hls from 'hls.js';

// URL streaming configurabile via variabile d'ambiente (.env)
const STREAM_URL = (import.meta.env.VITE_STREAM_URL as string) || "https://load-balancer.azotosolutions.com/cdnedge40/telecupole/playlist.m3u8";

export default function App() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const watchdogIntervalRef = useRef<any>(null);
  const lastTimeRef = useRef<number>(-1);
  const stallCounterRef = useRef<number>(0);
  const retryCountRef = useRef<number>(0);
  const isRecoveringRef = useRef<boolean>(false);

  // Forza la riproduzione continua (anti-pausa)
  const enforcePlay = () => {
    const video = videoRef.current;
    if (!video || document.hidden) return;

    video.muted = false;
    const playPromise = video.play();

    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Fallback per browser con policy audio restrittive
        video.muted = true;
        video.play().then(() => {
          setTimeout(() => {
            video.muted = false;
          }, 300);
        }).catch(() => {});
      });
    }
  };

  // Rilascio completo risorse e decoder hardware
  const cleanupHls = () => {
    if (hlsRef.current) {
      try {
        hlsRef.current.detachMedia();
        hlsRef.current.destroy();
      } catch {}
      hlsRef.current = null;
    }
    const video = videoRef.current;
    if (video) {
      try {
        video.removeAttribute('src');
        video.load();
      } catch {}
    }
  };

  const scheduleReconnect = (delayMs: number = 2000) => {
    if (reconnectTimeoutRef.current || document.hidden) return;
    isRecoveringRef.current = true;

    const delay = delayMs || Math.min(1000 * Math.pow(1.4, retryCountRef.current), 8000);
    retryCountRef.current++;

    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectTimeoutRef.current = null;
      startStream();
    }, delay);
  };

  const startStream = () => {
    const video = videoRef.current;
    if (!video || document.hidden) return;

    cleanupHls();
    isRecoveringRef.current = false;

    if (Hls.isSupported()) {
      const hls = new Hls({
        autoStartLoad: true,
        startPosition: -1,
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 0,           // Svuota immediatamente la memoria dei segmenti passati
        maxBufferLength: 8,            // Mantiene solo 8 secondi in memoria
        maxMaxBufferLength: 14,
        maxBufferSize: 6 * 1024 * 1024,// Limite di 6MB di buffer in RAM
        liveSyncDurationCount: 3,
        liveMaxLatencyDurationCount: 6,
        liveDurationInfinity: true,
        manifestLoadingTimeOut: 8000,
        fragLoadingTimeOut: 10000,
        fpsDroppedMonitoringPeriod: 0
      });

      hlsRef.current = hls;
      hls.loadSource(STREAM_URL);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        retryCountRef.current = 0;
        stallCounterRef.current = 0;
        enforcePlay();
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (!data || !data.fatal) return;

        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            try {
              hls.startLoad();
            } catch {
              scheduleReconnect(1500);
            }
            break;

          case Hls.ErrorTypes.MEDIA_ERROR:
            try {
              hls.recoverMediaError();
            } catch {
              scheduleReconnect(1000);
            }
            break;

          default:
            scheduleReconnect(2000);
            break;
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = STREAM_URL;
      enforcePlay();
    } else {
      scheduleReconnect(3000);
    }
  };

  const closeApp = () => {
    cleanupHls();
    if (watchdogIntervalRef.current) clearInterval(watchdogIntervalRef.current);
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);

    const win = window as any;
    if (win.webOS && typeof win.webOS.platformBack === 'function') {
      win.webOS.platformBack();
    } else if (typeof window.close === 'function') {
      window.close();
    } else {
      history.back();
    }
  };

  useEffect(() => {
    startStream();

    // Watchdog anti-freeze (ogni 2.5s)
    watchdogIntervalRef.current = setInterval(() => {
      const video = videoRef.current;
      if (!video || document.hidden || isRecoveringRef.current) return;

      if (video.paused) {
        enforcePlay();
      }

      if (video.readyState >= 2 && !video.paused) {
        if (video.currentTime === lastTimeRef.current) {
          stallCounterRef.current++;
          if (stallCounterRef.current >= 3) {
            stallCounterRef.current = 0;
            scheduleReconnect(500);
          }
        } else {
          lastTimeRef.current = video.currentTime;
          stallCounterRef.current = 0;
        }
      }
    }, 2500);

    const handleKeyDown = (e: KeyboardEvent) => {
      const keyCode = e.keyCode || e.which;

      switch (keyCode) {
        case 461: // BACK / RETURN LG webOS
        case 27:  // ESC
          e.preventDefault();
          e.stopPropagation();
          closeApp();
          return;

        case 415: // PLAY
        case 19:  // PAUSE
        case 413: // STOP
        case 10252:
          e.preventDefault();
          e.stopPropagation();
          enforcePlay();
          return;

        case 13:
        case 37:
        case 38:
        case 39:
        case 40:
        case 403:
        case 404:
        case 405:
        case 406:
        case 412:
        case 417:
          e.preventDefault();
          e.stopPropagation();
          return;

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('keydown', handleKeyDown, true);

    const handleClick = (e: MouseEvent) => {
      e.preventDefault();
      enforcePlay();
    };
    window.addEventListener('click', handleClick, true);

    const handleOnline = () => {
      retryCountRef.current = 0;
      startStream();
    };
    window.addEventListener('online', handleOnline);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        cleanupHls();
      } else {
        startStream();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const handleWebOSLaunch = () => startStream();
    const handleWebOSRelaunch = () => enforcePlay();
    window.addEventListener('webOSLaunch', handleWebOSLaunch);
    window.addEventListener('webOSRelaunch', handleWebOSRelaunch);

    return () => {
      cleanupHls();
      if (watchdogIntervalRef.current) clearInterval(watchdogIntervalRef.current);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      window.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('click', handleClick, true);
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('webOSLaunch', handleWebOSLaunch);
      window.removeEventListener('webOSRelaunch', handleWebOSRelaunch);
    };
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full bg-black overflow-hidden flex items-center justify-center select-none cursor-none">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        webkit-playsinline="true"
        className="w-full h-full object-contain bg-black pointer-events-none cursor-none"
        onPause={enforcePlay}
        onEnded={() => scheduleReconnect(800)}
        onError={() => scheduleReconnect(1500)}
      />
    </div>
  );
}
