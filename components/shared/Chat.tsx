import React, { useState, useEffect, useRef } from "react";
import { LucideBot } from "lucide-react";
import Markdown from "react-markdown";

type MessageProps = {
  role: "user" | "assistant";
  text: string;
};

const UserMessage = ({ text }: { text: string }) => {
  return <div className="user-message">{text}</div>;
};

const AssistantMessage = ({ text }: { text: string }) => {
  return (
    <div className="assistant-message">
      <Markdown>{text}</Markdown>
    </div>
  );
};

const Message = ({ role, text }: MessageProps) => {
  if (role === "user") return <UserMessage text={text} />;
  if (role === "assistant") return <AssistantMessage text={text} />;
  return null;
};

const Chat = () => {
  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState<MessageProps[]>([]);
  const [inputDisabled, setInputDisabled] = useState(false);
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
    setMessages([...messages, { role: "user", text: userInput }]);
    setUserInput("");
    setInputDisabled(true);
    try {
      const response = await fetch("/api/openai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: userInput, context: "" }),
      });
      const data = await response.json();
      setMessages((prevMessages) => [
        ...prevMessages,
        { role: "assistant", text: data.response },
      ]);
    } catch (error) {
      console.error("Error fetching AI response:", error);
    } finally {
      setInputDisabled(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-gray-100 p-4 rounded-full flex items-center mb-4">
        <input
          type="text"
          placeholder="Enter a prompt here"
          className="bg-transparent flex-grow outline-none border-none focus:border-transparent focus:ring-0"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          disabled={inputDisabled}
        />
        <button className="mx-2" onClick={handleSubmit} disabled={inputDisabled}>
          <LucideBot className="h-5 w-5 text-gray-500" />
        </button>
      </div>
      <div className="messages">
        {messages.map((msg, index) => (
          <Message key={index} role={msg.role} text={msg.text} />
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default Chat;
