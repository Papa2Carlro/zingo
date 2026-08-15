'use client';

import { useState } from 'react';

interface ZingoToggleProps {
  onChange?: (enabled: boolean, intensity: 'light' | 'medium' | 'hardcore') => void;
}

export default function ZingoToggle({ onChange }: ZingoToggleProps) {
  const [enabled, setEnabled] = useState(false);
  const [intensity, setIntensity] = useState<'light' | 'medium' | 'hardcore'>('medium');

  const handleToggle = (checked: boolean) => {
    setEnabled(checked);
    onChange?.(checked, intensity);
  };

  const handleIntensity = (value: string) => {
    const newIntensity = value as 'light' | 'medium' | 'hardcore';
    setIntensity(newIntensity);
    if (enabled) {
      onChange?.(true, newIntensity);
    }
  };

  return (
    <div className="flex items-center gap-4 p-4 zingo-card">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => handleToggle(e.target.checked)}
          className="w-4 h-4 accent-sky-500"
        />
        <span className="font-medium">🎯 Зінго режим</span>
      </label>

      {enabled && (
        <select
          value={intensity}
          onChange={(e) => handleIntensity(e.target.value)}
          className="zingo-input w-auto"
        >
          <option value="light">Light</option>
          <option value="medium">Medium</option>
          <option value="hardcore">Hardcore</option>
        </select>
      )}
    </div>
  );
}