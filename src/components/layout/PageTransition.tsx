// src/components/layout/PageTransition.tsx
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} // Flexibilidad y suavidad con easing cúbico
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        width: '100%',
        position: 'relative',
        zIndex: 1
      }}
    >
      {children}
    </motion.div>
  );
}
