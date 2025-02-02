"use client"

import { useState, useCallback, useEffect } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import { formatDistanceToNow } from "date-fns"
import { Button } from "@/components/ui/button"
import { Bold, Italic, List, ListOrdered, Code, Heading1, Heading2, Heart } from "lucide-react"

// --------------------
// Types
// --------------------
export interface Solution {
  id: string
  content: string
  author: string
  createdAt: string
  likes: number
  replies: Solution[]
}

// The local data structure if you need to store or show the question info
interface LocalQuestion {
  id: string
  title: string
  content: string
  solutions: Solution[]
}

// Props for the top-level "QuestionSolutions" component
interface QuestionSolutionsProps {
  questionId: string // questionId from parent
}

interface AdvancedEditorProps {
  onSubmit: (content: string) => void
}

// Simple list of disallowed words (for demonstration):
const PROFANITY_LIST = [
  "fuck", "shit", "bitch", "asshole", "dick", "cunt", 
  // Add more if needed
]

// --------------------
// AdvancedEditor
// --------------------
export function AdvancedEditor({ onSubmit }: AdvancedEditorProps) {
  const [error, setError] = useState<string>("")

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Share your solution...",
      }),
    ],
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none font-light tracking-tight focus:outline-none min-h-[100px] p-2",
      },
    },
  })

  // Simple profanity check
  const checkProfanity = (text: string) => {
    const lower = text.toLowerCase()
    for (const badWord of PROFANITY_LIST) {
      if (lower.includes(badWord)) {
        return true
      }
    }
    return false
  }

  const handleSubmit = () => {
    if (!editor) return
    const plainText = editor.getText().trim() // plain text from the editor

    if (!plainText) {
      setError("Please enter some text.")
      return
    }

    // Check for profanity
    if (checkProfanity(plainText)) {
      setError("Your message contains offensive language, please remove it.")
      return
    }

    // If all good, call onSubmit with the HTML
    onSubmit(editor.getHTML())
    editor.commands.clearContent()
    setError("")
  }

  if (!editor) {
    return null
  }

  return (
    <div className="space-y-4 border rounded-md p-2">
      {error && (
        <p className="text-red-500 text-sm font-light tracking-tight">
          {error}
        </p>
      )}
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

// --------------------
// SolutionForm
// --------------------
export function SolutionForm({ onSubmit }: { onSubmit: (content: string) => void }) {
  return (
    <div className="space-y-2">
      <AdvancedEditor onSubmit={onSubmit} />
    </div>
  )
}

// --------------------
// Single solution block
// --------------------
export function Solution({
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
            <span className="font-medium text-sm tracking-tight">{solution.author}</span>
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
            <Solution
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

// --------------------
// QuestionSolutions
// (Fetches from /api/questions/[questionId]/solutions, etc.)
// --------------------
export function QuestionSolutions({ questionId }: QuestionSolutionsProps) {
  const [solutions, setSolutions] = useState<Solution[]>([])

  // For demonstration, we might fetch solutions from your /api route
  // and store them in local state:
  const fetchSolutions = useCallback(async () => {
    try {
      const res = await fetch(`/api/questions/${questionId}/solutions`)
      if (!res.ok) {
        console.error("Failed to load solutions")
        return
      }
      const data = await res.json()
      setSolutions(data)
    } catch (err) {
      console.error("Error fetching solutions:", err)
    }
  }, [questionId])

  useEffect(() => {
    fetchSolutions()
  }, [fetchSolutions])

  // Add top-level solution
  const handleAddSolution = async (content: string) => {
    try {
      const res = await fetch(`/api/questions/${questionId}/solutions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })
      if (!res.ok) {
        console.error("Failed to create solution")
        return
      }
      // We can refetch or push the new solution locally
      await fetchSolutions()
    } catch (err) {
      console.error("Error creating solution:", err)
    }
  }

  // Reply to an existing solution
  const handleReplySolution = async (parentId: string, content: string) => {
    try {
      const res = await fetch(`/api/questions/${questionId}/solutions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, parentId }),
      })
      if (!res.ok) {
        console.error("Failed to create reply")
        return
      }
      // Refetch
      await fetchSolutions()
    } catch (err) {
      console.error("Error creating reply:", err)
    }
  }

  // Like a solution
  const handleLikeSolution = async (solutionId: string) => {
    try {
      const res = await fetch(`/api/questions/${questionId}/solutions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ solutionId, like: true }),
      })
      if (!res.ok) {
        console.error("Failed to like solution")
        return
      }
      // Refetch
      await fetchSolutions()
    } catch (err) {
      console.error("Error liking solution:", err)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium tracking-tight mb-2">Solutions</h2>
        {/* Editor for new top-level solution */}
        <SolutionForm onSubmit={handleAddSolution} />
      </div>

      {/* Render existing solutions */}
      <div className="space-y-4">
        {solutions.map((sol) => (
          <Solution
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
