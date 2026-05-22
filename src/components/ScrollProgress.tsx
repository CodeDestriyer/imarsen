import { useScrollProgress } from '@/hooks/useScrollProgress';

export function ScrollProgress() {
  const p = useScrollProgress();
  return <div className="scroll-progress" style={{ width: `${p}%` }} />;
}
