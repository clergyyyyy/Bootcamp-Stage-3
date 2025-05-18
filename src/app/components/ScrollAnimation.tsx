'use client';

import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { motion } from 'framer-motion';

interface ScrollAnimationProps {
  children: React.ReactNode;
  delay?: number;
}

const ScrollAnimation = ({ children, delay = 0 }: ScrollAnimationProps) => {
  const isVisible = useScrollAnimation();

  console.log('Scroll Animation Visibility:', isVisible);  // <-- Debug log

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, delay }}
      className="w-full"
    >
      {children}
    </motion.div>
  );
};

export default ScrollAnimation;
