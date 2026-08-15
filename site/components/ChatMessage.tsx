import { formatText } from 'zingo-formatter';

interface ChatMessageProps {
  text: string;
  author: string;
  timestamp: Date;
  zingoEnabled?: boolean;
  intensity?: 'light' | 'medium' | 'hardcore';
}

export default function ChatMessage({
  text,
  author,
  timestamp,
  zingoEnabled = false,
  intensity = 'medium',
}: ChatMessageProps) {
  const displayText = zingoEnabled ? formatText(text, { intensity }) : text;

  return (
    <div className="zingo-card mb-3">
      <div className="flex justify-between items-start mb-1">
        <span className="font-bold text-sky-400">{author}</span>
        <span className="text-xs text-slate-500">
          {timestamp.toLocaleTimeString('uk-UA')}
        </span>
      </div>
      <p className="text-slate-200">{displayText}</p>
    </div>
  );
}