import { type ReactNode } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';

// ---------------------------------------------------------------------------
// Reusable motion variants
// ---------------------------------------------------------------------------

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 30, mass: 0.8 },
  },
  exit: { opacity: 0, y: 10, transition: { duration: 0.15 } },
};

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: 'spring', stiffness: 300, damping: 30 },
  },
  exit: { opacity: 0, x: -10, transition: { duration: 0.15 } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 25 },
  },
  exit: { opacity: 0, scale: 0.97, transition: { duration: 0.15 } },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.04,
    },
  },
};

// ---------------------------------------------------------------------------
// Wrapper components
// ---------------------------------------------------------------------------

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

/**
 * Wraps page content with a fade + slide-up entrance animation.
 * Place inside <AnimatePresence> (e.g. in StudioLayout) for exit animations.
 */
export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={slideUp}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface MotionListProps {
  children: ReactNode;
  className?: string;
}

/**
 * Wraps a list of <MotionItem> children with stagger animation.
 */
export function MotionList({ children, className }: MotionListProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface MotionItemProps {
  children: ReactNode;
  className?: string;
  /** Override default slideUp variant */
  variants?: Variants;
}

/**
 * Individual list item with enter/exit animations.
 * Should be used as a direct child of <MotionList>.
 */
export function MotionItem({ children, className, variants: customVariants }: MotionItemProps) {
  return (
    <motion.div variants={customVariants || slideUp} className={className}>
      {children}
    </motion.div>
  );
}

// Re-export framer-motion primitives for convenience
export { motion, AnimatePresence };
