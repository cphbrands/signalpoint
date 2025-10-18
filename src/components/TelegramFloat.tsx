"use client";

export default function TelegramFloat() {
  return (
    <div className="fixed bottom-5 right-5 z-50">
      <a
        href="https://t.me/signalpoint007"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Open Telegram support chat"
        className="relative block"
        title="Chat på Telegram"
      >
        {/* Ping-ring (klikbarheden blokeres ikke) */}
        <span className="pointer-events-none absolute inset-0 rounded-full bg-blue-400/40 animate-ping"></span>

        {/* Selve knappen */}
        <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition">
          {/* Telegram ikon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-6 h-6"
            aria-hidden="true"
          >
            <path d="M21.524 2.49a1.297 1.297 0 0 0-1.308-.215L2.53 9.448a1.298 1.298 0 0 0 .047 2.421l4.822 1.72 2.01 6.573a1.297 1.298 0 0 0 2.185.53l2.857-2.94 4.555 3.318a1.297 1.297 0 0 0 2.033-.83l2.604-16.59a1.297 1.297 0 0 0-.12-.9z" />
          </svg>
        </span>
      </a>
    </div>
  );
}