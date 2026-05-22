import { motion, type Variants } from 'framer-motion';
import type { ReactNode } from 'react';

type Variant = 'up' | 'blur' | 'clip' | 'fade';

const variants: Record<Variant, Variants> = {
  up: {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0 },
  },
  blur: {
    hidden: { opacity: 0, filter: 'blur(12px)' },
    show: { opacity: 1, filter: 'blur(0px)' },
  },
  clip: {
    hidden: { opacity: 0, clipPath: 'inset(0 0 100% 0)' },
    show: { opacity: 1, clipPath: 'inset(0 0 0% 0)' },
  },
  fade: {
    hidden: { opacity: 0 },
    show: { opacity: 1 },
  },
};

type Props = {
  children: ReactNode;
  delay?: number;
  className?: string;
  variant?: Variant;
};

export function Reveal({ children, delay = 0, className, variant = 'up' }: Props) {
  return (
    <motion.div
      className={className}
      variants={variants[variant]}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '0px 0px -40px 0px' }}
      transition={{ duration: 0.65, delay, ease: [0.2, 0.7, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}
