import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, HelpCircle, Send, MessageSquare } from 'lucide-react';
import { Reveal } from '@/components/Reveal';
import { faqs } from '@/data/content';

function FaqItem({ q, a, defaultOpen }: { q: string; a: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className="glass rounded-xl border border-white/10 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between text-left px-6 py-4 text-white font-medium"
      >
        <span>{q}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }}>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.2, 0.7, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-5 text-gray-400 text-sm leading-relaxed">{a}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Faq() {
  return (
    <section id="faq" className="py-24 relative">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-4 text-xs text-gray-300 border border-white/10">
              <HelpCircle className="w-3.5 h-3.5" /> Вопросы и ответы
            </div>
            <div className="telemetry mb-3">04 — faq</div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Что спрашивают чаще всего</h2>
          </div>
        </Reveal>

        <div className="space-y-4">
          {faqs.map((f, i) => (
            <FaqItem key={f.q} q={f.q} a={f.a} defaultOpen={i === 0} />
          ))}
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Reveal>
            <a
              href="https://t.me/+OBtlpNOrmPU1MTFk"
              target="_blank"
              rel="noopener noreferrer"
              className="glass rounded-xl border border-white/10 p-6 h-full block hover:border-white/20 transition"
            >
              <div className="icon-bubble mb-3"><Send /></div>
              <h4 className="text-white font-semibold">Telegram-канал</h4>
              <p className="text-gray-400 text-sm mt-1">Новости, обновления и обратная связь — в одном месте.</p>
            </a>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="glass rounded-xl border border-white/10 p-6 h-full">
              <div className="icon-bubble mb-3"><MessageSquare /></div>
              <h4 className="text-white font-semibold">Отзыв = скидка 20%</h4>
              <p className="text-gray-400 text-sm mt-1">Оставь отзыв после анализа и получи промокод на 20% скидку на следующую покупку.</p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
