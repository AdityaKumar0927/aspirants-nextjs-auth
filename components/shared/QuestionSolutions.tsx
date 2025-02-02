"use client"

import React, { useState, useEffect } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import { formatDistanceToNow } from "date-fns"
import { Button } from "@/components/ui/button"
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Code,
  Heading1,
  Heading2,
  Heart,
} from "lucide-react"

interface Solution {
  id: string
  content: string
  authorId?: string | null
  createdAt: string
  likes: number
  parentId?: string | null
  replies: Solution[]
}

interface AdvancedEditorProps {
  onSubmit: (content: string) => void
}
function AdvancedEditor({ onSubmit }: AdvancedEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Share your solution...",
      }),
    ],
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none font-light tracking-tight focus:outline-none min-h-[100px] p-2",
      },
    },
  })

  const handleSubmit = () => {
    if (editor && editor.getText().trim()) {
      onSubmit(editor.getHTML())
      editor.commands.clearContent()
    }
  }

  if (!editor) return null

  return (
    <div className="space-y-4 border rounded-md p-2">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive("bold") ? "bg-muted" : ""}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive("italic") ? "bg-muted" : ""}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive("heading", { level: 1 }) ? "bg-muted" : ""}
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive("heading", { level: 2 }) ? "bg-muted" : ""}
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive("bulletList") ? "bg-muted" : ""}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive("orderedList") ? "bg-muted" : ""}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={editor.isActive("code") ? "bg-muted" : ""}
        >
          <Code className="h-4 w-4" />
        </Button>
      </div>
      <EditorContent editor={editor} />

      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          className="font-light tracking-tight border-blue-800 bg-blue-100 text-blue-600 hover:bg-blue-200"
        >
          Submit
        </Button>
      </div>
    </div>
  )
}

function SolutionForm({ onSubmit }: { onSubmit: (content: string) => void }) {
  return (
    <div className="space-y-2">
      <AdvancedEditor onSubmit={onSubmit} />
    </div>
  )
}

function SingleSolution({
  solution,
  onReply,
  onLike,
}: {
  solution: Solution
  onReply: (parentId: string, content: string) => void
  onLike: (id: string) => void
}) {
  const [isReplying, setIsReplying] = useState(false)

  return (
    <div className="space-y-2">
      <div className="flex items-start space-x-2">
        <div className="flex-grow">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-sm tracking-tight">
              {/* If you had user data, else fallback */}
              {solution.authorId || "Anonymous"}
            </span>
            <span className="text-xs text-gray-500 font-light tracking-tight">
              {formatDistanceToNow(new Date(solution.createdAt), { addSuffix: true })}
            </span>
          </div>
          <div
            className="prose prose-sm max-w-none font-light tracking-tight mt-1"
            dangerouslySetInnerHTML={{ __html: solution.content }}
          />
        </div>
      </div>

      <div className="flex items-center space-x-4 ml-4">
        <button
          onClick={() => onLike(solution.id)}
          className="text-xs text-gray-500 hover:text-red-500 flex items-center space-x-1 transition-colors duration-200"
        >
          <Heart
            className="w-3 h-3 fill-current"
            color={solution.likes > 0 ? "red" : "currentColor"}
          />
          <span className="font-light tracking-tight">{solution.likes}</span>
        </button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsReplying(!isReplying)}
          className="text-xs font-light tracking-tight"
        >
          Reply
        </Button>
      </div>

      {isReplying && (
        <div className="ml-4 mt-2">
          <SolutionForm
            onSubmit={(content) => {
              onReply(solution.id, content)
              setIsReplying(false)
            }}
          />
        </div>
      )}

      {solution.replies.length > 0 && (
        <div className="ml-4 mt-2 space-y-2 border-l border-gray-200 pl-4">
          {solution.replies.map((reply) => (
            <SingleSolution
              key={reply.id}
              solution={reply}
              onReply={onReply}
              onLike={onLike}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function QuestionSolutions({
  questionId,
}: {
  questionId: string | undefined
}) {
  const [solutions, setSolutions] = useState<Solution[]>([])
  const [loading, setLoading] = useState(false)

  // -------------
  // Fetch solutions
  // -------------
  async function fetchSolutions() {
    if (!questionId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/questions/${questionId}/solutions`, {
        cache: "no-store",
      })
      if (!res.ok) {
        throw new Error("Failed to load solutions.")
      }
      const data = await res.json()
      setSolutions(data.solutions || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (questionId) {
      fetchSolutions()
    }
  }, [questionId])

  // -------------
  // Add solution
  // -------------
  async function handleAddSolution(content: string) {
    if (!questionId) return
    try {
      const res = await fetch(`/api/questions/${questionId}/solutions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })
      if (!res.ok) {
        throw new Error("Failed to create solution.")
      }
      // The newly created solution
      const newSol = await res.json()
      // Refresh or push to local state
      setSolutions((prev) => [newSol, ...prev])
    } catch (err) {
      console.error(err)
    }
  }

  // -------------
  // Reply
  // -------------
  async function handleReplySolution(parentId: string, content: string) {
    if (!questionId) return
    try {
      const res = await fetch(`/api/questions/${questionId}/solutions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, parentId }),
      })
      if (!res.ok) {
        throw new Error("Failed to create reply.")
      }
      const reply = await res.json()
      // Insert the reply into local state
      setSolutions((prev) => addReplyToList(prev, parentId, reply))
    } catch (err) {
      console.error(err)
    }
  }

  function addReplyToList(list: Solution[], parentId: string, reply: Solution): Solution[] {
    return list.map((sol) => {
      if (sol.id === parentId) {
        return { ...sol, replies: [...sol.replies, reply] }
      }
      if (sol.replies.length > 0) {
        return { ...sol, replies: addReplyToList(sol.replies, parentId, reply) }
      }
      return sol
    })
  }

  // -------------
  // Like solution (example: you might do a PATCH)
  // -------------
  async function handleLikeSolution(id: string) {
    // For demonstration, we won't implement a separate route here
    // We'll just simulate a local "like" increment
    setSolutions((prev) => incrementLike(prev, id))
  }

  function incrementLike(list: Solution[], solId: string): Solution[] {
    return list.map((sol) => {
      if (sol.id === solId) {
        return { ...sol, likes: sol.likes + 1 }
      }
      if (sol.replies.length > 0) {
        return { ...sol, replies: incrementLike(sol.replies, solId) }
      }
      return sol
    })
  }

  if (!questionId) {
    return <div className="text-sm text-gray-400">No question selected.</div>
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium tracking-tight mb-2">Solutions</h3>

      {/* Solution editor */}
      <SolutionForm onSubmit={handleAddSolution} />

      {/* Loading state */}
      {loading && <div className="text-sm text-gray-500">Loading solutions...</div>}

      {/* Render solutions */}
      <div className="space-y-4 mt-4">
        {solutions.map((sol) => (
          <SingleSolution
            key={sol.id}
            solution={sol}
            onReply={handleReplySolution}
            onLike={handleLikeSolution}
          />
        ))}
      </div>
    </div>
  )
}
