"use client"

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  ChangeEvent,
} from "react"

// -----------------------------------------------------------------------------
// 1. Type Definitions
// -----------------------------------------------------------------------------
type QuestionType = {
  id: string
  exam: string
  year: string
  subject: string
  topic: string | null
  type: "mcq" | "mcqm" | "integer" | string
  questionHTML: string
  explanationHTML?: string
  options: string[]           // MCQ / MCQM options
  correctAnswers: string[]    // Single-correct => length=1; multi-correct => length>1
  numericValue?: number       // For exact integer/float answers
  numericRange?: [number, number] // For min-max range answers
  marks: number
  negMarks: number
}

type ExamResultsType = {
  totalQuestions: number
  correctAnswersCount: number
  incorrectAnswers: number
  score: number
  // Additional analytics as needed:
  userAnswers: (string | string[] | null)[]
  correctAnswers: string[]
  // For advanced analytics:
  averageTimePerQuestion?: number
  timeSpentPerQuestion?: number[]
}

// For convenience: statuses for how the user has interacted with each question
type QuestionStatus = "notVisited" | "notAnswered" | "answered" | "markedForReview"

// -----------------------------------------------------------------------------
// 2. Helper to parse the new JSON question structure
// -----------------------------------------------------------------------------
function parseQuestionObject(rawQ: any): QuestionType {
  const qEn = rawQ?.question?.en || {}
  const questionType = rawQ.type

  let correctAnswers: string[] = []
  let numericValue: number | undefined
  let numericRange: [number, number] | undefined

  // For MCQ or MCQM, correct_options is an array
  if (questionType === "mcq" || questionType === "mcqm") {
    correctAnswers = qEn.correct_options ?? []
  }
  // For numeric (integer) questions, the answer is in qEn.answer
  else if (questionType === "integer") {
    const ansStr = (qEn.answer || "").trim()
    // Check if answer is a range string like "-13540to-13537"
    if (ansStr.includes("to")) {
      const [low, high] = ansStr.split("to").map((s: string) => s.trim())
      numericRange = [parseFloat(low), parseFloat(high)]
    } else {
      numericValue = parseFloat(ansStr)
    }
  }

  return {
    id: rawQ.question_id,
    exam: rawQ.exam || "",
    year: rawQ.yearKey || String(rawQ.year || ""),
    subject: rawQ.subject || "",
    topic: rawQ.topic || null,
    type: questionType,
    questionHTML: qEn.content || "",
    explanationHTML: qEn.explanation || "",
    options: qEn.options || [],
    correctAnswers,
    numericValue,
    numericRange,
    marks: rawQ.marks ?? 4,
    negMarks: rawQ.negMarks ?? 0,
  }
}

// -----------------------------------------------------------------------------
// 3. Helper: check correctness
// -----------------------------------------------------------------------------
function isUserAnswerCorrect(
  question: QuestionType,
  userAnswer: string | string[] | null
): boolean {
  if (userAnswer == null) return false

  switch (question.type) {
    case "mcq":
      // Single-correct => userAnswer is e.g. "A"
      return userAnswer === question.correctAnswers[0]

    case "mcqm":
      // Multi-correct => userAnswer is array
      if (!Array.isArray(userAnswer)) return false
      if (userAnswer.length !== question.correctAnswers.length) return false
      return question.correctAnswers.every((opt) => userAnswer.includes(opt))

    case "integer":
      // Numeric => parse the user’s string
      const userNum = parseFloat(userAnswer as string)
      if (isNaN(userNum)) return false
      if (question.numericRange) {
        const [low, high] = question.numericRange
        return userNum >= low && userNum <= high
      } else if (typeof question.numericValue === "number") {
        return userNum === question.numericValue
      }
      return false

    default:
      return false
  }
}

