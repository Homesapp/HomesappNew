import { useState, useEffect } from 'react';

/**
 * Hook to detect if viewport is in mobile size (< 768px)
 * Updates reactively on window resize
 * SSR-safe: initializes as false and updates in useEffect
 */
export function useMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Set initial value
    setIsMobile(window.innerWidth < 768);

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
}
