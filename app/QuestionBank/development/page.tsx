"use client"

import { useState, useEffect } from 'react'
import { Upload, FileText, ImageIcon, Paperclip, FolderIcon, PlusIcon, BookIcon, CodeIcon, GitBranchIcon, EyeIcon, TerminalIcon, UndoIcon, RedoIcon, CopyIcon, ThumbsUpIcon, ThumbsDownIcon } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { useToast } from "@/components/ui/use-toast"
import { SparklesIcon } from '@heroicons/react/24/solid'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

interface Question {
  questionId: string;
  exam: string;
  text: string;
  subject: string;
  topic: string;
  subtopic: string;
  difficulty: string;
  type: string;
  year: number;
  reviewed: boolean;
  completed: boolean;
  options: string[];
  correctOption: string;
  markscheme: string;
  notes: string[];
  lastAttempted?: Date;
  diagramUrl?: string;
  status: string;
  marks?: number;
  needsReview?: boolean;
  categories?: string[];
}

interface Project {
  id: string;
  name: string;
  type: 'question_bank' | 'exam';
}

const initialProjects: Project[] = [
  { id: '1', name: 'JEE Mains 2023', type: 'exam' },
  { id: '2', name: 'NEET Biology', type: 'question_bank' },
]

const initialQuestions: Question[] = [
  {
    questionId: '1',
    exam: 'JEE Mains 2023',
    text: 'What is the value of g (acceleration due to gravity) on Earth?',
    subject: 'Physics',
    topic: 'Mechanics',
    subtopic: 'Gravity',
    difficulty: 'Easy',
    type: 'Multiple Choice',
    year: 2023,
    reviewed: true,
    completed: true,
    options: ['9.8 m/s²', '10 m/s²', '8.9 m/s²', '11 m/s²'],
    correctOption: '9.8 m/s²',
    markscheme: 'The correct answer is 9.8 m/s². This is the standard value used for calculations involving gravity on Earth.',
    notes: ['Remember: g ≈ 9.8 m/s²', 'This value can vary slightly depending on location'],
    status: 'ACTIVE',
    marks: 1,
  },
  {
    questionId: '2',
    exam: 'NEET Biology',
    text: 'Which organelle is known as the powerhouse of the cell?',
    subject: 'Biology',
    topic: 'Cell Biology',
    subtopic: 'Cell Organelles',
    difficulty: 'Easy',
    type: 'Multiple Choice',
    year: 2023,
    reviewed: true,
    completed: true,
    options: ['Mitochondria', 'Nucleus', 'Ribosome', 'Golgi Apparatus'],
    correctOption: 'Mitochondria',
    markscheme: 'The correct answer is Mitochondria. They are responsible for cellular respiration and ATP production.',
    notes: ['Key function: ATP production', 'Remember the unique double membrane structure'],
    status: 'ACTIVE',
    marks: 1,
  },
]

