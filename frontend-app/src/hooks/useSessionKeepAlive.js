import { useEffect, useRef } from 'react';
import { fetchCurrentUser } from '../services/api';

export function useSessionKeepAlive(intervalMs = 30000) {
  const intervalRef = useRef(null);

  useEffect(() => {
    const keepAlive = async () => {
      try {
        await fetchCurrentUser();
        console.log('✅ Keep-alive ping exitoso:', new Date().toLocaleTimeString());
      } catch (err) {
        console.log('❌ Keep-alive ping falló:', err.message);
      }
    };

    // Iniciar ping periódico
    intervalRef.current = setInterval(keepAlive, intervalMs);

    // Pausar cuando la pestaña no está visible (ahorra recursos)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else {
        if (!intervalRef.current) {
          intervalRef.current = setInterval(keepAlive, intervalMs);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [intervalMs]);
}
