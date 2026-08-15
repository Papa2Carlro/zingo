import classNames from 'classnames/bind';
import { useZingoStore } from '../../stores/zingo';
import scss from './ZingoToggle.module.scss';

const cn = classNames.bind(scss);

const ZingoToggle = () => {
  const enabled = useZingoStore((state) => state.enabled);
  const intensity = useZingoStore((state) => state.intensity);
  const setEnabled = useZingoStore((state) => state.setEnabled);
  const setIntensity = useZingoStore((state) => state.setIntensity);

  const handleToggle = (checked: boolean) => {
    setEnabled(checked);
  };

  const handleIntensity = (value: string) => {
    const newIntensity = value as 'light' | 'medium' | 'hardcore';
    setIntensity(newIntensity);
  };

  return (
    <div className={cn('ZingoToggle')}>
      <label className={cn('ZingoToggle__label')}>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => handleToggle(e.target.checked)}
          className={cn('ZingoToggle__checkbox')}
        />
        <span className={cn('ZingoToggle__text')}>🎯 Зінго режим</span>
      </label>

      {enabled && (
        <select
          value={intensity}
          onChange={(e) => handleIntensity(e.target.value)}
          className={cn('ZingoToggle__select')}
        >
          <option value="light">Light</option>
          <option value="medium">Medium</option>
          <option value="hardcore">Hardcore</option>
        </select>
      )}
    </div>
  );
};

export default ZingoToggle;