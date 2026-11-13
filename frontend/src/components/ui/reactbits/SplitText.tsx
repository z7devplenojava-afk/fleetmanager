import React from 'react';
import { motion } from 'framer-motion';

interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
  highlightText?: string;
  highlightClassName?: string;
}

export const SplitText: React.FC<SplitTextProps> = ({
  text,
  className = '',
  delay = 50,
  highlightText,
  highlightClassName = 'text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-rose-400 to-amber-500',
}) => {
  const words = text.split(' ');

  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: delay / 1000, delayChildren: 0.05 * i },
    }),
  };

  const child = {
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        y: {
          type: 'spring',
          damping: 18,
          stiffness: 120,
        },
        opacity: {
          duration: 0.35,
          ease: 'easeOut',
        },
        filter: {
          duration: 0.35,
          ease: 'easeOut',
        },
      },
    },
    hidden: {
      opacity: 0,
      y: 20,
      filter: 'blur(6px)',
      transition: {
        y: {
          type: 'spring',
          damping: 18,
          stiffness: 120,
        },
        opacity: {
          duration: 0.35,
          ease: 'easeOut',
        },
        filter: {
          duration: 0.35,
          ease: 'easeOut',
        },
      },
    },
  };

  return (
    <motion.span
      className={`inline-block ${className}`}
      variants={container}
      initial="hidden"
      animate="visible"
    >
      {words.map((word, index) => {
        const isHighlight =
          highlightText &&
          word.toLowerCase().includes(highlightText.toLowerCase());

        return (
          <motion.span
            variants={child}
            key={index}
            className={`inline-block mr-[0.28em] ${isHighlight ? highlightClassName : ''}`}
          >
            {word}
          </motion.span>
        );
      })}
    </motion.span>
  );
};

