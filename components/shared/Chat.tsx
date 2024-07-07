import React, { useState, useEffect, useRef } from "react";
import Markdown from "react-markdown";

type MessageProps = {
  role: "user" | "assistant";
  text: string;
};

const UserMessage: React.FC<{ text: string }> = ({ text }) => (
  <div className="bg-blue-200 p-2 rounded mb-2">{text}</div>
);

const AssistantMessage: React.FC<{ text: string }> = ({ text }) => (
  <div className="bg-gray-200 p-2 rounded mb-2">
    <Markdown>{text}</Markdown>
  </div>
);

const Message: React.FC<MessageProps> = ({ role, text }) => {
  if (role === "user") {
    return <UserMessage text={text} />;
  } else if (role === "assistant") {
    return <AssistantMessage text={text} />;
  } else {
    return null;
  }
};

const Chat: React.FC = () => {
  const [userInput, setUserInput] = useState<string>("");
  const [messages, setMessages] = useState<MessageProps[]>([]);
  const [inputDisabled, setInputDisabled] = useState<boolean>(false);

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

    const newMessage = { role: "user" as const, text: userInput };
    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setUserInput("");
    setInputDisabled(true);

    try {
      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userInput, context: '' }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessages((prevMessages) => [...prevMessages, { role: "assistant", text: data.response }]);
      } else {
        console.error('Error:', data);
        setMessages((prevMessages) => [...prevMessages, { role: "assistant", text: "Error: " + data.error }]);
      }
    } catch (error: unknown) {
      console.error('Error:', error);
      if (error instanceof Error) {
        setMessages((prevMessages) => [...prevMessages, { role: "assistant", text: "Error: " + error.message }]);
      } else {
        setMessages((prevMessages) => [...prevMessages, { role: "assistant", text: "An unknown error occurred" }]);
      }
    }

    setInputDisabled(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((msg, index) => (
          <Message key={index} role={msg.role} text={msg.text} />
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="flex p-4">
        <input
          type="text"
          className="flex-1 border rounded p-2"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Enter your question"
          disabled={inputDisabled}
        />
        <button type="submit" className="ml-2 p-2 bg-blue-500 text-white rounded" disabled={inputDisabled}>
          Send
        </button>
      </form>
    </div>
  );
};

export default Chat;
