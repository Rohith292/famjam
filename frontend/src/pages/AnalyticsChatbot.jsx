import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { MdSend } from 'react-icons/md';
import axiosInstance from '../lib/axios';
import { formatResponse } from '../lib/utils';
import { useChat } from '../lib/chatContext';

const AnalyticsChatbot = () => {
    const { messages, setMessages } = useChat();
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedEntity, setSelectedEntity] = useState(null); // 👈 Context for follow-ups
    const [clarificationOptions, setClarificationOptions] = useState(null); // 👈 Ambiguity handler
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const payload = {
                query: input,
                context: selectedEntity // 👈 Send context to backend
            };

            const { data } = await axiosInstance.post('/analytics/chat', payload);

            if (data.clarificationRequired && data.options) {
                setClarificationOptions(data.options); // 👈 Show clarification buttons
                return;
            }

            const botResponse = {
                sender: 'bot',
                text: typeof data.response === 'object' ? formatResponse(data.response) : data.response
            };

            setMessages(prev => [...prev, botResponse]);
        } catch (error) {
            console.error('Chatbot error:', error);
            const botError = { sender: 'bot', text: 'An error occurred. Please try again later.' };
            setMessages(prev => [...prev, botError]);
            toast.error('Failed to get a response from the chatbot.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClarification = async (entity) => {
    setSelectedEntity(entity);
    setClarificationOptions(null);

    const clarificationText = `I meant ${entity.name} from the ${entity.domain}`;
    const userMessage = { sender: 'user', text: clarificationText };

    setMessages(prev => [...prev, userMessage]);
    setInput(''); // Clear input box
    setIsLoading(true);

    try {
        const payload = {
            query: clarificationText, // 👈 Reuse clarification as query
            context: entity           // 👈 Send selected context
        };

        const { data } = await axiosInstance.post('/analytics/chat', payload);

        const botResponse = {
            sender: 'bot',
            text: typeof data.response === 'object' ? formatResponse(data.response) : data.response
        };

        setMessages(prev => [...prev, botResponse]);
    } catch (error) {
        console.error('Clarification error:', error);
        const botError = { sender: 'bot', text: 'Something went wrong while resolving your clarification.' };
        setMessages(prev => [...prev, botError]);
        toast.error('Failed to resolve clarification.');
    } finally {
        setIsLoading(false);
    }
};


    const handleClearChat = () => {
        localStorage.removeItem('chatHistory');
        setSelectedEntity(null);
        setClarificationOptions(null);
        setMessages([
            {
                sender: 'bot',
                text: 'Hello! I am your family tree assistant. Ask me questions like "Who is the partner of Rohith?"'
            }
        ]);
    };

    return (
        <div className="flex flex-col h-full bg-base-200 rounded-lg shadow-lg overflow-hidden ">
            <header className="p-4 bg-base-300 text-base-content border-b border-base-300 flex justify-between items-center">
                <h2 className="text-xl font-bold">FamBot-<span className='text-sm font-medium text-base-content'>lets know more about your family</span></h2>
                <button onClick={handleClearChat} className="btn btn-sm btn-outline btn-error">
                    Clear Chat
                </button>
            </header>

            <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {selectedEntity && (
                    <div className="text-sm text-base-content/70 mb-2">
                        🔍 Context: {selectedEntity.name} ({selectedEntity.domain})
                    </div>
                )}

                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`p-3 rounded-lg max-w-xs sm:max-w-md ${msg.sender === 'user' ? 'bg-primary text-primary-content' : 'bg-base-300 text-base-content'}`}>
                            {msg.text}
                        </div>
                    </div>
                ))}

                {clarificationOptions && (
                    <div className="flex flex-wrap gap-2">
                        {clarificationOptions.map((option, idx) => (
                            <button
                                key={idx}
                                className="btn btn-sm btn-outline"
                                onClick={() => handleClarification(option)}
                            >
                                {option.name} ({option.domain})
                            </button>
                        ))}
                    </div>
                )}

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="p-3 bg-base-300 rounded-lg max-w-xs sm:max-w-md">
                            <span className="loading loading-dots loading-sm"></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-4 bg-base-300 border-t border-base-300 flex items-center gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-1 input input-bordered bg-base-100 text-base-content placeholder-base-content/50 focus:outline-none"
                    placeholder="Ask a question..."
                    disabled={isLoading}
                />
                <button type="submit" className="btn btn-primary text-primary-content" disabled={isLoading}>
                    <MdSend className="h-5 w-5" />
                </button>
            </form>
        </div>
    );
};

export default AnalyticsChatbot;
