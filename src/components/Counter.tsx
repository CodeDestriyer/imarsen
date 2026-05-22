import { useCountUp } from '@/hooks/useCountUp';

type Props = {
  to: number;
  suffix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
};

export function Counter({ to, suffix = '', decimals = 0, duration, className }: Props) {
  const { ref, value } = useCountUp(to, duration);
  const formatted = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString();
  return <span ref={ref} className={`counter ${className ?? ''}`}>{formatted}{suffix}</span>;
}
