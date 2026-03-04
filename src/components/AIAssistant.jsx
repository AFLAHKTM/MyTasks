import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Bot, User } from 'lucide-react';
import { getTasks } from '../lib/data';

export default function AIAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'ai', content: 'Hello! I am your AI workspace assistant. How can I help you manage your tasks today?' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen, isTyping]);

    const handleSend = () => {
        if (!input.trim()) return;

        const userMsg = input.trim();
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setInput('');
        setIsTyping(true);

        // Simulated AI response delay
        setTimeout(() => {
            let aiResponse = "I'm currently a demonstration AI, but I'm deeply integrated with your data! Try asking me about 'tasks' or 'overdue'.";

            const lowerMsg = userMsg.toLowerCase();
            const tasks = getTasks();

            if (lowerMsg.includes('task') || lowerMsg.includes('how many')) {
                const completed = tasks.filter(t => t.status === 'Done').length;
                aiResponse = `You currently have ${tasks.length} total tasks in your workspace. ${completed} of them are fully completed!`;
            } else if (lowerMsg.includes('overdue')) {
                const overdue = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'Done');
                if (overdue.length > 0) {
                    aiResponse = `You have ${overdue.length} overdue task(s). You can find them highlighted in red on your Dashboard. I'd recommend tackling those first!`;
                } else {
                    aiResponse = "Fantastic news! You have zero overdue tasks right now. You are completely caught up.";
                }
            } else if (lowerMsg.includes('create') || lowerMsg.includes('add') || lowerMsg.includes('new')) {
                aiResponse = "To create a brand new task, click the brightly colored 'Create Task' buttons on your Dashboard, or use the '+ New page' shortcut directly in your Kanban columns.";
            } else if (lowerMsg.includes('hello') || lowerMsg.includes('hi')) {
                aiResponse = "Hello there! Ready to crush some goals today? What's on our agenda?";
            }

            setMessages(prev => [...prev, { role: 'ai', content: aiResponse }]);
            setIsTyping(false);
        }, 1500);
    };

    return (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            {isOpen && (
                <div style={{
                    width: '350px',
                    height: '500px',
                    marginBottom: '1rem',
                    borderRadius: 'var(--radius-lg)',
                    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.95))',
                    backdropFilter: 'blur(20px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05) inset',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    transformOrigin: 'bottom right',
                    animation: 'chatPop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                }}>
                    {/* Header */}
                    <div style={{
                        padding: '1rem',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'rgba(255, 255, 255, 0.03)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{
                                width: '32px', height: '32px', borderRadius: '50%',
                                background: 'linear-gradient(45deg, var(--accent-primary), #60a5fa)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'white'
                            }}>
                                <Sparkles size={16} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white', margin: 0 }}>mytask.ai</h3>
                                <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', margin: 0 }}>Workspace Assistant</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: '0.25rem', borderRadius: '50%', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'white'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}>
                            <X size={18} />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }} className="ai-messages custom-scrollbar">
                        {messages.map((msg, i) => (
                            <div key={i} style={{
                                display: 'flex',
                                gap: '0.5rem',
                                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                maxWidth: '85%'
                            }}>
                                {msg.role === 'ai' && (
                                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0, marginTop: '2px' }}>
                                        <Bot size={12} />
                                    </div>
                                )}
                                <div style={{
                                    padding: '0.75rem 1rem',
                                    borderRadius: '1.25rem',
                                    borderBottomLeftRadius: msg.role === 'ai' ? '0.25rem' : '1.25rem',
                                    borderBottomRightRadius: msg.role === 'user' ? '0.25rem' : '1.25rem',
                                    background: msg.role === 'user' ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'rgba(255, 255, 255, 0.08)',
                                    color: 'white',
                                    fontSize: '0.875rem',
                                    lineHeight: 1.5,
                                    border: msg.role === 'user' ? 'none' : '1px solid rgba(255, 255, 255, 0.05)',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                }}>
                                    {msg.content}
                                </div>
                                {msg.role === 'user' && (
                                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0, marginTop: '2px' }}>
                                        <User size={12} />
                                    </div>
                                )}
                            </div>
                        ))}
                        {isTyping && (
                            <div style={{ display: 'flex', gap: '0.5rem', alignSelf: 'flex-start', maxWidth: '85%' }}>
                                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0, marginTop: '2px' }}>
                                    <Bot size={12} />
                                </div>
                                <div style={{
                                    padding: '0.75rem 1rem',
                                    borderRadius: '1.25rem',
                                    borderBottomLeftRadius: '0.25rem',
                                    background: 'rgba(255, 255, 255, 0.08)',
                                    display: 'flex', gap: '4px', alignItems: 'center', height: '36px'
                                }}>
                                    <div className="typing-dot" style={{ animationDelay: '0ms' }}></div>
                                    <div className="typing-dot" style={{ animationDelay: '150ms' }}></div>
                                    <div className="typing-dot" style={{ animationDelay: '300ms' }}></div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div style={{
                        padding: '1rem',
                        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                        background: 'rgba(0, 0, 0, 0.2)'
                    }}>
                        <div style={{
                            display: 'flex',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '999px',
                            padding: '4px 4px 4px 16px',
                            transition: 'all 0.2s',
                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
                        }} className="ai-input-wrapper">
                            <input
                                type="text"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSend()}
                                placeholder="Message AI..."
                                style={{
                                    flex: 1,
                                    background: 'transparent',
                                    border: 'none',
                                    outline: 'none',
                                    color: 'white',
                                    fontSize: '0.875rem'
                                }}
                            />
                            <button
                                onClick={handleSend}
                                style={{
                                    width: '32px', height: '32px', borderRadius: '50%',
                                    background: input.trim() ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)',
                                    border: 'none',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'white', cursor: input.trim() ? 'pointer' : 'default',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <Send size={14} style={{ marginLeft: input.trim() ? '2px' : '0' }} />
                            </button>
                        </div>
                        <div style={{ textAlign: 'center', marginTop: '8px' }}>
                            <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>Powered by Advanced AI</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Bubble Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                    border: 'none',
                    boxShadow: '0 8px 32px rgba(59, 130, 246, 0.4), inset 0 2px 4px rgba(255,255,255,0.3)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    transform: isOpen ? 'scale(0.9) rotate(15deg)' : 'scale(1) rotate(0deg)',
                    zIndex: 10000
                }}
            >
                <Sparkles size={28} />
            </button>
        </div>
    );
}
