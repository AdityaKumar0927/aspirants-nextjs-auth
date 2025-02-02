"use client"

import { useState } from "react"
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

export interface Question {
  id: string
  title: string
  content: string
  solutions: Solution[]
}

// --------------------
// AdvancedEditor
// --------------------
interface AdvancedEditorProps {
  onSubmit: (content: string) => void
}
export function AdvancedEditor({ onSubmit }: AdvancedEditorProps) {
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

  const handleSubmit = () => {
    if (editor && editor.getText().trim()) {
      onSubmit(editor.getHTML())
      editor.commands.clearContent()
    }
  }

  if (!editor) {
    return null
  }

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
          Submit Solution
        </Button>
      </div>
    </div>
  )
}

export function SolutionForm({ onSubmit }: { onSubmit: (content: string) => void }) {
  return (
    <div className="space-y-2">
      <AdvancedEditor onSubmit={onSubmit} />
    </div>
  )
}

// A single solution block
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

// The top-level Question “discussion” block
export function Question({
  question,
  onAddSolution,
  onReplySolution,
  onLikeSolution,
}: {
  question: Question
  onAddSolution: (content: string) => void
  onReplySolution: (parentId: string, content: string) => void
  onLikeSolution: (id: string) => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight mb-2">{question.title}</h2>
        <p className="text-sm font-light tracking-tight">{question.content}</p>
      </div>

      <div className="mt-4">
        <h3 className="text-lg font-medium tracking-tight mb-2">Solutions</h3>
        <SolutionForm onSubmit={onAddSolution} />
      </div>

      <div className="space-y-4 mt-4">
        {question.solutions.map((solution) => (
          <Solution
            key={solution.id}
            solution={solution}
            onReply={onReplySolution}
            onLike={onLikeSolution}
          />
        ))}
      </div>
    </div>
  )
}

// Example usage with local state
const initialQuestion: Question = {
  id: "1",
  title: "Implementing an efficient sorting algorithm",
  content:
    "What's the most efficient sorting algorithm for large datasets, and how would you implement it in JavaScript?",
  solutions: [
    {
      id: "1",
      content: `
        <h2>QuickSort for Large Datasets</h2>
        <p>For large datasets, QuickSort is often one of the most efficient sorting algorithms. Example:</p>
        <pre><code>function quickSort(arr) {
  if (arr.length &lt;= 1) {
    return arr;
  }
  const pivot = arr[Math.floor(arr.length / 2)];
  const left = arr.filter(x => x &lt; pivot);
  const middle = arr.filter(x => x === pivot);
  const right = arr.filter(x => x &gt; pivot);
  return [...quickSort(left), ...middle, ...quickSort(right)];
}</code></pre>
        <p>Average time complexity is O(n log n).</p>
      `,
      author: "Algorithm Expert",
      createdAt: "2024-01-23T12:00:00.000Z",
      likes: 15,
      replies: [],
    },
  ],
}

export function QuestionSolutions() {
  const [question, setQuestion] = useState<Question>(initialQuestion)

  const handleAddSolution = (content: string) => {
    // For production, call POST /api/questions/[questionId]/solutions
    const newSolution: Solution = {
      id: Date.now().toString(),
      content,
      author: "You",
      createdAt: new Date().toISOString(),
      likes: 0,
      replies: [],
    }
    setQuestion((prev) => ({
      ...prev,
      solutions: [newSolution, ...prev.solutions],
    }))
  }

  const handleReplySolution = (parentId: string, content: string) => {
    // For production, call POST with { parentId } to create a nested reply
    const newReply: Solution = {
      id: Date.now().toString(),
      content,
      author: "You",
      createdAt: new Date().toISOString(),
      likes: 0,
      replies: [],
    }

    setQuestion((prev) => ({
      ...prev,
      solutions: addReplyToSolution(prev.solutions, parentId, newReply),
    }))
  }

  const handleLikeSolution = (id: string) => {
    // For production, call PATCH { solutionId: id, like: true }
    setQuestion((prev) => ({
      ...prev,
      solutions: likeSolution(prev.solutions, id),
    }))
  }

  const addReplyToSolution = (solutions: Solution[], parentId: string, newReply: Solution): Solution[] => {
    return solutions.map((sol) => {
      if (sol.id === parentId) {
        return {
          ...sol,
          replies: [...sol.replies, newReply],
        }
      }
      if (sol.replies.length > 0) {
        return {
          ...sol,
          replies: addReplyToSolution(sol.replies, parentId, newReply),
        }
      }
      return sol
    })
  }

  const likeSolution = (solutions: Solution[], id: string): Solution[] => {
    return solutions.map((sol) => {
      if (sol.id === id) {
        return { ...sol, likes: sol.likes + 1 }
      }
      if (sol.replies.length > 0) {
        return { ...sol, replies: likeSolution(sol.replies, id) }
      }
      return sol
    })
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-8">
      <Question
        question={question}
        onAddSolution={handleAddSolution}
        onReplySolution={handleReplySolution}
        onLikeSolution={handleLikeSolution}
      />
    </div>
  )
}
