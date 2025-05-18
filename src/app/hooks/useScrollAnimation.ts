'use client';

import { useEffect, useState } from 'react';

export function useScrollAnimation() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleScroll = () => {
      const triggerPosition = window.innerHeight * 0.8;
      const scrollY = window.scrollY;
      const isElementVisible = scrollY > triggerPosition;

      console.log('Trigger Position:', triggerPosition);
      console.log('Scroll Y:', scrollY);
      console.log('Element Visibility:', isElementVisible);

      setIsVisible(isElementVisible);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return isVisible;
}
