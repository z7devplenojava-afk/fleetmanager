import React from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';

interface AnimatedWrapperProps {
  children: React.ReactNode;
  className?: string;
  animation?: 'fadeIn' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'scale' | 'bounce';
  delay?: number;
  duration?: number;
  show?: boolean;
  onClick?: () => void;
  whileHover?: Variants;
  whileTap?: Variants;
}

const animations: Record<string, Variants> = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  },
  slideLeft: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  },
  slideRight: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 },
  },
  bounce: {
    initial: { opacity: 0, scale: 0.3 },
    animate: { 
      opacity: 1, 
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20
      }
    },
    exit: { opacity: 0, scale: 0.3 },
  },
};

const hoverVariants: Variants = {
  hover: { 
    scale: 1.02,
    transition: { duration: 0.2 }
  },
  tap: { 
    scale: 0.98,
    transition: { duration: 0.1 }
  },
};

const AnimatedWrapper: React.FC<AnimatedWrapperProps> = ({
  children,
  className = '',
  animation = 'fadeIn',
  delay = 0,
  duration = 0.3,
  show = true,
  onClick,
  whileHover = hoverVariants,
  whileTap,
}) => {
  const selectedAnimation = animations[animation];

  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          className={className}
          variants={selectedAnimation}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{
            duration,
            delay,
            ease: "easeInOut"
          }}
          whileHover={onClick ? "hover" : undefined}
          whileTap={whileTap || (onClick ? "tap" : undefined)}
          onClick={onClick}
          layout
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AnimatedWrapper; 