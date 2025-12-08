// src/context/ChatContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const LOCAL_STORAGE_KEY = 'chatHistory';
  const [messages, setMessages] = useState([]);

  useEffect(() => {
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (saved && JSON.parse(saved).length > 0) {
    setMessages(JSON.parse(saved));
  } else {
    // Only set greeting if no saved messages
    setMessages([
      {
        sender: 'bot',
        text: 'Hello! I am your family tree assistant. Ask me questions like "Who is the partner of Rohith?"'
      }
    ]);
  }
}, []);


  // Save to localStorage whenever messages change
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  return (
    <ChatContext.Provider value={{ messages, setMessages }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
