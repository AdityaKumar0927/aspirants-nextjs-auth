"use client"

import { useState, useCallback, useEffect } from "react"
import { useSession, signIn } from "next-auth/react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import { formatDistanceToNow } from "date-fns"
import { Button } from "@/components/ui/button"
import { Bold, Italic, List, ListOrdered, Code, Heading1, Heading2, Heart } from "lucide-react"

interface QuestionSolutionsProps {
  questionId: string
}

// Minimal solution interface from DB
interface Solution {
  id: string
  content: string
  authorId: string | null
  createdAt: string
  likes: number
  parentId: string | null
  replies?: Solution[]
}

// For local text editor
function ProfanityExtension() {
  // Placeholder extension approach or handle in your onSubmit
  return null
}

export function QuestionSolutions({ questionId }: QuestionSolutionsProps) {
  const { data: session, status } = useSession()

  const [solutions, setSolutions] = useState<Solution[]>([])
  const [error, setError] = useState<string>("")

  // 1) Fetch solutions
  const fetchSolutions = useCallback(async () => {
    try {
      const res = await fetch(`/api/questions/${questionId}/solutions`)
      if (!res.ok) {
        throw new Error("Failed to load solutions")
      }
      const data = await res.json()
      setSolutions(data)
    } catch (err) {
      console.error(err)
      setError("Unable to load solutions.")
    }
  }, [questionId])

  useEffect(() => {
    fetchSolutions()
  }, [fetchSolutions])

  // 2) Editor for top-level solutions (only if authenticated)
  const [editorError, setEditorError] = useState<string>("")

  const topLevelEditor = useEditor({
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
    onUpdate: ({ editor }) => {
      // check profanity here if you'd like
      setEditorError("")
    },
  })

  const handleSubmitTopLevel = async () => {
    if (!topLevelEditor) return
    const text = topLevelEditor.getText().trim()
    if (!text) {
      setEditorError("Please enter some text.")
      return
    }

    // Simple profanity check
    if (checkForProfanity(text)) {
      setEditorError("Please remove offensive language.")
      return
    }

    const html = topLevelEditor.getHTML()
    try {
      const res = await fetch(`/api/questions/${questionId}/solutions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: html }),
      })
      if (!res.ok) {
        throw new Error("Failed to create solution")
      }
      topLevelEditor.commands.clearContent()
      fetchSolutions()
    } catch (err) {
      console.error(err)
      setEditorError("Failed to post solution. Try again.")
    }
  }

  // 3) Like a solution
  const handleLike = async (solutionId: string) => {
    if (!session) {
      alert("You must be logged in to like a solution.")
      return
    }
    try {
      const res = await fetch(`/api/questions/${questionId}/solutions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ solutionId, like: true }),
      })
      if (!res.ok) {
        throw new Error("Failed to like solution")
      }
      fetchSolutions()
    } catch (err) {
      console.error(err)
    }
  }

  // 4) Reply logic (only if authenticated)
  const [replyError, setReplyError] = useState<string>("")

  const handleReply = async (parentId: string, content: string) => {
    if (!session) {
      alert("You must be logged in to reply.")
      return
    }
    if (!content.trim()) {
      setReplyError("Reply cannot be empty.")
      return
    }
    if (checkForProfanity(content)) {
      setReplyError("Please remove offensive language.")
      return
    }
    try {
      const res = await fetch(`/api/questions/${questionId}/solutions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, parentId }),
      })
      if (!res.ok) {
        throw new Error("Failed to create reply.")
      }
      fetchSolutions()
    } catch (err) {
      console.error(err)
      setReplyError("Failed to post reply. Try again.")
    }
  }

  // A minimal profanity list
  const PROFANITY_WORDS = ["fuck", "shit", "bitch", "asshole"]
  function checkForProfanity(text: string) {
    const lower = text.toLowerCase()
    return PROFANITY_WORDS.some((word) => lower.includes(word))
  }

  // Utility: Render each solution + replies
  function renderSolution(solution: Solution) {
    return (
      <SolutionItem
        key={solution.id}
        solution={solution}
        onLike={() => handleLike(solution.id)}
        onReply={handleReply}
      />
    )
  }

  // Render
  if (error) {
    return <p className="text-red-500 text-sm">{error}</p>
  }

  return (
    <div className="space-y-6">
      {/* If user not authenticated => just show existing solutions + a login prompt */}
      {(!session || session === null) && (
        <div className="text-sm text-gray-600 mb-4">
          You must be logged in to post new solutions or replies.
          <Button variant="link" onClick={() => signIn()} className="ml-2 text-blue-600">
            Log In
          </Button>
        </div>
      )}

      {/* If user is logged in => show the editor for top-level solutions */}
      {session && (
        <div>
          <p className="font-medium text-sm mb-2">Share a new solution:</p>
          {editorError && <p className="text-red-500 text-xs mb-2">{editorError}</p>}
          {topLevelEditor && (
            <div className="border rounded-md p-2">
              {/* Toolbars */}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => topLevelEditor.chain().focus().toggleBold().run()}
                  className={topLevelEditor.isActive("bold") ? "bg-muted" : ""}
                >
                  <Bold className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => topLevelEditor.chain().focus().toggleItalic().run()}
                  className={topLevelEditor.isActive("italic") ? "bg-muted" : ""}
                >
                  <Italic className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => topLevelEditor.chain().focus().toggleHeading({ level: 1 }).run()}
                  className={topLevelEditor.isActive("heading", { level: 1 }) ? "bg-muted" : ""}
                >
                  <Heading1 className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => topLevelEditor.chain().focus().toggleHeading({ level: 2 }).run()}
                  className={topLevelEditor.isActive("heading", { level: 2 }) ? "bg-muted" : ""}
                >
                  <Heading2 className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => topLevelEditor.chain().focus().toggleBulletList().run()}
                  className={topLevelEditor.isActive("bulletList") ? "bg-muted" : ""}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => topLevelEditor.chain().focus().toggleOrderedList().run()}
                  className={topLevelEditor.isActive("orderedList") ? "bg-muted" : ""}
                >
                  <ListOrdered className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => topLevelEditor.chain().focus().toggleCode().run()}
                  className={topLevelEditor.isActive("code") ? "bg-muted" : ""}
                >
                  <Code className="h-4 w-4" />
                </Button>
              </div>

              {/* EditorContent */}
              <EditorContent editor={topLevelEditor} />

              {/* Submit button */}
              <div className="flex justify-end mt-2">
                <Button
                  onClick={handleSubmitTopLevel}
                  className="font-light tracking-tight border-blue-800 bg-blue-100 text-blue-600 hover:bg-blue-200"
                >
                  Submit
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Show existing solutions */}
      <div className="space-y-4">
        {solutions.map((sol) => renderSolution(sol))}
      </div>
    </div>
  )
}

// A single solution item with nested replies
function SolutionItem({
  solution,
  onLike,
  onReply,
}: {
  solution: Solution
  onLike: () => void
  onReply: (parentId: string, content: string) => void
}) {
  const { data: session } = useSession()
  const [replyOpen, setReplyOpen] = useState(false)
  const [replyContent, setReplyContent] = useState("")
  const [replyError, setReplyError] = useState("")

  const handleReplySubmit = () => {
    if (!session) {
      alert("You must be logged in to reply.")
      return
    }
    if (!replyContent.trim()) {
      setReplyError("Cannot post an empty reply.")
      return
    }
    // profanity check
    if (checkForProfanity(replyContent)) {
      setReplyError("Please remove offensive language.")
      return
    }
    onReply(solution.id, replyContent)
    setReplyContent("")
    setReplyOpen(false)
    setReplyError("")
  }

  return (
    <div className="space-y-2 border-b border-gray-100 pb-4">
      <div className="flex items-center justify-between">
        {/* Author info if needed */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">
            {solution.authorId ? `User ${solution.authorId}` : "Guest"}
          </span>
          <span className="text-xs text-gray-500">
            {formatDistanceToNow(new Date(solution.createdAt), { addSuffix: true })}
          </span>
        </div>

        {/* Like button */}
        <button
          onClick={onLike}
          className="flex items-center space-x-1 text-xs text-gray-500 hover:text-red-500"
        >
          <Heart
            className="w-3 h-3 fill-current"
            color={solution.likes > 0 ? "red" : "currentColor"}
          />
          <span>{solution.likes}</span>
        </button>
      </div>

      {/* Content */}
      <div
        className="prose prose-sm max-w-none font-light tracking-tight"
        dangerouslySetInnerHTML={{ __html: solution.content }}
      />

      {/* Reply button if logged in */}
      {session && (
        <div className="mt-1">
          <Button variant="ghost" size="sm" onClick={() => setReplyOpen(!replyOpen)}>
            {replyOpen ? "Cancel" : "Reply"}
          </Button>
          {replyOpen && (
            <div className="mt-2">
              {replyError && <p className="text-red-500 text-xs mb-2">{replyError}</p>}
              <textarea
                className="w-full border p-2 text-sm rounded-md"
                rows={2}
                placeholder="Write your reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
              />
              <div className="flex justify-end mt-1">
                <Button variant="outline" size="sm" onClick={handleReplySubmit}>
                  Post Reply
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Show nested replies, if any */}
      {solution.replies && solution.replies.length > 0 && (
        <div className="ml-4 mt-2 space-y-2 border-l border-gray-200 pl-4">
          {solution.replies.map((rep) => (
            <SolutionItem
              key={rep.id}
              solution={rep}
              onLike={() => null /* or handle a nested like */}
              onReply={onReply}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// small utility
function checkForProfanity(text: string) {
  const badWords = ["fuck", "shit", "bitch", "asshole"]
  const lower = text.toLowerCase()
  return badWords.some((w) => lower.includes(w))
}
