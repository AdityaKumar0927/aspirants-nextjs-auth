"use client"

import React, { useState, useEffect, useRef } from "react";
import Latex from 'react-latex-next';
import { ArrowBigRight, Pencil, Trash, XCircle } from 'lucide-react';

type MessageProps = {
  role: "user" | "assistant";
  text: string;
};

const UserMessage: React.FC<{ text: string; onEdit: () => void; onDelete: () => void; }> = ({ text, onEdit, onDelete }) => (
  <div className="bg-[#fad7b4] text-black p-2 rounded relative self-end max-w-xl">
    <div className="flex items-center justify-between">
      <div className="flex-grow mr-2"><Latex>{text}</Latex></div>
      <div className="flex space-x-1">
        <button onClick={onEdit} className="text-gray-600 hover:text-gray-900">
          <Pencil size={16} />
        </button>
        <button onClick={onDelete} className="text-gray-600 hover:text-gray-900">
          <Trash size={16} />
        </button>
      </div>
    </div>
  </div>
);

const AssistantMessage: React.FC<{ text: string }> = ({ text }) => {
  const renderSection = (section: string) => {
    if (section.startsWith("Example:")) {
      return (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center mb-2">
            <i className="fas fa-info-circle text-blue-500 mr-2"></i>
            <span className="font-semibold text-blue-700">Example</span>
          </div>
          <p className="text-gray-700"><Latex>{section.replace("Example:", "").trim()}</Latex></p>
        </div>
      );
    } else if (section.startsWith("Hint:")) {
      return (
        <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4 mb-4">
          <div className="flex items-center mb-2">
            <i className="fas fa-lightbulb text-purple-500 mr-2"></i>
            <span className="font-semibold text-purple-700">Hint</span>
          </div>
          <p className="text-gray-700"><Latex>{section.replace("Hint:", "").trim()}</Latex></p>
        </div>
      );
    } else if (section.startsWith("Note:")) {
      return (
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-4">
          <div className="flex items-center mb-2">
            <i className="fas fa-sticky-note text-green-500 mr-2"></i>
            <span className="font-semibold text-green-700">Note</span>
          </div>
          <p className="text-gray-700"><Latex>{section.replace("Note:", "").trim()}</Latex></p>
        </div>
      );
    } else {
      return (
        <div className="bg-white rounded-lg p-4 shadow mb-4">
          <p className="text-gray-700"><Latex>{section}</Latex></p>
        </div>
      );
    }
  };

  const sections = text.split("\n\n").map((section, index) => (
    <div key={index}>
      {renderSection(section)}
    </div>
  ));

  return (
    <div className="max-w-2xl bg-white mx-auto space-y-4">
      {sections}
    </div>
  );
};

const TypingIndicator: React.FC = () => (
  <div className="bg-gray-200 text-black p-2 rounded mb-2 animate-pulse self-start max-w-xl">
    Typing...
  </div>
);

const Message: React.FC<MessageProps & { onEdit: () => void; onDelete: () => void; }> = ({ role, text, onEdit, onDelete }) => {
  if (role === "user") {
    return <UserMessage text={text} onEdit={onEdit} onDelete={onDelete} />;
  } else if (role === "assistant") {
    return <AssistantMessage text={text} />;
  } else {
    return null;
  }
};

const Chat: React.FC<{ questionText: string, options?: string[], markscheme?: string }> = ({ questionText, options, markscheme }) => {
  const [userInput, setUserInput] = useState<string>("");
  const [messages, setMessages] = useState<MessageProps[]>([]);
  const [inputDisabled, setInputDisabled] = useState<boolean>(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [sessionId] = useState<string>(() => `session-${Date.now()}`);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const prompt = userInput;

    if (editingIndex !== null) {
      const updatedMessages = [...messages];
      updatedMessages[editingIndex] = { role: "user", text: prompt };
      setMessages(updatedMessages);
      setEditingIndex(null);
    } else {
      const newMessage: MessageProps = { role: "user", text: prompt };
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    }

    setUserInput("");
    setInputDisabled(true);
    setIsTyping(true);

    const context = {
      question: questionText,
      options: options || [],
      markscheme: markscheme || ''
    };

    try {
      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: prompt, context, sessionId }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessages((prevMessages) => [...prevMessages, { role: "assistant", text: data.response }]);
      } else {
        console.error('Error:', data);
        setMessages((prevMessages) => [...prevMessages, { role: "assistant", text: "Error: " + data.error }]);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages((prevMessages) => [...prevMessages, { role: "assistant", text: "An unknown error occurred" }]);
    }

    setInputDisabled(false);
    setIsTyping(false);
  };

  const handleEdit = (index: number) => {
    setUserInput(messages[index].text);
    setEditingIndex(index);
  };

  const handleDelete = (index: number) => {
    const updatedMessages = messages.filter((_, i) => i !== index && i !== index + 1);
    setMessages(updatedMessages);
  };

  const handleCancelEdit = () => {
    setUserInput("");
    setEditingIndex(null);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-6xl mb-2">
        <span className="text-blue-500">Hello,</span>
      </h1>
      <h2 className="text-4xl text-gray-400 mb-8">How can I help you today?</h2>

      <div className="flex flex-col h-full max-w-lg mx-auto">
        <div className="flex-1 overflow-y-auto p-4 flex flex-col space-y-4">
          {messages.map((msg, index) => (
            <Message 
              key={index} 
              role={msg.role} 
              text={msg.text} 
              onEdit={() => handleEdit(index)} 
              onDelete={() => handleDelete(index)} 
            />
          ))}
          {isTyping && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        <div className="bg-gray-100 p-4 rounded-full flex items-center mb-4">
          <textarea
            placeholder="Enter your question"
            className="bg-transparent flex-grow outline-none border-none focus:ring-0"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            disabled={inputDisabled}
            rows={2}
          />
          {editingIndex !== null && (
            <button onClick={handleCancelEdit} className="mx-2 p-2 text-gray-500 hover:text-black">
              <XCircle size={20} />
            </button>
          )}
          <button type="submit" onClick={handleSubmit} className="mx-2 p-2">
            <ArrowBigRight size={20} className="text-gray-500 hover:text-black" />
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-4">
          Gemini may display inaccurate info, including about people, so double-check its responses. <a href="#" className="text-blue-600">Your privacy and Gemini Apps</a>
        </p>

        <div className="flex justify-between mt-4">
          <button className="p-2 bg-red-500 text-white rounded" onClick={() => setMessages([])}>Clear Conversation</button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
