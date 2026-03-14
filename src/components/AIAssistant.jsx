import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Sparkles, X, Send, Bot, User, Search, List, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { getTasks, getNotes, getStatuses } from '../lib/data';

export default function AIAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'ai', content: 'Hello! I am your workspace assistant. I can summarize your tasks, find overdue items, and help you navigate your notes. How can I help you today?' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [context, setContext] = useState({ type: 'general', data: null, index: -1 });
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen, isTyping]);

    // Priority score helper
    const getPriorityScore = (priority) => {
        switch (priority?.toLowerCase()) {
            case 'high': return 3;
            case 'medium': return 2;
            case 'low': return 1;
            default: return 0;
        }
    };

    // Sort tasks by urgency
    const getSortedTasks = () => {
        const tasks = getTasks();
        return [...tasks].sort((a, b) => {
            // Overdue tasks first
            const now = new Date();
            const aOverdue = a.due_date && new Date(a.due_date) < now && a.status !== 'Done';
            const bOverdue = b.due_date && new Date(b.due_date) < now && b.status !== 'Done';
            if (aOverdue && !bOverdue) return -1;
            if (!aOverdue && bOverdue) return 1;

            // Then priority
            const aScore = getPriorityScore(a.priority);
            const bScore = getPriorityScore(b.priority);
            if (aScore !== bScore) return bScore - aScore;

            // Then due date
            if (a.due_date && b.due_date) return new Date(a.due_date) - new Date(b.due_date);
            if (a.due_date) return -1;
            if (b.due_date) return 1;

            return 0;
        });
    };

    const handleSend = () => {
        if (!input.trim()) return;

        const userMsg = input.trim();
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setInput('');
        setIsTyping(true);

        setTimeout(() => {
            const lowerMsg = userMsg.toLowerCase();
            const tasks = getTasks();
            const personalNotes = getNotes();
            const sortedTasks = getSortedTasks();
            
            let aiResponse = "";
            let newContext = { ...context };

            // Handle "next" or continuation
            if (lowerMsg === 'next' || lowerMsg.includes('show more') || lowerMsg === 'next task') {
                if (context.type === 'tasks' || lowerMsg === 'next task') {
                    const nextIndex = lowerMsg === 'next task' ? 0 : context.index + 1;
                    const activeStatuses = ['In progress', 'Not started'];
                    const items = lowerMsg === 'next task' ? sortedTasks.filter(t => activeStatuses.includes(t.status)) : context.data;
                    
                    if (items && items[nextIndex]) {
                        const task = items[nextIndex];
                        aiResponse = `### Next Task: ${task.title}\n\n` +
                                     `**Status:** ${task.status || 'No status'}\n` +
                                     `**Priority:** ${task.priority || 'Normal'}\n` +
                                     `**Due:** ${task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No date'}\n\n` +
                                     `${task.content ? `> ${task.content.substring(0, 100)}${task.content.length > 100 ? '...' : ''}` : '*No description*'}\n\n` +
                                     `Would you like to see the next one? Type "next".`;
                        newContext = { type: 'tasks', data: items, index: nextIndex };
                    } else {
                        aiResponse = "That's all the relevant tasks I found! Anything else?";
                        newContext = { type: 'general', data: null, index: -1 };
                    }
                } else if (context.type === 'notes') {
                    // Logic for next notes could go here
                    aiResponse = "I've already shown you the relevant notes. Ask me to search for something specific or for a 'summary'!";
                } else {
                    aiResponse = "I'm not sure what you want to see 'next'. Try asking for 'tasks' or a 'summary' first!";
                }
            }
            // Handle Summary
            else if (lowerMsg.includes('summary') || lowerMsg.includes('update') || lowerMsg.includes('status')) {
                const total = tasks.length;
                const completed = tasks.filter(t => t.status === 'Done').length;
                const inProgress = tasks.filter(t => t.status === 'In progress').length;
                const overdue = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'Done');
                
                const activeStatuses = ['In progress', 'Not started'];
                const mostUrgent = sortedTasks.find(t => activeStatuses.includes(t.status));
                
                aiResponse = `## Workspace Insight\n\n` +
                             `You have **${total} total tasks** in your workspace.\n\n` +
                             `*   ✅ **${completed}** Completed\n` +
                             `*   ⏳ **${inProgress}** In Progress\n` +
                             `*   ⚠️ **${overdue.length}** Overdue\n\n` +
                             `**Quick Tip:** Your most urgent task is "${mostUrgent?.title || 'None'}". Type "next task" to see details.`;
                newContext = { type: 'general', data: null, index: -1 };
            }
            // Handle Overdue
            else if (lowerMsg.includes('overdue')) {
                const overdue = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'Done');
                if (overdue.length > 0) {
                    aiResponse = `### ⚠️ Overdue Alerts\n\nYou have ${overdue.length} tasks that need immediate attention:\n\n` +
                                 overdue.map((t, i) => `${i + 1}. **${t.title}** (Due: ${new Date(t.due_date).toLocaleDateString()})`).join('\n') +
                                 `\n\nWant to see details for the first one? Type "next".`;
                    newContext = { type: 'tasks', data: overdue, index: -1 };
                } else {
                    aiResponse = "🌟 **Amazing!** You have no overdue tasks. Keep up the great work!";
                }
            }
            // Handle Task Search
            else if (lowerMsg.includes('task') || lowerMsg.includes('find') || lowerMsg.includes('search')) {
                const query = lowerMsg.replace(/task|find|search|about|\?/g, '').trim();
                if (query.length > 1) {
                    const matches = tasks.filter(t => 
                        t.title.toLowerCase().includes(query) || 
                        (t.content && t.content.toLowerCase().includes(query))
                    );
                    if (matches.length > 0) {
                        aiResponse = `I found **${matches.length}** tasks matching "${query}":\n\n` +
                                     matches.map((t, i) => `${i + 1}. ${t.title}`).join('\n') +
                                     `\n\nType "next" to see the first one.`;
                        newContext = { type: 'tasks', data: matches, index: -1 };
                    } else {
                        aiResponse = `I couldn't find any tasks matching "${query}". Try a broader term?`;
                    }
                } else {
                    const activeStatuses = ['In progress', 'Not started'];
                    const active = tasks.filter(t => activeStatuses.includes(t.status));
                    aiResponse = `You have **${active.length}** active tasks (In progress or Not started). Would you like a list or should I show you the most urgent one? (Type "next task")`;
                    newContext = { type: 'tasks', data: active, index: -1 };
                }
            }
            // Handle Notes
            else if (lowerMsg.includes('note') || lowerMsg.includes('pad')) {
                if (personalNotes.trim()) {
                    aiResponse = `### Personal Notepad Contents\n\nYour scratchpad has ${personalNotes.length} characters. Here's a snippet:\n\n> ${personalNotes.substring(0, 150)}${personalNotes.length > 150 ? '...' : ''}\n\nNeed me to find something specific in there?`;
                } else {
                    aiResponse = "Your personal workspace pad is currently empty. You can add notes in the 'Notes' page!";
                }
            }
            // Greeting/Fallback
            else if (lowerMsg.includes('hello') || lowerMsg.includes('hi')) {
                aiResponse = "Hello! I'm ready to help. You can ask for a 'summary', 'overdue tasks', or search for something specific like 'Find the meeting notes'.";
            } else {
                aiResponse = "I'm not exactly sure how to help with that yet, but I can summarize your workspace, find overdue tasks, or search your notes! Try asking for a 'summary' or 'next task'.";
            }

            setMessages(prev => [...prev, { role: 'ai', content: aiResponse }]);
            setContext(newContext);
            setIsTyping(false);
        }, 800);
    };

    return (
        <div className="ai-assistant-wrapper" style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            {isOpen && (
                <div style={{
                    width: '380px',
                    height: '550px',
                    marginBottom: '1rem',
                    borderRadius: 'var(--radius-lg)',
                    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.98))',
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
                        padding: '1.25rem',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'rgba(255, 255, 255, 0.03)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                                width: '36px', height: '36px', borderRadius: '10px',
                                background: 'linear-gradient(45deg, #3b82f6, #60a5fa)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'white',
                                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                            }}>
                                <Bot size={20} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'white', margin: 0 }}>Workspace Intelligence</h3>
                                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>Powered by Advanced AI</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '0.4rem', borderRadius: '50%', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'white'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}>
                            <X size={20} />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div style={{ flex: 1, padding: '1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="ai-messages custom-scrollbar">
                        {messages.map((msg, i) => (
                            <div key={i} style={{
                                display: 'flex',
                                gap: '0.75rem',
                                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                maxWidth: '90%'
                            }}>
                                {msg.role === 'ai' && (
                                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa', flexShrink: 0, marginTop: '4px' }}>
                                        <Bot size={14} />
                                    </div>
                                )}
                                <div style={{
                                    padding: '0.85rem 1.1rem',
                                    borderRadius: '1.25rem',
                                    borderBottomLeftRadius: msg.role === 'ai' ? '0.25rem' : '1.25rem',
                                    borderBottomRightRadius: msg.role === 'user' ? '0.25rem' : '1.25rem',
                                    background: msg.role === 'user' ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'rgba(255, 255, 255, 0.06)',
                                    color: 'white',
                                    fontSize: '0.9rem',
                                    lineHeight: 1.6,
                                    border: msg.role === 'user' ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
                                    boxShadow: msg.role === 'user' ? '0 4px 12px rgba(37, 99, 235, 0.3)' : '0 4px 12px rgba(0,0,0,0.1)'
                                }} className="markdown-content">
                                    {msg.role === 'ai' ? (
                                        <ReactMarkdown components={{
                                            p: ({node, ...props}) => <p style={{margin: '0 0 0.75rem 0'}} {...props} />,
                                            h1: ({node, ...props}) => <h1 style={{fontSize: '1.1rem', margin: '0.5rem 0', color: '#60a5fa'}} {...props} />,
                                            h2: ({node, ...props}) => <h2 style={{fontSize: '1rem', margin: '0.5rem 0', color: '#60a5fa'}} {...props} />,
                                            h3: ({node, ...props}) => <h3 style={{fontSize: '0.95rem', margin: '0.5rem 0', color: '#60a5fa'}} {...props} />,
                                            ul: ({node, ...props}) => <ul style={{paddingLeft: '1.25rem', margin: '0.5rem 0'}} {...props} />,
                                            li: ({node, ...props}) => <li style={{marginBottom: '0.25rem'}} {...props} />,
                                            code: ({node, ...props}) => <code style={{background: 'rgba(0,0,0,0.3)', padding: '2px 4px', borderRadius: '4px', fontSize: '0.85rem'}} {...props} />,
                                            blockquote: ({node, ...props}) => <blockquote style={{borderLeft: '3px solid #3b82f6', paddingLeft: '0.75rem', color: 'rgba(255,255,255,0.7)', margin: '0.75rem 0'}} {...props} />
                                        }}>
                                            {msg.content}
                                        </ReactMarkdown>
                                    ) : msg.content}
                                </div>
                                {msg.role === 'user' && (
                                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0, marginTop: '4px' }}>
                                        <User size={14} />
                                    </div>
                                )}
                            </div>
                        ))}
                        {isTyping && (
                            <div style={{ display: 'flex', gap: '0.75rem', alignSelf: 'flex-start', maxWidth: '85%' }}>
                                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa', flexShrink: 0, marginTop: '4px' }}>
                                    <Bot size={14} />
                                </div>
                                <div style={{
                                    padding: '0.85rem 1.1rem',
                                    borderRadius: '1.25rem',
                                    borderBottomLeftRadius: '0.25rem',
                                    background: 'rgba(255, 255, 255, 0.06)',
                                    display: 'flex', gap: '6px', alignItems: 'center', height: '40px'
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
                        padding: '1.25rem',
                        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                        background: 'rgba(0, 0, 0, 0.25)'
                    }}>
                        <div style={{
                            display: 'flex',
                            background: 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            borderRadius: '16px',
                            padding: '6px 6px 6px 16px',
                            transition: 'all 0.2s',
                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
                            alignItems: 'center'
                        }} className="ai-input-wrapper">
                            <input
                                type="text"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSend()}
                                placeholder="Ask about your tasks or notes..."
                                style={{
                                    flex: 1,
                                    background: 'transparent',
                                    border: 'none',
                                    outline: 'none',
                                    color: 'white',
                                    fontSize: '0.9rem',
                                    padding: '8px 0'
                                }}
                            />
                            <button
                                onClick={handleSend}
                                style={{
                                    width: '36px', height: '36px', borderRadius: '12px',
                                    background: input.trim() ? '#3b82f6' : 'rgba(255,255,255,0.05)',
                                    border: 'none',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'white', cursor: input.trim() ? 'pointer' : 'default',
                                    transition: 'all 0.2s',
                                    boxShadow: input.trim() ? '0 4px 12px rgba(59, 130, 246, 0.4)' : 'none'
                                }}
                            >
                                <Send size={16} />
                            </button>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '12px' }}>
                             <button onClick={() => { setInput('Summary'); }} style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '999px', cursor: 'pointer' }}>Workspace Summary</button>
                             <button onClick={() => { setInput('Next Task'); }} style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '999px', cursor: 'pointer' }}>What's Next?</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bubble Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '20px',
                    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                    border: 'none',
                    boxShadow: '0 8px 32px rgba(59, 130, 246, 0.4), inset 0 2px 4px rgba(255,255,255,0.3)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    transform: isOpen ? 'scale(0.9) rotate(225deg)' : 'scale(1) rotate(0deg)',
                    zIndex: 10000
                }}
            >
                {isOpen ? <X size={32} /> : <Sparkles size={32} />}
            </button>
        </div>
    );
}