export default function QuestionBankManager() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [files, setFiles] = useState<FileList | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [newCategory, setNewCategory] = useState('')
  const [customCategories, setCustomCategories] = useState<string[]>(['Important', 'Review Needed', 'Difficult'])
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [mode, setMode] = useState<'edit' | 'create'>('edit')
  const { toast } = useToast()
  const [inputValue, setInputValue] = useState('')

  useEffect(() => {
    // Simulate API call to fetch projects
    const fetchProjects = () => {
      setLoading(true)
      setTimeout(() => {
        setProjects(initialProjects)
        setLoading(false)
      }, 1000)
    }

    fetchProjects()
  }, [])

  const fetchQuestions = (projectId: string) => {
    setLoading(true)
    // Simulate API call to fetch questions
    setTimeout(() => {
      setQuestions(initialQuestions.filter(q => q.exam === projects.find(p => p.id === projectId)?.name))
      setLoading(false)
    }, 1000)
  }

  const handleProjectSelect = (projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    setSelectedProject(project || null)
    if (project) {
      fetchQuestions(project.id)
    }
  }

  const handleCreateProject = (name: string, type: 'question_bank' | 'exam') => {
    const newProject: Project = {
      id: (projects.length + 1).toString(),
      name,
      type,
    }
    setProjects([...projects, newProject])
    setSelectedProject(newProject)
    toast({
      title: "Success",
      description: "Project created successfully.",
    })
  }

  const handleQuestionSelect = (questionId: string) => {
    const question = questions.find(q => q.questionId === questionId)
    setSelectedQuestion(question || null)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!selectedQuestion) return
    setSelectedQuestion({
      ...selectedQuestion,
      [e.target.name]: e.target.value
    })
  }

  const handleOptionChange = (index: number, value: string) => {
    if (!selectedQuestion) return
    const newOptions = [...selectedQuestion.options]
    newOptions[index] = value
    setSelectedQuestion({
      ...selectedQuestion,
      options: newOptions
    })
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedQuestion) return
    setSelectedQuestion({
      ...selectedQuestion,
      [e.target.name]: e.target.checked
    })
  }

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!selectedQuestion) return
    const categories = Array.from(e.target.selectedOptions, option => option.value)
    setSelectedQuestion({
      ...selectedQuestion,
      categories
    })
  }

  const handleAddCategory = () => {
    if (newCategory && !customCategories.includes(newCategory)) {
      setCustomCategories([...customCategories, newCategory])
      setNewCategory('')
    }
  }

  const handleSave = () => {
    if (!selectedQuestion || !selectedProject) return
    setSaving(true)
    // Simulate API call to save question
    setTimeout(() => {
      if (selectedQuestion.questionId) {
        setQuestions(questions.map(q => q.questionId === selectedQuestion.questionId ? selectedQuestion : q))
      } else {
        const newQuestion = {
          ...selectedQuestion,
          questionId: (questions.length + 1).toString(),
          exam: selectedProject.name,
        }
        setQuestions([...questions, newQuestion])
      }
      toast({
        title: "Success",
        description: "Question saved successfully.",
      })
      setSelectedQuestion(null)
      setSaving(false)
    }, 1000)
  }

  const handleDelete = (questionId: string) => {
    if (!selectedProject) return
    // Simulate API call to delete question
    setTimeout(() => {
      setQuestions(questions.filter(q => q.questionId !== questionId))
      toast({
        title: "Success",
        description: "Question deleted successfully.",
      })
    }, 1000)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(e.target.files)
      // Preview for the first image
      const file = e.target.files[0]
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onloadend = () => {
          setPreview(reader.result as string)
        }
        reader.readAsDataURL(file)
      } else {
        setPreview(null)
      }
    }
  }

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault()
    if (!files || !selectedProject) return

    setUploading(true)
    // Simulate file upload and processing
    setTimeout(() => {
      toast({
        title: "Success",
        description: "Files uploaded and processed successfully.",
      })
      setFiles(null)
      setPreview(null)
      setUploading(false)
    }, 2000)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton height={50} />
        <Skeleton count={5} />
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Question Bank Manager</CardTitle>
            <CardDescription>Manage your custom questions and question banks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Select a Project</Label>
                <Select onValueChange={handleProjectSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name} ({project.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Create a New Project</Label>
                <div className="flex space-x-2">
                  <Input placeholder="Project Name" value={inputValue} onChange={(e) => setInputValue(e.target.value)} />
                  <Select onValueChange={(value) => handleCreateProject(inputValue, value as 'question_bank' | 'exam')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Project Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="question_bank">Question Bank</SelectItem>
                      <SelectItem value="exam">Exam</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={() => handleCreateProject(inputValue, 'question_bank')}>Create</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {selectedProject && (
          <Card>
            <CardHeader>
              <CardTitle>{selectedProject.name}</CardTitle>
              <CardDescription>{selectedProject.type === 'question_bank' ? 'Question Bank' : 'Exam'}</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={mode} onValueChange={(value) => setMode(value as 'edit' | 'create')}>
                <TabsList>
                  <TabsTrigger value="edit">Edit Existing Questions</TabsTrigger>
                  <TabsTrigger value="create">Create New Question</TabsTrigger>
                </TabsList>
                <TabsContent value="edit">
                  <Select onValueChange={handleQuestionSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a question" />
                    </SelectTrigger>
                    <SelectContent>
                      {questions.map((question) => (
                        <SelectItem key={question.questionId} value={question.questionId}>
                          {question.exam} - {question.subject}: {question.text.substring(0, 50)}...
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TabsContent>
                <TabsContent value="create">
                  <Button onClick={() => setSelectedQuestion({} as Question)}>Create New Question</Button>
                </TabsContent>
              </Tabs>
              {selectedQuestion && (
                <QuestionForm
                  question={selectedQuestion}
                  customCategories={customCategories}
                  onInputChange={handleInputChange}
                  onOptionChange={handleOptionChange}
                  onCheckboxChange={handleCheckboxChange}
                  onCategoryChange={handleCategoryChange}
                />
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={handleSave} disabled={saving || !selectedQuestion} className="mr-2">
                {saving ? 'Saving...' : 'Save Question'}
              </Button>
              {selectedQuestion && selectedQuestion.questionId && (
                <Button onClick={() => handleDelete(selectedQuestion.questionId)} variant="destructive">
                  Delete Question
                </Button>
              )}
            </CardFooter>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Upload Questions</CardTitle>
            <CardDescription>
              Upload handwritten questions, PDFs, or images. Our AI will automatically parse and categorize them.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Exam Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select exam type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="jee">JEE</SelectItem>
                    <SelectItem value="neet">NEET</SelectItem>
                    <SelectItem value="gate">GATE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Subject</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mathematics">Mathematics</SelectItem>
                    <SelectItem value="physics">Physics</SelectItem>
                    <SelectItem value="chemistry">Chemistry</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center">
              <Input
                type="file"
                className="hidden"
                id="file-upload"
                onChange={handleFileChange}
                multiple
                accept=".pdf,image/*"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload className="h-12 w-12 text-gray-500 mb-4" />
                <p className="text-sm text-gray-600 mb-1">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">PDF, PNG, JPG or JPEG (MAX. 10MB)</p>
              </label>
            </div>

            {preview && (
              <div>
                <Label>Preview</Label>
                <div className="mt-2 relative aspect-video">
                  <img
                    src={preview}
                    alt="Upload preview"
                    className="rounded-lg object-contain w-full h-full"
                  />
                </div>
              </div>
            )}

            {files && Array.from(files).map((file, index) => (
              <div
                key={index}
                className="flex items-center p-2 bg-gray-100 rounded-lg"
              >
                {file.type.startsWith('image/') ? (
                  <ImageIcon className="w-4 h-4 mr-2 text-gray-600" />
                ) : (
                  <FileText className="w-4 h-4 mr-2 text-gray-600" />
                )}
                <span className="text-sm text-gray-700">{file.name}</span>
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              onClick={handleUpload}
              disabled={!files || uploading || !selectedProject}
            >
              {uploading ? 'Uploading...' : 'Upload and Process'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </TooltipProvider>
  )
}

function QuestionForm({ question, customCategories, onInputChange, onOptionChange, onCheckboxChange, onCategoryChange }: QuestionFormProps) {
  if (!question) return null;

  return (
    <div className="space-y-4">
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <Label htmlFor="exam">Exam Name</Label>
            <Input
              id="exam"
              name="exam"
              value={question.exam}
              onChange={onInputChange}
              placeholder="Enter exam name"
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>Enter the name of the exam</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <Label htmlFor="text">Question Text</Label>
            <Textarea
              id="text"
              name="text"
              value={question.text}
              onChange={onInputChange}
              placeholder="Enter question text"
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>Enter the full text of the question</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              name="subject"
              value={question.subject}
              onChange={onInputChange}
              placeholder="Enter subject"
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>Enter the subject of the question</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <Label htmlFor="topic">Topic</Label>
            <Input
              id="topic"
              name="topic"
              value={question.topic}
              onChange={onInputChange}
              placeholder="Enter topic"
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>Enter the main topic of the question</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <Label htmlFor="subtopic">Subtopic</Label>
            <Input
              id="subtopic"
              name="subtopic"
              value={question.subtopic}
              onChange={onInputChange}
              placeholder="Enter subtopic"
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>Enter the subtopic of the question</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <Label htmlFor="difficulty">Difficulty</Label>
            <Select name="difficulty" value={question.difficulty} onValueChange={(value) => onInputChange({ target: { name: 'difficulty', value } } as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Easy">Easy</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </TooltipTrigger>
        <TooltipContent>Select the difficulty level of the question</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <Label htmlFor="type">Question Type</Label>
            <Select name="type" value={question.type} onValueChange={(value) => onInputChange({ target: { name: 'type', value } } as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Multiple Choice">Multiple Choice</SelectItem>
                <SelectItem value="Numerical">Numerical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </TooltipTrigger>
        <TooltipContent>Select the type of question</TooltipContent>
      </Tooltip>
      {question.type === 'Multiple Choice' && (
        <div>
          <Label>Options</Label>
          {question.options.map((option, index) => (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <Input
                  value={option}
                  onChange={(e) => onOptionChange(index, e.target.value)}
                  className="mt-2"
                  placeholder={`Option ${index + 1}`}
                />
              </TooltipTrigger>
              <TooltipContent>Enter option {index + 1}</TooltipContent>
            </Tooltip>
          ))}
          <Button
            onClick={() => onOptionChange(question.options.length, '')}
            className="mt-2"
          >
            Add Option
          </Button>
        </div>
      )}
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <Label htmlFor="correctOption">Correct Option</Label>
            <Input
              id="correctOption"
              name="correctOption"
              value={question.correctOption}
              onChange={onInputChange}
              placeholder="Enter correct option"
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>Enter the correct answer or option</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <Label htmlFor="markscheme">Markscheme</Label>
            <Textarea
              id="markscheme"
              name="markscheme"
              value={question.markscheme}
              onChange={onInputChange}
              placeholder="Enter markscheme"
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>Enter the marking scheme for this question</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <Label htmlFor="year">Year</Label>
            <Input
              id="year"
              name="year"
              type="number"
              value={question.year}
              onChange={onInputChange}
              placeholder="Enter year"
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>Enter the year this question was created</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <Label htmlFor="reviewed">Reviewed</Label>
            <Checkbox
              id="reviewed"
              name="reviewed"
              checked={question.reviewed}
              onCheckedChange={(checked) => onCheckboxChange({ target: { name: 'reviewed', checked } } as any)}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>Mark if the question has been reviewed</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <Label htmlFor="completed">Completed</Label>
            <Checkbox
              id="completed"
              name="completed"
              checked={question.completed}
              onCheckedChange={(checked) => onCheckboxChange({ target: { name: 'completed', checked } } as any)}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>Mark if the question has been completed</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              value={question.notes.join('\n')}
              onChange={(e) => onInputChange({ target: { name: 'notes', value: e.target.value.split('\n') } } as any)}
              placeholder="Enter notes (one per line)"
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>Enter notes for this question</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <Label htmlFor="lastAttempted">Last Attempted</Label>
            <Input
              id="lastAttempted"
              name="lastAttempted"
              type="date"
              value={question.lastAttempted ? new Date(question.lastAttempted).toISOString().split('T')[0] : ''}
              onChange={onInputChange}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>Enter the date when this question was last attempted</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <Label htmlFor="diagramUrl">Diagram URL</Label>
            <Input
              id="diagramUrl"
              name="diagramUrl"
              value={question.diagramUrl || ''}
              onChange={onInputChange}
              placeholder="Enter diagram URL"
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>Enter the URL for the question diagram</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select name="status" value={question.status} onValueChange={(value) => onInputChange({ target: { name: 'status', value } } as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="REVIEW">Review</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </TooltipTrigger>
        <TooltipContent>Select the status of the question</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <Label htmlFor="marks">Marks</Label>
            <Input
              id="marks"
              name="marks"
              type="number"
              value={question.marks}
              onChange={onInputChange}
              placeholder="Enter marks"
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>Enter the number of marks for this question</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <Label htmlFor="categories">Categories</Label>
            <select
              id="categories"
              multiple
              value={question.categories}
              onChange={onCategoryChange}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              {customCategories.map((category, index) => (
                <option key={index} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </TooltipTrigger>
        <TooltipContent>Select relevant categories for this question</TooltipContent>
      </Tooltip>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="needsReview"
          name="needsReview"
          checked={question.needsReview}
          onCheckedChange={(checked) => onCheckboxChange({ target: { name: 'needsReview', checked } } as any)}
        />
        <Label htmlFor="needsReview">Needs Review</Label>
      </div>
    </div>
  )
}

export interface QuestionFormProps {
  question: Question;
  customCategories: string[];
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onOptionChange: (index: number, value: string) => void;
  onCheckboxChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCategoryChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

