'use client';

import ZingoToggle from '../components/ZingoToggle';
import ChatMessage from '../components/ChatMessage';
import { ZingoStoreProvider, useZingoStore } from '../stores/zingo';
import { PROPAGANDA_PHRASES } from '../types';

// Sample messages using real propaganda phrases from the database
const SAMPLE_MESSAGES = [
  {
    id: 1,
    author: 'Олексій',
    text: PROPAGANDA_PHRASES.find(p => p.id === 'svo')?.text || 'специальная военная операция',
    timestamp: '22:07:58',
  },
  {
    id: 2,
    author: 'Марія',
    text: PROPAGANDA_PHRASES.find(p => p.id === 'ukraine_nazis')?.text || 'в украине нацисты',
    timestamp: '22:09:58',
  },
  {
    id: 3,
    author: 'Дмитро',
    text: PROPAGANDA_PHRASES.find(p => p.id === 'protect_donbass')?.text || 'защита донбасса',
    timestamp: '22:11:58',
  },
];

const ChatView = () => {
  const enabled = useZingoStore((state) => state.enabled);
  const intensity = useZingoStore((state) => state.intensity);

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">🎯 Zingo Chat</h1>
          <p className="text-slate-400">
            Тестовий чат з підтримкою зінго-режиму
          </p>
        </header>

        <ZingoToggle />

        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4 text-slate-300">
            Повідомлення {enabled && `(${intensity})`}
          </h2>

          <div className="space-y-3">
            {SAMPLE_MESSAGES.map((msg) => (
              <ChatMessage
                key={msg.id}
                text={msg.text}
                author={msg.author}
                timestamp={msg.timestamp}
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
};

export default function Home() {
  return (
    <ZingoStoreProvider>
      <ChatView />
    </ZingoStoreProvider>
  );
}
