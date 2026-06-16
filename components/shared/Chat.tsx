"use client"

import React, { useState, useEffect, useRef } from "react"
import Latex from "react-latex-next"
import { Pencil, Trash, XCircle, Send, User, PaperclipIcon, SendIcon } from 'lucide-react'
import { PlaceholdersAndVanishInput } from "./placeholders-and-vanish-input"
import { AnimatePresence, motion } from "framer-motion"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type MessageProps = {
  role: "user" | "assistant"
  text: string
}

interface ChatProps {
  questionId: string
  questionText: string
  options?: string[]
  markscheme?: string
}

const UserMessage: React.FC<{ text: string; onEdit: () => void; onDelete: () => void }> = ({ text, onEdit, onDelete }) => (
  <div className="flex items-start self-end max-w-xl space-x-2 mb-4">
    <div className="border border-gray-300 bg-white p-4 rounded-lg relative">
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
    <User size={24} className="text-blue-500" />
  </div>
)

const AssistantMessage: React.FC<{ text: string }> = ({ text }) => {
  const renderSection = (section: string) => {
    if (section.startsWith("Example:")) {
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-2">
          <div className="font-semibold text-blue-700">Example</div>
          <p className="text-gray-700">
            <Latex>{section.replace("Example:", "").trim()}</Latex>
          </p>
        </div>
      )
    } else if (section.startsWith("Hint:")) {
      return (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-2">
          <div className="font-semibold text-purple-700">Hint</div>
          <p className="text-gray-700">
            <Latex>{section.replace("Hint:", "").trim()}</Latex>
          </p>
        </div>
      )
    } else if (section.startsWith("Note:")) {
      return (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-2">
          <div className="font-semibold text-green-700">Note</div>
          <p className="text-gray-700">
            <Latex>{section.replace("Note:", "").trim()}</Latex>
          </p>
        </div>
      )
    } else {
      return (
        <div className="bg-white border border-gray-300 rounded-lg p-4 mb-4">
          <p className="text-gray-700">
            <Latex>{section}</Latex>
          </p>
        </div>
      )
    }
  }

  const sections = text.split("\n\n").map((section, index) => (
    <div key={index}>
      {renderSection(section)}
    </div>
  ))

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {sections}
    </div>
  )
}

const TypingIndicator: React.FC = () => (
  <div className="bg-secondary text-ink p-2 rounded-lg mb-2 animate-pulse self-start max-w-xl">
    Typing...
  </div>
)

const Message: React.FC<MessageProps & { onEdit: () => void; onDelete: () => void }> = ({ role, text, onEdit, onDelete }) => {
  if (role === "user") {
    return <UserMessage text={text} onEdit={onEdit} onDelete={onDelete} />
  } else if (role === "assistant") {
    return <AssistantMessage text={text} />
  } else {
    return null
  }
}

const Chat: React.FC<ChatProps> = ({ questionId, questionText, options, markscheme }) => {
  const [userInput, setUserInput] = useState<string>("")
  const [messages, setMessages] = useState<MessageProps[]>([])
  const [inputDisabled, setInputDisabled] = useState<boolean>(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [isTyping, setIsTyping] = useState<boolean>(false)
  const [sessionId] = useState<string>(() => `session-${Date.now()}`)

  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userInput.trim()) return

    const prompt = userInput

    if (editingIndex !== null) {
      const updatedMessages = [...messages]
      updatedMessages[editingIndex] = { role: "user", text: prompt }
      setMessages(updatedMessages)
      setEditingIndex(null)
    } else {
      const newMessage: MessageProps = { role: "user", text: prompt }
      setMessages((prevMessages) => [...prevMessages, newMessage])
    }

    setUserInput("")
    setInputDisabled(true)
    setIsTyping(true)

    const context = {
      questionId,
      question: questionText,
      options: options || [],
      markscheme: markscheme || "",
    }

    try {
      const response = await fetch("/api/openai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: prompt, context, sessionId }),
      })

      if (!response.ok) {
        // Error responses are JSON ({ error }); a successful reply is a stream.
        const data = await response.json().catch(() => null)
        console.error("Error:", data)
        setMessages((prevMessages) => [
          ...prevMessages,
          { role: "assistant", text: "Error: " + (data?.error ?? "The request failed.") },
        ])
        return
      }

      // Success: /api/openai returns a StreamingTextResponse — a raw text token
      // stream, NOT JSON. Append an assistant message and fill it as chunks
      // arrive so the hint renders progressively.
      const reader = response.body?.getReader()
      if (!reader) throw new Error("The response had no body to stream")
      const decoder = new TextDecoder()

      setIsTyping(false)
      setMessages((prevMessages) => [...prevMessages, { role: "assistant", text: "" }])

      let acc = ""
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        acc += decoder.decode(value, { stream: true })
        setMessages((prevMessages) => {
          const next = [...prevMessages]
          next[next.length - 1] = { role: "assistant", text: acc }
          return next
        })
      }
    } catch (error) {
      console.error("Error:", error)
      setMessages((prevMessages) => [
        ...prevMessages,
        { role: "assistant", text: "An unknown error occurred" },
      ])
    } finally {
      setInputDisabled(false)
      setIsTyping(false)
    }
  }

  const handleEdit = (index: number) => {
    setUserInput(messages[index].text)
    setEditingIndex(index)
  }

  const handleDelete = (index: number) => {
    const updatedMessages = messages.filter((_, i) => i !== index && i !== index + 1)
    setMessages(updatedMessages)
  }

  const handleCancelEdit = () => {
    setUserInput("")
    setEditingIndex(null)
  }

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card className="mb-8 bg-gray-100">
        <CardHeader>
          <CardTitle>Hello,</CardTitle>
          <CardDescription>How can I help you with Question {questionId}?</CardDescription>
        </CardHeader>
      </Card>

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
          <PlaceholdersAndVanishInput
            placeholders={[
              "Can you explain this question?",
              "What's the key concept here?",
              "How do I approach this problem?",
              "Can you provide a hint?",
              "What's the next step in solving this?",
            ]}
            onChange={(e) => setUserInput(e.target.value)}
            onSubmit={handleSubmit}
          />
          {editingIndex !== null && (
            <button onClick={handleCancelEdit} className="mx-2 p-2 text-gray-500 hover:text-black">
              <XCircle size={20} />
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-between gap-3 mt-4">
          <p className="text-xs text-gray-500">
            ChatGPT may display inaccurate info, including about people, so double-check its responses.{" "}
            <a href="#" className="text-blue-600">
              Your privacy and ChatGPT Apps
            </a>
          </p>
          <button className="min-h-11 p-2 bg-red-500 text-white rounded-lg w-full sm:w-auto sm:min-h-0 hover:bg-red-600" onClick={() => setMessages([])}>
            Clear
          </button>
        </div>
      </div>
      <div className="flex flex-wrap justify-center mt-4 gap-2">
        <Button variant="outline" className="min-h-11 sm:min-h-0">
          Explain the question
        </Button>
        <Button variant="outline" className="min-h-11 sm:min-h-0">
          Provide a hint
        </Button>
        <Button variant="outline" className="min-h-11 sm:min-h-0">
          Break down the solution
        </Button>
      </div>
    </div>
  )
}

export default Chat