// -----------------------------------------------------------------------------
// 4. SUBCOMPONENTS: We'll define them inline. Real code might separate them.
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// 4A. ExamSetup subcomponent
// -----------------------------------------------------------------------------
function ExamSetup({
  exams,
  subjects,
  years,
  selectedExam,
  selectedSubject,
  selectedYear,
  examMode,
  numberOfQuestions,
  examTime,
  onExamModeChange,
  onExamChange,
  onSubjectChange,
  onYearChange,
  onNumberOfQuestionsChange,
  onExamTimeChange,
  onStartExam,
}: {
  exams: string[]
  subjects: string[]
  years: string[]
  selectedExam: string
  selectedSubject: string
  selectedYear: string
  examMode: "past" | "custom"
  numberOfQuestions: number
  examTime: number
  onExamModeChange: (mode: "past" | "custom") => void
  onExamChange: (val: string) => void
  onSubjectChange: (val: string) => void
  onYearChange: (val: string) => void
  onNumberOfQuestionsChange: (val: number) => void
  onExamTimeChange: (val: number) => void
  onStartExam: () => void
}) {
  return (
    <div style={{ margin: 20 }}>
      <h1>Mock Exam Setup</h1>

      <div style={{ marginBottom: 10 }}>
        <label style={{ display: "block" }}>Exam Mode:</label>
        <select
          value={examMode}
          onChange={(e) =>
            onExamModeChange(e.target.value === "past" ? "past" : "custom")
          }
        >
          <option value="past">Past Paper Mode (Full 1hr, all questions)</option>
          <option value="custom">Custom (pick # of Qs, time, etc.)</option>
        </select>
      </div>

      <div style={{ marginBottom: 10 }}>
        <label style={{ display: "block" }}>Exam:</label>
        <select value={selectedExam} onChange={(e) => onExamChange(e.target.value)}>
          <option value="">--Select Exam--</option>
          {exams.map((ex) => (
            <option key={ex} value={ex}>
              {ex}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: 10 }}>
        <label style={{ display: "block" }}>Subject:</label>
        <select
          value={selectedSubject}
          onChange={(e) => onSubjectChange(e.target.value)}
        >
          <option value="">--Select Subject--</option>
          {subjects.map((sub) => (
            <option key={sub} value={sub}>
              {sub}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: 10 }}>
        <label style={{ display: "block" }}>Year/Paper:</label>
        <select value={selectedYear} onChange={(e) => onYearChange(e.target.value)}>
          <option value="">--Select Year/Paper--</option>
          {years.map((yr) => (
            <option key={yr} value={yr}>
              {yr}
            </option>
          ))}
        </select>
      </div>

      {examMode === "custom" && (
        <>
          <div style={{ marginBottom: 10 }}>
            <label style={{ display: "block" }}>Number of Questions:</label>
            <input
              type="number"
              value={numberOfQuestions}
              onChange={(e) => onNumberOfQuestionsChange(Number(e.target.value))}
            />
          </div>

          <div style={{ marginBottom: 10 }}>
            <label style={{ display: "block" }}>Exam Time (minutes):</label>
            <input
              type="number"
              value={examTime}
              onChange={(e) => onExamTimeChange(Number(e.target.value))}
            />
          </div>
        </>
      )}

      <button onClick={onStartExam} style={{ marginTop: 15 }}>
        Start Exam
      </button>
    </div>
  )
}

// -----------------------------------------------------------------------------
// 4B. Exam subcomponent
// -----------------------------------------------------------------------------
function Exam({
  currentQuestion,
  filteredQuestions,
  answers,
  questionStatuses,
  questionStatusCounts,
  examTimeLeft,
  onAnswer,
  onNext,
  onPrevious,
  onClear,
  onReviewAndNext,
  onSaveAndNext,
  onSubmit,
  onExit,
  onNavigate,
  userName,
  selectedSubject,
  selectedYear,
}: {
  currentQuestion: number
  filteredQuestions: QuestionType[]
  answers: (string | string[] | null)[]
  questionStatuses: { [index: number]: QuestionStatus }
  questionStatusCounts: {
    notVisited: number
    notAnswered: number
    answered: number
    markedForReview: number
  }
  examTimeLeft: number
  onAnswer: (answer: string | string[]) => void
  onNext: () => void
  onPrevious: () => void
  onClear: () => void
  onReviewAndNext: () => void
  onSaveAndNext: () => void
  onSubmit: () => void
  onExit: () => void
  onNavigate: (index: number) => void
  userName: string
  selectedSubject: string
  selectedYear: string
}) {
  if (!filteredQuestions.length) {
    return <div>No questions available.</div>
  }

  const question = filteredQuestions[currentQuestion]
  const userAnswer = answers[currentQuestion]

  const formatTime = (seconds: number) => {
    const mm = Math.floor(seconds / 60)
    const ss = seconds % 60
    return `${mm.toString().padStart(2, "0")}:${ss
      .toString()
      .padStart(2, "0")}`
  }

  // Handle single correct MCQ
  const handleSelectMCQOption = (opt: string) => {
    onAnswer(opt)
  }

  // Handle multiple correct MCQ
  const handleToggleMCQMOption = (opt: string) => {
    let arr = Array.isArray(userAnswer) ? [...userAnswer] : []
    if (arr.includes(opt)) {
      arr = arr.filter((x) => x !== opt)
    } else {
      arr.push(opt)
    }
    onAnswer(arr)
  }

  // Handle numeric
  const handleNumericChange = (e: ChangeEvent<HTMLInputElement>) => {
    onAnswer(e.target.value)
  }

  return (
    <div style={{ padding: 20 }}>
      <div style={{ marginBottom: 10 }}>
        <h2>Welcome, {userName}</h2>
        <p>
          Subject: {selectedSubject}, Paper: {selectedYear}
        </p>
        <p>Time Left: {formatTime(examTimeLeft)}</p>
        <p>
          Q {currentQuestion + 1}/{filteredQuestions.length}
        </p>
      </div>

      <div
        style={{
          border: "1px solid #ccc",
          padding: 15,
          marginBottom: 15,
          minHeight: 150,
        }}
      >
        {/* Render question HTML */}
        <div
          dangerouslySetInnerHTML={{ __html: question.questionHTML }}
          style={{ marginBottom: 10 }}
        />

        {/* Render different input UI based on question.type */}
        {question.type === "mcq" && (
          <div>
            {question.options.map((opt, idx) => (
              <div key={idx} style={{ marginBottom: 5 }}>
                <label>
                  <input
                    type="radio"
                    name={`q-${question.id}`}
                    checked={userAnswer === opt}
                    onChange={() => handleSelectMCQOption(opt)}
                  />
                  {"  "}
                  {opt}
                </label>
              </div>
            ))}
          </div>
        )}

        {question.type === "mcqm" && (
          <div>
            {question.options.map((opt, idx) => {
              const checked = Array.isArray(userAnswer) && userAnswer.includes(opt)
              return (
                <div key={idx} style={{ marginBottom: 5 }}>
                  <label>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleToggleMCQMOption(opt)}
                    />
                    {"  "}
                    {opt}
                  </label>
                </div>
              )
            })}
          </div>
        )}

        {question.type === "integer" && (
          <div>
            <label>
              Enter Numeric Answer:{" "}
              <input
                type="text"
                value={typeof userAnswer === "string" ? userAnswer : ""}
                onChange={handleNumericChange}
              />
            </label>
          </div>
        )}

        {/* If you have other question types, handle them similarly */}
      </div>

      {/* Buttons for exam navigation */}
      <div style={{ marginBottom: 15 }}>
        <button onClick={onPrevious} disabled={currentQuestion === 0}>
          Previous
        </button>
        <button
          onClick={onNext}
          disabled={currentQuestion === filteredQuestions.length - 1}
          style={{ marginLeft: 10 }}
        >
          Next
        </button>
        <button onClick={onReviewAndNext} style={{ marginLeft: 10 }}>
          Mark for Review &amp; Next
        </button>
        <button onClick={onClear} style={{ marginLeft: 10 }}>
          Clear
        </button>
        <button onClick={onSaveAndNext} style={{ marginLeft: 10 }}>
          Save &amp; Next
        </button>
      </div>

      {/* Display question statuses */}
      <div style={{ marginBottom: 10 }}>
        <p>
          <strong>Status:</strong>
        </p>
        <p>Not Visited: {questionStatusCounts.notVisited}</p>
        <p>Not Answered: {questionStatusCounts.notAnswered}</p>
        <p>Answered: {questionStatusCounts.answered}</p>
        <p>Marked for Review: {questionStatusCounts.markedForReview}</p>
      </div>

      {/* Quick Jump to any question */}
      <div style={{ marginBottom: 10 }}>
        Jump to:
        {filteredQuestions.map((_, idx) => (
          <button
            style={{ marginLeft: 4 }}
            key={idx}
            onClick={() => onNavigate(idx)}
          >
            {idx + 1}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 10 }}>
        <button onClick={() => {
          if (window.confirm("Are you sure you want to submit?")) {
            onSubmit()
          }
        }}>
          Submit Exam
        </button>

        <button onClick={onExit} style={{ marginLeft: 10 }}>
          Exit
        </button>
      </div>
    </div>
  )
}

// -----------------------------------------------------------------------------
// 4C. AdvancedExamResults subcomponent
// -----------------------------------------------------------------------------
function AdvancedExamResults({
  examResults,
  onStartNewExam,
  onExit,
}: {
  examResults: ExamResultsType
  onStartNewExam: () => void
  onExit: () => void
}) {
  const {
    totalQuestions,
    correctAnswersCount,
    incorrectAnswers,
    score,
    userAnswers,
    correctAnswers,
    averageTimePerQuestion,
  } = examResults

  return (
    <div style={{ margin: 20 }}>
      <h1>Exam Results</h1>
      <p>Total Questions: {totalQuestions}</p>
      <p>Correct: {correctAnswersCount}</p>
      <p>Incorrect: {incorrectAnswers}</p>
      <p>Score: {score}</p>
      {averageTimePerQuestion !== undefined && (
        <p>Average Time per Question: {averageTimePerQuestion.toFixed(2)}s</p>
      )}

      <h3>Review Answers:</h3>
      <ul>
        {userAnswers.map((ua, idx) => {
          const ca = correctAnswers[idx]
          return (
            <li key={idx}>
              Q{idx + 1}: Your Answer = {Array.isArray(ua) ? ua.join(",") : ua}
              {" | "}
              Correct = {ca}
            </li>
          )
        })}
      </ul>
      <hr />
      <button onClick={onStartNewExam}>Start New Exam</button>
      <button onClick={onExit} style={{ marginLeft: 10 }}>
        Exit
      </button>
    </div>
  )
}

// -----------------------------------------------------------------------------
// 5. The MAIN MockExam component
// -----------------------------------------------------------------------------
export default function MockExam() {
  // 5A. State
  const [allQuestions, setAllQuestions] = useState<QuestionType[]>([])
  const [filteredQuestions, setFilteredQuestions] = useState<QuestionType[]>([])
  const [exams, setExams] = useState<string[]>([])
  const [subjects, setSubjects] = useState<string[]>([])
  const [years, setYears] = useState<string[]>([])

  const [selectedExam, setSelectedExam] = useState<string>("")
  const [selectedSubject, setSelectedSubject] = useState<string>("")
  const [selectedYear, setSelectedYear] = useState<string>("")

  const [examMode, setExamMode] = useState<"past" | "custom">("past")
  const [numberOfQuestions, setNumberOfQuestions] = useState<number>(10)
  const [examTime, setExamTime] = useState<number>(60)

  const [isLoading, setIsLoading] = useState(true)
  const [isExamStarted, setIsExamStarted] = useState(false)
  const [isExamFinished, setIsExamFinished] = useState(false)

  // The user's selected answers (parallel to filteredQuestions)
  const [answers, setAnswers] = useState<(string | string[] | null)[]>([])
  // Track question statuses
  const [questionStatuses, setQuestionStatuses] = useState<{ [index: number]: QuestionStatus }>({})
  // Current question index
  const [currentQuestion, setCurrentQuestion] = useState(0)
  // Time left in seconds
  const [examTimeLeft, setExamTimeLeft] = useState(3600) // 1hr for "past" mode by default

  const [examResults, setExamResults] = useState<ExamResultsType | null>(null)

  // For tracking time spent per question
  const questionStartTimeRef = useRef<number>(0)
  const [timeSpentPerQuestion, setTimeSpentPerQuestion] = useState<number[]>([])

  // 5B. Fetch new JSON on mount
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const res = await fetch("/api/questions")
        if (!res.ok) throw new Error("Fetch error")
        const data = await res.json()
        const flatQs: QuestionType[] = []
        if (Array.isArray(data.results)) {
          data.results.forEach((block: any) => {
            if (Array.isArray(block.questions)) {
              block.questions.forEach((rawQ: any) => {
                flatQs.push(parseQuestionObject(rawQ))
              })
            }
          })
        }
        setAllQuestions(flatQs)
      } catch (err) {
        console.error(err)
        alert("Failed to fetch questions. See console.")
      } finally {
        setIsLoading(false)
      }
    }
    fetchAll()
  }, [])

  // 5C. Once we have allQuestions, derive the unique exam/subject/year
  useEffect(() => {
    const ex = Array.from(new Set(allQuestions.map((q) => q.exam))).filter(Boolean)
    setExams(ex)
  }, [allQuestions])

  useEffect(() => {
    // If user picks an exam, fill the subjects
    if (selectedExam) {
      const subs = Array.from(
        new Set(
          allQuestions.filter((q) => q.exam === selectedExam).map((qq) => qq.subject)
        )
      )
      setSubjects(subs)
    } else {
      setSubjects([])
    }
    setSelectedSubject("")
    setSelectedYear("")
  }, [selectedExam, allQuestions])

  useEffect(() => {
    // If user picks exam + subject, fill the years
    if (selectedExam && selectedSubject) {
      const yrs = Array.from(
        new Set(
          allQuestions
            .filter((q) => q.exam === selectedExam && q.subject === selectedSubject)
            .map((qq) => qq.year)
        )
      )
      setYears(yrs)
    } else {
      setYears([])
    }
    setSelectedYear("")
  }, [selectedExam, selectedSubject, allQuestions])

  // 5D. Filter final list of questions
  const finalQuestions = useMemo(() => {
    // Filter by exam, subject, year
    const subset = allQuestions.filter(
      (q) =>
        q.exam === selectedExam &&
        q.subject === selectedSubject &&
        q.year === selectedYear
    )
    if (examMode === "past") {
      return subset
    } else {
      // custom => slice to numberOfQuestions
      return subset.slice(0, numberOfQuestions)
    }
  }, [allQuestions, selectedExam, selectedSubject, selectedYear, examMode, numberOfQuestions])

  // Keep that in state
  useEffect(() => {
    setFilteredQuestions(finalQuestions)
  }, [finalQuestions])

  // 5E. Start exam
  const startExam = useCallback(() => {
    if (!filteredQuestions.length) {
      alert("No questions found for given filters.")
      return
    }
    // For "past" mode => 1 hour = 3600s
    // For "custom" => examTime * 60
    setExamTimeLeft(examMode === "past" ? 3600 : examTime * 60)
    setIsExamStarted(true)
    setIsExamFinished(false)
    setExamResults(null)
    setAnswers(new Array(filteredQuestions.length).fill(null))
    setQuestionStatuses({})
    setTimeSpentPerQuestion(new Array(filteredQuestions.length).fill(0))
    setCurrentQuestion(0)
    // Initialize statuses to "notVisited"
    const initialStatuses: { [index: number]: QuestionStatus } = {}
    filteredQuestions.forEach((_, idx) => {
      initialStatuses[idx] = "notVisited"
    })
    setQuestionStatuses(initialStatuses)
    questionStartTimeRef.current = Date.now()
  }, [filteredQuestions, examMode, examTime])

  // 5F. Timer & timeSpent logic
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null
    if (isExamStarted && !isExamFinished) {
      timer = setInterval(() => {
        setExamTimeLeft((prev) => {
          if (prev <= 1) {
            // times up => auto submit
            if (timer) clearInterval(timer)
            updateTimeSpent()
            handleSubmit()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [isExamStarted, isExamFinished])

  // function to update timeSpent for the current question
  const updateTimeSpent = useCallback(() => {
    const timeUsed = Math.floor((Date.now() - questionStartTimeRef.current) / 1000)
    setTimeSpentPerQuestion((prev) => {
      const copy = [...prev]
      copy[currentQuestion] = (copy[currentQuestion] || 0) + timeUsed
      return copy
    })
    questionStartTimeRef.current = Date.now()
  }, [currentQuestion])

  // Every time we change question, update the timeSpent for the old question
  useEffect(() => {
    if (isExamStarted && !isExamFinished) {
      questionStartTimeRef.current = Date.now()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion, isExamStarted])

  // 5G. Actions for "Next", "Previous", etc.
  const handleNavigate = useCallback(
    (index: number) => {
      if (index < 0 || index >= filteredQuestions.length) return
      updateTimeSpent()
      setCurrentQuestion(index)
      // If the new question was "notVisited", set it to "notAnswered"
      setQuestionStatuses((prev) => {
        const copy = { ...prev }
        if (copy[index] === "notVisited") {
          copy[index] = "notAnswered"
        }
        return copy
      })
    },
    [filteredQuestions.length, updateTimeSpent]
  )

  const handleNext = useCallback(() => {
    if (currentQuestion < filteredQuestions.length - 1) {
      handleNavigate(currentQuestion + 1)
    }
  }, [currentQuestion, filteredQuestions.length, handleNavigate])

  const handlePrevious = useCallback(() => {
    if (currentQuestion > 0) {
      handleNavigate(currentQuestion - 1)
    }
  }, [currentQuestion, handleNavigate])

  const handleReviewAndNext = useCallback(() => {
    setQuestionStatuses((prev) => {
      return {
        ...prev,
        [currentQuestion]: "markedForReview",
      }
    })
    handleNext()
  }, [currentQuestion, handleNext])

  const handleClear = useCallback(() => {
    setAnswers((prev) => {
      const arr = [...prev]
      arr[currentQuestion] = null
      return arr
    })
    setQuestionStatuses((prev) => {
      const st = prev[currentQuestion]
      return {
        ...prev,
        [currentQuestion]:
          st === "markedForReview" ? "markedForReview" : "notAnswered",
      }
    })
  }, [currentQuestion])

  const handleAnswer = useCallback(
    (ans: string | string[]) => {
      setAnswers((prev) => {
        const arr = [...prev]
        arr[currentQuestion] = ans
        return arr
      })
      setQuestionStatuses((prev) => {
        const st = prev[currentQuestion]
        // if it was "markedForReview", we keep that
        // else set to "answered"
        if (st === "markedForReview") {
          return prev
        }
        return {
          ...prev,
          [currentQuestion]: "answered",
        }
      })
    },
    [currentQuestion]
  )

  const handleSaveAndNext = useCallback(() => {
    handleNext()
  }, [handleNext])

  // 5H. Computed status counts
  const questionStatusCounts = useMemo(() => {
    const counts = {
      notVisited: 0,
      notAnswered: 0,
      answered: 0,
      markedForReview: 0,
    }
    Object.values(questionStatuses).forEach((st) => {
      if (st === "notVisited") counts.notVisited++
      else if (st === "notAnswered") counts.notAnswered++
      else if (st === "answered") counts.answered++
      else if (st === "markedForReview") counts.markedForReview++
    })
    return counts
  }, [questionStatuses])

  // 5I. handleSubmit => finalize
  const handleSubmit = useCallback(() => {
    if (!filteredQuestions.length) return

    let totalScore = 0
    let correctCount = 0
    let attemptedCount = 0

    filteredQuestions.forEach((q, idx) => {
      const userAns = answers[idx]
      if (userAns !== null) {
        attemptedCount++
        if (isUserAnswerCorrect(q, userAns)) {
          correctCount++
          totalScore += q.marks
        } else {
          totalScore -= q.negMarks
        }
      }
    })

    const incorrectCount = attemptedCount - correctCount
    const score = totalScore

    // finalize the timeSpent for the last question
    updateTimeSpent()

    const totalTimeSpent = timeSpentPerQuestion.reduce((a, b) => a + b, 0)
    const avgTime = totalTimeSpent / filteredQuestions.length

    const res: ExamResultsType = {
      totalQuestions: filteredQuestions.length,
      correctAnswersCount: correctCount,
      incorrectAnswers: incorrectCount,
      score,
      userAnswers: answers,
      correctAnswers: filteredQuestions.map((qq) => {
        // For numeric or multi-correct, let's just store a "joined" representation
        if (qq.type === "mcq" || qq.type === "mcqm") {
          return qq.correctAnswers.join(",")
        }
        if (qq.type === "integer") {
          if (qq.numericRange) {
            return `${qq.numericRange[0]} to ${qq.numericRange[1]}`
          }
          if (qq.numericValue != null) {
            return String(qq.numericValue)
          }
          return ""
        }
        return qq.correctAnswers.join(",")
      }),
      averageTimePerQuestion: avgTime,
      timeSpentPerQuestion,
    }

    setExamResults(res)
    setIsExamFinished(true)
    setIsExamStarted(false)
  }, [answers, filteredQuestions, timeSpentPerQuestion, updateTimeSpent])

  // 5J. exitExam -> prompt to confirm
  const exitExam = () => {
    if (
      window.confirm(
        "Are you sure you want to exit? Your exam progress will be lost."
      )
    ) {
      setIsExamStarted(false)
      setIsExamFinished(false)
      setExamResults(null)
    }
  }

  // 5K. Return the final UI
  if (isLoading) {
    return <div style={{ padding: 20 }}>Loading questions...</div>
  }

  // If exam not started and not finished => show "ExamSetup"
  if (!isExamStarted && !isExamFinished) {
    return (
      <ExamSetup
        exams={exams}
        subjects={subjects}
        years={years}
        selectedExam={selectedExam}
        selectedSubject={selectedSubject}
        selectedYear={selectedYear}
        examMode={examMode}
        numberOfQuestions={numberOfQuestions}
        examTime={examTime}
        onExamModeChange={setExamMode}
        onExamChange={setSelectedExam}
        onSubjectChange={setSelectedSubject}
        onYearChange={setSelectedYear}
        onNumberOfQuestionsChange={setNumberOfQuestions}
        onExamTimeChange={setExamTime}
        onStartExam={startExam}
      />
    )
  }

  // If exam finished => show results
  if (isExamFinished && examResults) {
    return (
      <AdvancedExamResults
        examResults={examResults}
        onStartNewExam={() => {
          setIsExamStarted(false)
          setIsExamFinished(false)
          setExamResults(null)
        }}
        onExit={() => {
          setIsExamStarted(false)
          setIsExamFinished(false)
          setExamResults(null)
        }}
      />
    )
  }

  // Otherwise, exam in progress
  return (
    <Exam
      currentQuestion={currentQuestion}
      filteredQuestions={filteredQuestions}
      answers={answers}
      questionStatuses={questionStatuses}
      questionStatusCounts={questionStatusCounts}
      examTimeLeft={examTimeLeft}
      onAnswer={handleAnswer}
      onNext={handleNext}
      onPrevious={handlePrevious}
      onClear={handleClear}
      onReviewAndNext={handleReviewAndNext}
      onSaveAndNext={handleSaveAndNext}
      onSubmit={handleSubmit}
      onExit={exitExam}
      onNavigate={handleNavigate}
      userName={"Guest User"}
      selectedSubject={selectedSubject}
      selectedYear={selectedYear}
    />
  )
}
