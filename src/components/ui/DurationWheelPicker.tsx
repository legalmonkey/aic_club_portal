'use client';

import React, { useState, useRef, useEffect } from 'react';

interface DurationWheelPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (hours: number, label: string) => void;
  initialHours?: number;
}

const HOURS = Array.from({ length: 13 }, (_, i) => i); // 0 to 12 hours
const MINUTES = [0, 15, 30, 45]; // 00, 15, 30, 45 mins
const PRESETS = [
  { label: '1 hr', h: 1, m: 0 },
  { label: '2 hrs', h: 2, m: 0 },
  { label: '3 hrs', h: 3, m: 0 },
  { label: '4 hrs', h: 4, m: 0 },
  { label: '6 hrs', h: 6, m: 0 },
  { label: '8 hrs', h: 8, m: 0 },
];

export function DurationWheelPicker({
  isOpen,
  onClose,
  onSelect,
  initialHours = 0,
}: DurationWheelPickerProps) {
  const defaultWholeHours = Math.floor(initialHours);
  const remainderMins = Math.round((initialHours - defaultWholeHours) * 60);
  const defaultMinutes = [0, 15, 30, 45].reduce((prev, curr) =>
    Math.abs(curr - remainderMins) < Math.abs(prev - remainderMins) ? curr : prev
  , 0);

  const [selectedHour, setSelectedHour] = useState(defaultWholeHours || 2);
  const [selectedMinute, setSelectedMinute] = useState(defaultMinutes || 0);

  const hoursContainerRef = useRef<HTMLDivElement>(null);
  const minutesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialHours > 0) {
        setSelectedHour(Math.floor(initialHours));
        const rem = Math.round((initialHours - Math.floor(initialHours)) * 60);
        setSelectedMinute([0, 15, 30, 45].reduce((prev, curr) =>
          Math.abs(curr - rem) < Math.abs(prev - rem) ? curr : prev
        , 0));
      }
    }
  }, [isOpen, initialHours]);

  if (!isOpen) return null;

  const totalDecimalHours = Number((selectedHour + selectedMinute / 60).toFixed(2));
  const formattedLabel =
    selectedMinute === 0
      ? `${selectedHour}.0 hrs`
      : `${selectedHour}h ${selectedMinute}m (${totalDecimalHours} hrs)`;

  const handleConfirm = () => {
    if (totalDecimalHours <= 0) {
      return;
    }
    onSelect(totalDecimalHours, formattedLabel);
    onClose();
  };

  const handleHourWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY > 0) {
      setSelectedHour(prev => Math.min(12, prev + 1));
    } else {
      setSelectedHour(prev => Math.max(0, prev - 1));
    }
  };

  const handleMinuteWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const idx = MINUTES.indexOf(selectedMinute);
    if (e.deltaY > 0) {
      const nextIdx = Math.min(MINUTES.length - 1, idx + 1);
      setSelectedMinute(MINUTES[nextIdx]);
    } else {
      const prevIdx = Math.max(0, idx - 1);
      setSelectedMinute(MINUTES[prevIdx]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deep-navy/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-light-grey max-w-sm w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-light-grey flex items-center justify-between bg-off-white">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-electric-blue text-xl">schedule</span>
            <div>
              <h3 className="font-heading text-base font-bold text-deep-navy">
                Select Shift Duration
              </h3>
              <p className="font-mono text-[11px] text-tech-grey">
                Scroll wheel to set duration
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-tech-grey hover:text-deep-navy hover:bg-light-grey/60 transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Live Preview Display */}
        <div className="px-5 py-3 bg-electric-blue/5 border-b border-electric-blue/10 flex items-center justify-between">
          <span className="font-mono text-xs uppercase tracking-wider text-tech-grey font-semibold">
            Chosen Duration:
          </span>
          <span className="font-mono text-sm font-bold text-electric-blue bg-white px-2.5 py-0.5 rounded-md border border-electric-blue/20 shadow-xs">
            {totalDecimalHours > 0 ? formattedLabel : '0.0 hrs'}
          </span>
        </div>

        {/* Quick Presets */}
        <div className="px-5 pt-3 pb-1 flex flex-wrap gap-1.5 items-center">
          <span className="font-mono text-[10px] uppercase tracking-wider text-tech-grey font-semibold mr-1">
            Quick:
          </span>
          {PRESETS.map(p => (
            <button
              key={p.label}
              type="button"
              onClick={() => {
                setSelectedHour(p.h);
                setSelectedMinute(p.m);
              }}
              className={`px-2 py-0.5 rounded-md font-mono text-xs font-semibold transition-all ${
                selectedHour === p.h && selectedMinute === p.m
                  ? 'bg-electric-blue text-white shadow-xs'
                  : 'bg-off-white hover:bg-light-grey/70 text-deep-navy border border-light-grey'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Scroll Wheels Section */}
        <div className="p-5 flex items-center justify-center gap-6 select-none">
          {/* Hours Wheel */}
          <div className="flex flex-col items-center">
            <span className="font-mono text-[11px] uppercase tracking-wider text-tech-grey font-bold mb-2">
              Hours
            </span>

            {/* Stepper Up */}
            <button
              type="button"
              onClick={() => setSelectedHour(prev => Math.min(12, prev + 1))}
              className="p-1 text-tech-grey hover:text-electric-blue hover:bg-off-white rounded transition-colors"
            >
              <span className="material-symbols-outlined text-base">keyboard_arrow_up</span>
            </button>

            {/* Cylinder Wheel Container */}
            <div
              ref={hoursContainerRef}
              onWheel={handleHourWheel}
              className="relative w-24 h-36 overflow-hidden rounded-xl bg-off-white border border-light-grey shadow-inner flex flex-col justify-center"
            >
              {/* Highlight selection band */}
              <div className="absolute top-1/2 left-0 right-0 h-10 -translate-y-1/2 bg-electric-blue/15 border-y border-electric-blue/30 pointer-events-none z-10" />

              {/* Fading gradient masks */}
              <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-off-white via-off-white/80 to-transparent pointer-events-none z-20" />
              <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-off-white via-off-white/80 to-transparent pointer-events-none z-20" />

              {/* Wheel items */}
              <div className="flex flex-col items-center justify-center transition-transform duration-150">
                {/* Previous preview */}
                <div
                  onClick={() => setSelectedHour(prev => Math.max(0, prev - 1))}
                  className="h-9 flex items-center justify-center font-mono text-xs text-tech-grey/50 cursor-pointer hover:text-tech-grey"
                >
                  {selectedHour > 0 ? `${selectedHour - 1} hr` : ''}
                </div>

                {/* Active Selection */}
                <div className="h-10 flex items-center justify-center font-heading text-xl font-extrabold text-electric-blue z-10 tracking-tight">
                  {selectedHour} <span className="text-xs font-mono font-normal ml-1">hr</span>
                </div>

                {/* Next preview */}
                <div
                  onClick={() => setSelectedHour(prev => Math.min(12, prev + 1))}
                  className="h-9 flex items-center justify-center font-mono text-xs text-tech-grey/50 cursor-pointer hover:text-tech-grey"
                >
                  {selectedHour < 12 ? `${selectedHour + 1} hr` : ''}
                </div>
              </div>
            </div>

            {/* Stepper Down */}
            <button
              type="button"
              onClick={() => setSelectedHour(prev => Math.max(0, prev - 1))}
              className="p-1 text-tech-grey hover:text-electric-blue hover:bg-off-white rounded transition-colors"
            >
              <span className="material-symbols-outlined text-base">keyboard_arrow_down</span>
            </button>
          </div>

          <div className="font-heading text-2xl font-bold text-tech-grey/40 self-center mt-4">:</div>

          {/* Minutes Wheel */}
          <div className="flex flex-col items-center">
            <span className="font-mono text-[11px] uppercase tracking-wider text-tech-grey font-bold mb-2">
              Minutes
            </span>

            {/* Stepper Up */}
            <button
              type="button"
              onClick={() => {
                const idx = MINUTES.indexOf(selectedMinute);
                if (idx < MINUTES.length - 1) setSelectedMinute(MINUTES[idx + 1]);
              }}
              className="p-1 text-tech-grey hover:text-electric-blue hover:bg-off-white rounded transition-colors"
            >
              <span className="material-symbols-outlined text-base">keyboard_arrow_up</span>
            </button>

            {/* Cylinder Wheel Container */}
            <div
              ref={minutesContainerRef}
              onWheel={handleMinuteWheel}
              className="relative w-24 h-36 overflow-hidden rounded-xl bg-off-white border border-light-grey shadow-inner flex flex-col justify-center"
            >
              {/* Highlight selection band */}
              <div className="absolute top-1/2 left-0 right-0 h-10 -translate-y-1/2 bg-electric-blue/15 border-y border-electric-blue/30 pointer-events-none z-10" />

              {/* Fading gradient masks */}
              <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-off-white via-off-white/80 to-transparent pointer-events-none z-20" />
              <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-off-white via-off-white/80 to-transparent pointer-events-none z-20" />

              {/* Wheel items */}
              <div className="flex flex-col items-center justify-center transition-transform duration-150">
                {/* Previous preview */}
                <div
                  onClick={() => {
                    const idx = MINUTES.indexOf(selectedMinute);
                    if (idx > 0) setSelectedMinute(MINUTES[idx - 1]);
                  }}
                  className="h-9 flex items-center justify-center font-mono text-xs text-tech-grey/50 cursor-pointer hover:text-tech-grey"
                >
                  {MINUTES.indexOf(selectedMinute) > 0
                    ? `${String(MINUTES[MINUTES.indexOf(selectedMinute) - 1]).padStart(2, '0')} min`
                    : ''}
                </div>

                {/* Active Selection */}
                <div className="h-10 flex items-center justify-center font-heading text-xl font-extrabold text-electric-blue z-10 tracking-tight">
                  {String(selectedMinute).padStart(2, '0')}{' '}
                  <span className="text-xs font-mono font-normal ml-1">min</span>
                </div>

                {/* Next preview */}
                <div
                  onClick={() => {
                    const idx = MINUTES.indexOf(selectedMinute);
                    if (idx < MINUTES.length - 1) setSelectedMinute(MINUTES[idx + 1]);
                  }}
                  className="h-9 flex items-center justify-center font-mono text-xs text-tech-grey/50 cursor-pointer hover:text-tech-grey"
                >
                  {MINUTES.indexOf(selectedMinute) < MINUTES.length - 1
                    ? `${String(MINUTES[MINUTES.indexOf(selectedMinute) + 1]).padStart(2, '0')} min`
                    : ''}
                </div>
              </div>
            </div>

            {/* Stepper Down */}
            <button
              type="button"
              onClick={() => {
                const idx = MINUTES.indexOf(selectedMinute);
                if (idx > 0) setSelectedMinute(MINUTES[idx - 1]);
              }}
              className="p-1 text-tech-grey hover:text-electric-blue hover:bg-off-white rounded transition-colors"
            >
              <span className="material-symbols-outlined text-base">keyboard_arrow_down</span>
            </button>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-5 py-3 bg-off-white border-t border-light-grey flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-surface hover:bg-light-grey text-deep-navy font-sans text-xs font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={totalDecimalHours <= 0}
            className="px-4 py-2 rounded-lg gradient-electric hover:opacity-95 text-white font-sans text-xs font-bold shadow-sm transition-all disabled:opacity-50"
          >
            Confirm Duration ({totalDecimalHours > 0 ? `${totalDecimalHours}h` : '0h'})
          </button>
        </div>
      </div>
    </div>
  );
}
