import { type ReactNode } from 'react';
import { motion, AnimatePresence, useReducedMotion, type Variants } from 'framer-motion';

// ---------------------------------------------------------------------------
// Reduced-motion–safe variants
// When the user prefers reduced motion, animations resolve instantly with
// no transform/scale changes — only a subtle fade remains.
// ---------------------------------------------------------------------------

const instant = { duration: 0 };

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

export const fadeInReduced: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: instant },
  exit: { opacity: 0, transition: instant },
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

const staggerContainerReduced: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0, delayChildren: 0 },
  },
};

// ---------------------------------------------------------------------------
// Wrapper components — automatically respect prefers-reduced-motion
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
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={reduced ? fadeInReduced : slideUp}
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
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={reduced ? staggerContainerReduced : staggerContainer}
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
  const reduced = useReducedMotion();
  return (
    <motion.div variants={reduced ? fadeInReduced : (customVariants || slideUp)} className={className}>
      {children}
    </motion.div>
  );
}

// Re-export framer-motion primitives for convenience
export { motion, AnimatePresence, useReducedMotion };
