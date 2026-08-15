import { formatText } from 'zingo-formatter';
import classNames from 'classnames/bind';
import { useZingoStore } from '../../stores/zingo';
import scss from './ChatMessage.module.scss';

const cn = classNames.bind(scss);

type ChatMessageProps = {
  text: string;
  author: string;
  timestamp: Date;
};

const ChatMessage = ({ text, author, timestamp }: ChatMessageProps) => {
  const enabled = useZingoStore((state) => state.enabled);
  const intensity = useZingoStore((state) => state.intensity);
  const displayText = enabled ? formatText(text, { intensity }) : text;

  return (
    <div className={cn('ChatMessage')}>
      <div className={cn('ChatMessage__header')}>
        <span className={cn('ChatMessage__author')}>{author}</span>
        <span className={cn('ChatMessage__time')}>
          {timestamp.toLocaleTimeString('uk-UA')}
        </span>
      </div>
      <p className={cn('ChatMessage__text')}>{displayText}</p>
    </div>
  );
};

export default ChatMessage;