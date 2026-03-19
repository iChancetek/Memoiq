'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';

// ─── TYPES ─────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700&family=Rajdhani:wght@400;500;600;700&display=swap');

  .chancellor-widget {
    font-family: 'Rajdhani', 'Inter', sans-serif;
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 12px;
  }

  /* 🌌 HOLOGRAM PANEL BASE */
  .chancellor-panel {
    width: 420px;
    height: 620px;
    background: rgba(3, 7, 18, 0.08);
    border: 1px solid rgba(0, 242, 254, 0.35);
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    backdrop-filter: blur(4px) saturate(120%);
    box-shadow: 
      0 0 50px rgba(0, 242, 254, 0.12),
      inset 0 0 30px rgba(0, 242, 254, 0.02),
      0 30px 60px rgba(0, 0, 0, 0.3);
    animation: hologram-float 4s ease-in-out infinite, float-in 0.35s cubic-bezier(0.18, 0.89, 0.32, 1.28);
    transform-origin: bottom right;
    position: relative;
    color: #e0f2fe;
  }

  /* 📐 FUTURISTIC CORNER BRACKETS */
  .chancellor-panel::before {
    content: "";
    position: absolute;
    top: 6px; left: 6px; right: 6px; bottom: 6px;
    border: 1px solid rgba(0, 242, 254, 0.08);
    border-radius: 8px;
    pointer-events: none;
    z-index: 5;
    background: 
      linear-gradient(90deg, #00f2fe 1px, transparent 1px) 0 0,
      linear-gradient(180deg, #00f2fe 1px, transparent 1px) 0 0,
      linear-gradient(270deg, #00f2fe 1px, transparent 1px) 100% 0,
      linear-gradient(180deg, #00f2fe 1px, transparent 1px) 100% 0,
      linear-gradient(90deg, #00f2fe 1px, transparent 1px) 0 100%,
      linear-gradient(0deg, #00f2fe 1px, transparent 1px) 0 100%,
      linear-gradient(270deg, #00f2fe 1px, transparent 1px) 100% 100%,
      linear-gradient(0deg, #00f2fe 1px, transparent 1px) 100% 100%;
    background-size: 14px 14px;
    background-repeat: no-repeat;
    opacity: 0.7;
    background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 242, 254, 0.03) 50%) center / 100% 4px; /* Scanline integrated */
  }

  @keyframes float-in {
    from { opacity: 0; transform: scale(0.8) translateY(30px) rotateY(15deg); }
    to   { opacity: 1; transform: scale(1) translateY(0) rotateY(0deg); }
  }

  @keyframes hologram-float {
    0%, 100% { transform: translateY(0) rotateX(0.5deg); }
    50% { transform: translateY(-8px) rotateX(-0.5deg); }
  }

  /* 👑 HUD HEADER */
  .chancellor-header {
    padding: 16px 20px;
    background: rgba(0, 242, 254, 0.06);
    border-bottom: 1px solid rgba(0, 242, 254, 0.25);
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
    position: relative;
    z-index: 10;
  }

  .chancellor-avatar {
    width: 36px;
    height: 36px;
    border-radius: 6px;
    background: rgba(0, 242, 254, 0.1);
    border: 1px solid rgba(0, 242, 254, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    box-shadow: 0 0 15px rgba(0, 242, 254, 0.4);
    flex-shrink: 0;
    position: relative;
  }

  .chancellor-status-dot {
    width: 8px;
    height: 8px;
    background: #00f2fe;
    border-radius: 50%;
    position: absolute;
    bottom: -2px;
    right: -2px;
    border: 1.5px solid #0d1117;
    animation: neon-glow 1.5s infinite;
  }

  @keyframes neon-glow {
    0%, 100% { box-shadow: 0 0 8px #00f2fe; }
    50% { box-shadow: 0 0 15px #00f2fe; }
  }

  .chancellor-header-info h3 {
    margin: 0;
    font-family: 'Orbitron', sans-serif;
    font-size: 14px;
    font-weight: 700;
    color: #00f2fe;
    letter-spacing: 0.1em;
    text-shadow: 0 0 8px rgba(0, 242, 254, 0.6);
  }

  .chancellor-header-info p {
    margin: 3px 0 0;
    font-family: 'Rajdhani', sans-serif;
    font-size: 11px;
    color: rgba(224, 242, 254, 0.7);
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .chancellor-close-btn {
    background: rgba(0, 242, 254, 0.05);
    border: 1px solid rgba(0, 242, 254, 0.3);
    border-radius: 4px;
    color: rgba(0, 242, 254, 0.8);
    cursor: pointer;
    font-size: 12px;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }
  .chancellor-close-btn:hover {
    background: rgba(0, 242, 254, 0.2);
    color: #fff;
    box-shadow: 0 0 8px rgba(0, 242, 254, 0.5);
  }

  /* 💬 MESSAGES LIST */
  .chancellor-messages {
    flex: 1;
    overflow-y: auto;
    padding: 18px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    scrollbar-width: thin;
    scrollbar-color: rgba(0,242,254,0.2) transparent;
    z-index: 10;
    background: transparent;
  }

  .chancellor-message {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    animation: msg-in 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }

  @keyframes msg-in {
    from { opacity: 0; transform: translateY(12px) skewX(2deg); }
    to   { opacity: 1; transform: translateY(0) skewX(0deg); }
  }

  .chancellor-message.user {
    flex-direction: row-reverse;
  }

  .msg-bubble {
    max-width: 85%;
    padding: 12px 16px;
    font-size: 14.5px;
    line-height: 1.6;
    font-weight: 500;
    letter-spacing: 0.02em;
    white-space: pre-line;
  }

  /* 🤖 ASSISTANT BUBBLE (HOLO PANEL) */
  .assistant .msg-bubble {
    background: rgba(0, 242, 254, 0.02);
    color: #e0f2fe;
    border: 1px solid rgba(0, 242, 254, 0.18);
    border-left: 2px solid rgba(0, 242, 254, 0.7);
    border-radius: 4px 12px 12px 12px;
    backdrop-filter: blur(2px);
    box-shadow: none;
    position: relative;
  }

  .user .msg-bubble {
    background: rgba(139, 92, 246, 0.06);
    color: #f3e8ff;
    border: 1px solid rgba(139, 92, 246, 0.2);
    border-right: 2px solid rgba(167, 139, 250, 0.7);
    border-radius: 12px 4px 12px 12px;
    backdrop-filter: blur(2px);
    box-shadow: none;
  }

  .msg-avatar {
    width: 26px;
    height: 26px;
    border-radius: 4px;
    background: rgba(0, 242, 254, 0.15);
    border: 1px solid rgba(0, 242, 254, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    flex-shrink: 0;
    margin-top: 3px;
    color: #00f2fe;
  }

  .user-msg-avatar {
    width: 26px;
    height: 26px;
    border-radius: 4px;
    background: rgba(139, 92, 246, 0.15);
    border: 1px solid rgba(139, 92, 246, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    flex-shrink: 0;
    margin-top: 3px;
    color: #a78bfa;
  }

  /* 🎤 TYPING INDICATOR */
  .typing-indicator {
    display: flex;
    gap: 6px;
    align-items: center;
    padding: 10px 15px;
    background: rgba(0, 242, 254, 0.05);
    border: 1px solid rgba(0, 242, 254, 0.15);
    border-radius: 4px 12px 12px 12px;
    border-left: 2px solid #00f2fe;
  }

  .typing-dot {
    width: 6px;
    height: 6px;
    background: #00f2fe;
    border-radius: 50%;
    animation: typing-bounce 1.2s infinite;
    box-shadow: 0 0 5px #00f2fe;
  }
  .typing-dot:nth-child(2) { animation-delay: 0.2s; }
  .typing-dot:nth-child(3) { animation-delay: 0.4s; }

  @keyframes typing-bounce {
    0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
    40% { transform: translateY(-3px); opacity: 1; text-shadow: 0 0 8px #00f2fe; }
  }

  /* ⌨️ INPUT HUD */
  .chancellor-input-area {
    padding: 14px 18px;
    border-top: 1px solid rgba(0, 242, 254, 0.25);
    background: rgba(0, 0, 0, 0.08);
    display: flex;
    gap: 12px;
    align-items: flex-end;
    flex-shrink: 0;
    z-index: 10;
  }

  .chancellor-input {
    flex: 1;
    background: rgba(0, 242, 254, 0.02);
    border: 1px solid rgba(0, 242, 254, 0.2);
    border-radius: 6px;
    color: #fff;
    font-family: 'Rajdhani', sans-serif;
    font-size: 14px;
    font-weight: 500;
    outline: none;
    padding: 10px 14px;
    resize: none;
    max-height: 100px;
    transition: all 0.2s;
    line-height: 1.4;
  }
  .chancellor-input::placeholder { color: rgba(224, 242, 254, 0.3); }
  .chancellor-input:focus { border-color: #00f2fe; box-shadow: 0 0 10px rgba(0, 242, 254, 0.15); }

  .chancellor-send-btn {
    background: rgba(0, 242, 254, 0.1);
    border: 1px solid rgba(0, 242, 254, 0.4);
    border-radius: 6px;
    color: #00f2fe;
    cursor: pointer;
    font-size: 14px;
    width: 38px;
    height: 38px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    flex-shrink: 0;
    box-shadow: 0 0 8px rgba(0, 242, 254, 0.15);
  }
  .chancellor-send-btn:hover { background: rgba(0, 242, 254, 0.2); transform: scale(1.04); box-shadow: 0 0 15px rgba(0, 242, 254, 0.4); }
  .chancellor-send-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

  .chancellor-mic-btn {
    background: rgba(0, 242, 254, 0.05);
    border: 1px solid rgba(0, 242, 254, 0.25);
    border-radius: 6px;
    color: rgba(224, 242, 254, 0.7);
    cursor: pointer;
    font-size: 14px;
    width: 38px;
    height: 38px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    flex-shrink: 0;
  }
  .chancellor-mic-btn:hover { background: rgba(0, 242, 254, 0.15); color: #00f2fe; border-color: #00f2fe; }
  .chancellor-mic-btn.recording { background: rgba(239, 68, 68, 0.15); color: #ef4444; border-color: #ef4444; animation: pulse-red 1s infinite; }

  @keyframes pulse-red {
    0%, 100% { box-shadow: 0 0 5px #ef4444; }
    50% { box-shadow: 0 0 12px #ef4444; }
  }

  /* 🔘 FLOATING FAB BUTTON */
  .chancellor-fab {
    width: 58px;
    height: 58px;
    background: rgba(3, 7, 18, 0.75);
    border: 2px solid rgba(0, 242, 254, 0.6);
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    box-shadow: 0 0 20px rgba(0, 242, 254, 0.35), inset 0 0 10px rgba(0, 242, 254, 0.1);
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    color: #00f2fe;
    backdrop-filter: blur(10px);
    animation: fab-glitch 4s ease-in-out infinite;
    position: relative;
    z-index: 999;
  }

  .chancellor-fab:hover {
    transform: scale(1.12);
    border-color: #00f2fe;
    box-shadow: 0 0 35px rgba(0, 242, 254, 0.6), inset 0 0 15px rgba(0, 242, 254, 0.2);
    text-shadow: 0 0 8px #00f2fe;
  }

  @keyframes fab-glitch {
    0%, 100% { transform: translateY(0); }
    33% { transform: translateY(-3px); }
    66% { transform: translateY(2px); }
  }

  .fab-notification {
    position: absolute;
    top: 5px; right: 5px;
    width: 10px; height: 10px;
    background: #00f2fe;
    border-radius: 50%;
    border: 1.5px solid #0d1117;
    animation: neon-glow 1.5s infinite;
  }

  .chancellor-welcome-tag {
    background: rgba(0, 242, 254, 0.08);
    border: 1px solid rgba(0, 242, 254, 0.3);
    border-radius: 6px;
    color: #00f2fe;
    font-size: 13px;
    font-weight: 600;
    font-family: 'Rajdhani', sans-serif;
    padding: 8px 14px;
    white-space: nowrap;
    backdrop-filter: blur(10px);
    box-shadow: 0 0 15px rgba(0, 242, 254, 0.15);
    animation: tag-float 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28);
    letter-spacing: 0.04em;
  }

  @keyframes tag-float {
    from { opacity: 0; transform: translateY(10px) scale(0.9); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
`;


// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function ChancellorAssistant() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [showTag, setShowTag] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Hide tag after 5 seconds
  useEffect(() => {
    const t = setTimeout(() => setShowTag(false), 5000);
    return () => clearTimeout(t);
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Add initial greeting when opened for the first time
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: "Hi, I'm Chancellor. I can help you with anything on MemoIQ or iChanceTEK. What would you like to do?",
        timestamp: new Date(),
      }]);
    }
  }, [isOpen, messages.length]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/chancellor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content.trim(),
          history,
          currentPage: pathname,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Request failed');

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.text,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMsg]);

      // Play voice response if available
      if (data.audioDataUri) {
        const audio = new Audio(data.audioDataUri);
        audio.play().catch(() => {});
      }

    } catch (err: any) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: "I encountered a brief interruption. Please try again.",
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }, [messages, isLoading, pathname]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const toggleRecording = async () => {
    if (isRecording && mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = e => chunks.push(e.data);

      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const dataUri = reader.result as string;
          try {
            const res = await fetch('/api/transcribe-audio', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ audioDataUri: dataUri }),
            });
            const { text } = await res.json();
            if (text?.trim()) {
              sendMessage(text.trim());
            }
          } catch {
            console.error('Transcription failed');
          }
        };
        reader.readAsDataURL(blob);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch {
      console.warn('Microphone access denied');
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      <div className="chancellor-widget">
        {/* Floating Panel */}
        {isOpen && (
          <div className="chancellor-panel">
            {/* Header */}
            <div className="chancellor-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="chancellor-avatar">
                  🤖
                  <div className="chancellor-status-dot" />
                </div>
                <div className="chancellor-header-info">
                  <h3>Chancellor</h3>
                  <p>GPT-5.4 · RAG Intelligence</p>
                </div>
              </div>
              <button className="chancellor-close-btn" onClick={() => setIsOpen(false)}>
                ✕
              </button>
            </div>

            {/* Messages */}
            <div className="chancellor-messages">
              {messages.map(msg => (
                <div key={msg.id} className={`chancellor-message ${msg.role}`}>
                  {msg.role === 'assistant' && (
                    <div className="msg-avatar">🤖</div>
                  )}
                  <div className="msg-bubble">{msg.content}</div>
                  {msg.role === 'user' && (
                    <div className="user-msg-avatar">👤</div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="chancellor-message assistant">
                  <div className="msg-avatar">🤖</div>
                  <div className="typing-indicator">
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="chancellor-input-area">
              <button
                className={`chancellor-mic-btn ${isRecording ? 'recording' : ''}`}
                onClick={toggleRecording}
                title={isRecording ? 'Stop recording' : 'Voice input'}
              >
                {isRecording ? '⏹' : '🎤'}
              </button>
              <textarea
                ref={inputRef}
                className="chancellor-input"
                placeholder="Ask Chancellor anything..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
              />
              <button
                className="chancellor-send-btn"
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isLoading}
                title="Send message"
              >
                ➤
              </button>
            </div>
          </div>
        )}

        {/* Welcome tag tooltip */}
        {!isOpen && showTag && (
          <div className="chancellor-welcome-tag">
            👋 Hi! I'm Chancellor, your AI assistant
          </div>
        )}

        {/* FAB Button */}
        <button
          className="chancellor-fab"
          onClick={() => {
            setIsOpen(o => !o);
            setShowTag(false);
          }}
          title="Open Chancellor AI"
          aria-label="Open Chancellor AI Assistant"
        >
          {isOpen ? '✕' : '✦'}
          {!isOpen && <div className="fab-notification" />}
        </button>
      </div>
    </>
  );
}
