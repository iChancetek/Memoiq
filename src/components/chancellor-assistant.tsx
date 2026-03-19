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
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

  .chancellor-widget {
    font-family: 'Inter', sans-serif;
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 12px;
  }

  .chancellor-panel {
    width: 380px;
    height: 560px;
    background: linear-gradient(135deg, #0d1117 0%, #161b22 50%, #1a1f2e 100%);
    border: 1px solid rgba(99, 130, 255, 0.25);
    border-radius: 20px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(99, 130, 255, 0.1), inset 0 1px 0 rgba(255,255,255,0.05);
    animation: float-in 0.35s cubic-bezier(0.18, 0.89, 0.32, 1.28);
    transform-origin: bottom right;
  }

  @keyframes float-in {
    from { opacity: 0; transform: scale(0.7) translateY(30px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }

  .chancellor-header {
    padding: 16px 18px;
    background: linear-gradient(90deg, rgba(99, 130, 255, 0.15) 0%, rgba(130, 99, 255, 0.1) 100%);
    border-bottom: 1px solid rgba(99, 130, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  }

  .chancellor-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, #6382ff, #a263ff);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    box-shadow: 0 0 15px rgba(99, 130, 255, 0.4);
    flex-shrink: 0;
    position: relative;
  }

  .chancellor-status-dot {
    width: 9px;
    height: 9px;
    background: #22c55e;
    border-radius: 50%;
    position: absolute;
    bottom: 1px;
    right: 1px;
    border: 2px solid #0d1117;
    animation: pulse-green 2s infinite;
  }

  @keyframes pulse-green {
    0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
    50% { box-shadow: 0 0 0 5px rgba(34, 197, 94, 0); }
  }

  .chancellor-header-info h3 {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
    color: #e8eaf6;
    letter-spacing: 0.02em;
  }

  .chancellor-header-info p {
    margin: 2px 0 0;
    font-size: 11px;
    color: rgba(99, 130, 255, 0.85);
    font-weight: 500;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .chancellor-close-btn {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px;
    color: rgba(255,255,255,0.5);
    cursor: pointer;
    font-size: 14px;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }
  .chancellor-close-btn:hover {
    background: rgba(255,255,255,0.1);
    color: #fff;
  }

  .chancellor-messages {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    scrollbar-width: thin;
    scrollbar-color: rgba(99,130,255,0.3) transparent;
  }

  .chancellor-message {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    animation: msg-in 0.2s ease-out;
  }

  @keyframes msg-in {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .chancellor-message.user {
    flex-direction: row-reverse;
  }

  .msg-bubble {
    max-width: 80%;
    padding: 11px 15px;
    border-radius: 16px;
    font-size: 13.5px;
    line-height: 1.55;
  }

  .user .msg-bubble {
    background: linear-gradient(135deg, #6382ff, #8b5cf6);
    color: #fff;
    border-bottom-right-radius: 4px;
    box-shadow: 0 4px 15px rgba(99, 130, 255, 0.35);
  }

  .assistant .msg-bubble {
    background: rgba(255,255,255,0.05);
    color: #d1d5db;
    border: 1px solid rgba(255,255,255,0.08);
    border-bottom-left-radius: 4px;
  }

  .msg-avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: linear-gradient(135deg, #6382ff, #a263ff);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .user-msg-avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: rgba(255,255,255,0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    flex-shrink: 0;
  }

  .typing-indicator {
    display: flex;
    gap: 5px;
    align-items: center;
    padding: 10px 14px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 16px;
    border-bottom-left-radius: 4px;
    width: fit-content;
  }

  .typing-dot {
    width: 6px;
    height: 6px;
    background: rgba(99, 130, 255, 0.7);
    border-radius: 50%;
    animation: typing-bounce 1.2s infinite;
  }
  .typing-dot:nth-child(2) { animation-delay: 0.2s; }
  .typing-dot:nth-child(3) { animation-delay: 0.4s; }

  @keyframes typing-bounce {
    0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
    40% { transform: translateY(-5px); opacity: 1; }
  }

  .chancellor-input-area {
    padding: 14px 16px;
    border-top: 1px solid rgba(99, 130, 255, 0.15);
    background: rgba(0,0,0,0.2);
    display: flex;
    gap: 10px;
    align-items: flex-end;
    flex-shrink: 0;
  }

  .chancellor-input {
    flex: 1;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 12px;
    color: #e0e0e0;
    font-family: 'Inter', sans-serif;
    font-size: 13.5px;
    outline: none;
    padding: 10px 14px;
    resize: none;
    max-height: 100px;
    min-height: 40px;
    transition: border-color 0.2s;
    line-height: 1.45;
  }
  .chancellor-input::placeholder { color: rgba(255,255,255,0.28); }
  .chancellor-input:focus { border-color: rgba(99, 130, 255, 0.5); }

  .chancellor-send-btn {
    background: linear-gradient(135deg, #6382ff, #8b5cf6);
    border: none;
    border-radius: 10px;
    color: #fff;
    cursor: pointer;
    font-size: 16px;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    flex-shrink: 0;
    box-shadow: 0 4px 12px rgba(99, 130, 255, 0.35);
  }
  .chancellor-send-btn:hover { transform: scale(1.05); box-shadow: 0 6px 20px rgba(99, 130, 255, 0.5); }
  .chancellor-send-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

  .chancellor-mic-btn {
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 10px;
    color: rgba(255,255,255,0.6);
    cursor: pointer;
    font-size: 16px;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    flex-shrink: 0;
  }
  .chancellor-mic-btn:hover { background: rgba(99, 130, 255, 0.2); color: #6382ff; border-color: rgba(99, 130, 255, 0.4); }
  .chancellor-mic-btn.recording { background: rgba(239, 68, 68, 0.2); color: #ef4444; border-color: rgba(239, 68, 68, 0.4); animation: recording-pulse 1s infinite; }

  @keyframes recording-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.3); }
    50% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
  }

  .chancellor-fab {
    width: 58px;
    height: 58px;
    background: linear-gradient(135deg, #6382ff, #a263ff);
    border: none;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    box-shadow: 0 6px 25px rgba(99, 130, 255, 0.5), 0 0 0 0 rgba(99, 130, 255, 0.3);
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    color: #fff;
    animation: fab-pulse 3s ease-in-out infinite;
    position: relative;
  }

  .chancellor-fab:hover {
    transform: scale(1.12);
    box-shadow: 0 8px 30px rgba(99, 130, 255, 0.7);
  }

  @keyframes fab-pulse {
    0%, 100% { box-shadow: 0 6px 25px rgba(99, 130, 255, 0.5), 0 0 0 0 rgba(99, 130, 255, 0.2); }
    50% { box-shadow: 0 6px 25px rgba(99, 130, 255, 0.5), 0 0 0 12px rgba(99, 130, 255, 0); }
  }

  .fab-notification {
    position: absolute;
    top: -2px;
    right: -2px;
    width: 14px;
    height: 14px;
    background: #22c55e;
    border-radius: 50%;
    border: 2px solid #0d1117;
    animation: pulse-green 2s infinite;
  }

  .chancellor-welcome-tag {
    background: linear-gradient(135deg, rgba(99,130,255,0.15), rgba(162,99,255,0.15));
    border: 1px solid rgba(99, 130, 255, 0.3);
    border-radius: 12px;
    color: rgba(255,255,255,0.75);
    font-size: 12px;
    font-family: 'Inter', sans-serif;
    padding: 8px 14px;
    white-space: nowrap;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    animation: tag-float 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28);
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
