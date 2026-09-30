'use client';

import { useEffect, useState } from 'react';
import { TUTORIAL_STEPS } from '@/lib/ai';

export default function Tutorial() {
  const [step, setStep] = useState(-1);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!localStorage.getItem('lingepro_tutorial_done')) setStep(0);
  }, []);

  function close() {
    localStorage.setItem('lingepro_tutorial_done', '1');
    setStep(-1);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setStep(0)}
        className="fixed bottom-20 md:bottom-6 left-4 z-40 w-10 h-10 rounded-full bg-white border border-slate-200 shadow text-slate-600 font-bold"
        title="Tutoriel"
      >
        ?
      </button>
      {step >= 0 && step < TUTORIAL_STEPS.length && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
          <div className="card max-w-md w-full">
            <div className="text-xs text-slate-400 mb-1">
              Étape {step + 1}/{TUTORIAL_STEPS.length}
            </div>
            <h3 className="font-bold text-lg mb-2">{TUTORIAL_STEPS[step].title}</h3>
            <p className="text-sm text-slate-600 mb-4">{TUTORIAL_STEPS[step].body}</p>
            <div className="flex justify-between">
              <button type="button" className="btn-secondary" onClick={close}>
                Passer
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  if (step >= TUTORIAL_STEPS.length - 1) close();
                  else setStep(step + 1);
                }}
              >
                {step >= TUTORIAL_STEPS.length - 1 ? 'Terminer' : 'Suivant'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
