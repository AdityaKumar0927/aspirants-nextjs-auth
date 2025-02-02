"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession, signIn } from "next-auth/react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import { formatDistanceToNow } from "date-fns"

import { toast } from "react-hot-toast"
import Skeleton from "react-loading-skeleton"
import "react-loading-skeleton/dist/skeleton.css"

import { Filter } from "bad-words"

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
  Trash2,
} from "lucide-react"

// Setup profanity filter (optional)
const profanityFilter = new Filter()

interface QuestionSolutionsProps {
  questionId: string
}

// DB solution model
interface Solution {
  id: string
  content: string
  authorId: string | null
  createdAt: string
  likes: number
  parentId: string | null
  replies?: Solution[]
}

export function QuestionSolutions({ questionId }: QuestionSolutionsProps) {
  const { data: session } = useSession()

  const [solutions, setSolutions] = useState<Solution[]>([])
  const [error, setError] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Fetch solutions from our Next.js route
  const fetchSolutions = useCallback(async () => {
    try {
      setIsLoading(true)
      setError("")
      const res = await fetch(`/api/questions/${questionId}/solutions`, {
        method: "GET",
      })
      if (!res.ok) {
        throw new Error("Failed to load solutions")
      }
      const data = await res.json()
      setSolutions(data)
    } catch (err) {
      console.error(err)
      setError("Unable to load solutions.")
    } finally {
      setIsLoading(false)
    }
  }, [questionId])

  useEffect(() => {
    fetchSolutions()
  }, [fetchSolutions])

  // TipTap editor for new top-level solutions
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
    onUpdate: () => {
      // Clear any old errors when editing
      if (editorError) setEditorError("")
    },
  })

  // Submit a new top-level solution
  const handleSubmitTopLevel = async () => {
    if (!topLevelEditor) return
    const text = topLevelEditor.getText().trim()
    if (!text) {
      setEditorError("Please enter some text.")
      return
    }

    // Profanity check
    if (profanityFilter.isProfane(text)) {
      setEditorError("Please remove offensive language.")
      return
    }

    // Get the HTML from the editor
    const html = topLevelEditor.getHTML()

    try {
      // Send to our POST route
      const res = await fetch(`/api/questions/${questionId}/solutions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: html,
          authorId: session?.user?.id || null, // pass the author's ID if needed
          parentId: null,
        }),
      })
      if (!res.ok) {
        throw new Error("Failed to create solution")
      }
      // Clear editor
      topLevelEditor.commands.clearContent()
      toast.success("Solution posted!")
      // Re-fetch solutions
      fetchSolutions()
    } catch (err) {
      console.error(err)
      setEditorError("Failed to post solution. Try again.")
      toast.error("Failed to post solution.")
    }
  }

  // Like a solution (PATCH route)
  const handleLike = async (solutionId: string) => {
    if (!session) {
      toast.error("You must be logged in to like a solution.")
      return
    }

    // Optimistic UI update
    setSolutions((prev) =>
      prev.map((sol) =>
        sol.id === solutionId ? { ...sol, likes: sol.likes + 1 } : sol
      )
    )

    try {
      const res = await fetch(`/api/questions/${questionId}/solutions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ solutionId, like: true }),
      })
      if (!res.ok) {
        throw new Error("Failed to like solution")
      }
      toast.success("Liked!")
    } catch (err) {
      console.error(err)
      // Revert if error
      setSolutions((prev) =>
        prev.map((sol) =>
          sol.id === solutionId ? { ...sol, likes: sol.likes - 1 } : sol
        )
      )
      toast.error("Failed to like solution.")
    }
  }

  // Delete a solution (DELETE route)
  const handleDelete = async (solutionId: string) => {
    if (!session) {
      toast.error("You must be logged in to delete a solution.")
      return
    }

    // Optimistic UI removal
    const oldSolutions = [...solutions]
    setSolutions((prev) => prev.filter((sol) => sol.id !== solutionId))

    try {
      const res = await fetch(`/api/questions/${questionId}/solutions`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ solutionId }),
      })
      if (!res.ok) {
        throw new Error("Failed to delete solution")
      }
      toast.success("Solution deleted!")
    } catch (err) {
      console.error(err)
      toast.error("Failed to delete solution.")
      // Revert
      setSolutions(oldSolutions)
    }
  }

  // Reply logic
  const handleReply = async (parentId: string, content: string) => {
    if (!session) {
      toast.error("You must be logged in to reply.")
      return
    }
    if (!content.trim()) {
      toast.error("Reply cannot be empty.")
      return
    }
    if (profanityFilter.isProfane(content)) {
      toast.error("Please remove offensive language.")
      return
    }

    try {
      const res = await fetch(`/api/questions/${questionId}/solutions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          parentId,
          authorId: session?.user?.id || null,
        }),
      })
      if (!res.ok) {
        throw new Error("Failed to create reply.")
      }
      toast.success("Reply posted!")
      fetchSolutions()
    } catch (err) {
      console.error(err)
      toast.error("Failed to post reply.")
    }
  }

  // Render
  return (
    <div className="space-y-6">
      {/* If user not authenticated => just show existing solutions + a login prompt */}
      {!session && (
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
                  className="border
                            border-blue-400
                            bg-blue-50
                            text-blue-800
                            px-4 py-1
                            hover:bg-blue-100
                            rounded-sm"
                >
                  Submit
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Show existing solutions */}
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {isLoading ? (
        // Loading skeletons
        <div className="space-y-4">
          <Skeleton count={3} height={60} />
        </div>
      ) : (
        <div className="space-y-4">
          {solutions.map((sol) => (
            <SolutionItem
              key={sol.id}
              solution={sol}
              onLike={() => handleLike(sol.id)}
              onReply={handleReply}
              onDelete={() => handleDelete(sol.id)}
              currentUserId={session?.user?.id} // used to check if user can delete
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */

function SolutionItem({
  solution,
  onLike,
  onReply,
  onDelete,
  currentUserId,
}: {
  solution: Solution
  onLike: () => void
  onReply: (parentId: string, content: string) => void
  onDelete: () => void
  currentUserId?: string
}) {
  const { data: session } = useSession()
  const [replyOpen, setReplyOpen] = useState(false)
  const [replyContent, setReplyContent] = useState("")

  // Check if current user is the author (for showing delete button)
  const canDelete = currentUserId && solution.authorId === currentUserId

  const handleReplySubmit = () => {
    if (!session) {
      toast.error("You must be logged in to reply.")
      return
    }
    if (!replyContent.trim()) {
      toast.error("Cannot post an empty reply.")
      return
    }
    if (profanityFilter.isProfane(replyContent)) {
      toast.error("Please remove offensive language.")
      return
    }
    onReply(solution.id, replyContent)
    setReplyContent("")
    setReplyOpen(false)
  }

  return (
    <div className="space-y-2 border-b border-gray-100 pb-4">
      <div className="flex items-center justify-between">
        {/* Author info */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">
            {solution.authorId ? `User ${solution.authorId}` : "Guest"}
          </span>
          <span className="text-xs text-gray-500">
            {formatDistanceToNow(new Date(solution.createdAt), { addSuffix: true })}
          </span>
        </div>

        <div className="flex space-x-2">
          {/* Like button */}
          <button
            onClick={onLike}
            className="flex items-center space-x-1 text-xs text-gray-500 hover:text-red-500"
          >
            <Heart
              className="w-3 h-3"
              // If likes > 0, fill the heart (your choice of styling)
              color={solution.likes > 0 ? "red" : "currentColor"}
              fill={solution.likes > 0 ? "red" : "none"}
            />
            <span>{solution.likes}</span>
          </button>

          {/* Delete button if user can delete */}
          {canDelete && (
            <button
              onClick={onDelete}
              className="flex items-center space-x-1 text-xs text-gray-500 hover:text-red-500"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
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

      {/* Nested replies */}
      {solution.replies && solution.replies.length > 0 && (
        <div className="ml-4 mt-2 space-y-2 border-l border-gray-200 pl-4">
          {solution.replies.map((rep) => (
            <SolutionItem
              key={rep.id}
              solution={rep}
              onLike={() => {
                /* For nested replies, handle similarly if you want nested likes */
              }}
              onReply={onReply}
              onDelete={() => {
                /* For nested replies, you'd pass a function or handle it similarly */
              }}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
    </div>
  )
}
