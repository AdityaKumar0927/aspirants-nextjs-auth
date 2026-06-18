/**
 * A small, valid sample lesson — lets a student see the player immediately
 * (and serves as a test fixture) without first running the prompt through an
 * LLM. Matches the contract in lib/keystone/schema.ts, including the auto-graded
 * check formats (mcq/integer/fillblank), the substantial anchor `reveal`, the
 * prerequisite `refresher`, and the on-paper `generative` acts.
 */
const SAMPLE = {
  title: "Newton's Second Law",
  subject: "Physics",
  conceptMap: {
    summary:
      "Force changes motion. We tie force, mass, and acceleration together, derive $F=ma$ from momentum, then apply it.",
    concepts: [{ id: "f-ma", name: "F = ma", dependsOn: [] }],
  },
  prerequisites: [
    {
      question: "Acceleration is the rate of change of which quantity?",
      format: "mcq",
      options: [
        { text: "Velocity", correct: true, misconception: null },
        { text: "Position", correct: false, misconception: "That's velocity. Acceleration is one step further — the rate of change of velocity." },
        { text: "Force", correct: false, misconception: "Force causes acceleration, but acceleration isn't defined as the rate of change of force." },
      ],
      answer: null,
      modelAnswer: "Velocity. $a = \\dfrac{dv}{dt}$, with units $\\mathrm{m/s^2}$.",
      refresher:
        "Quick refresher: velocity is how fast *position* changes; acceleration is how fast *velocity* changes. A car speeding up from a red light has positive acceleration even while it's still slow. Units: $\\mathrm{m/s^2}$.",
      ifShaky: "Revisit kinematics — the difference between velocity and acceleration.",
    },
  ],
  concepts: [
    {
      id: "f-ma",
      name: "F = ma",
      anchorProblem: {
        prompt:
          "**Before any teaching — attempt this on your paper.** A **2 kg** cart on a frictionless floor is pushed with a steady **6 N**. What is its acceleration? Getting it wrong is fine — the struggle primes what comes next.",
        whatToNotice: "You need a relationship linking force, mass, and acceleration — that's what we'll build.",
        reveal:
          "The net force is $6\\,\\mathrm{N}$ (nothing opposes it — the floor is frictionless), and the mass is $2\\,\\mathrm{kg}$. Newton's second law says net force = mass × acceleration, so $a = \\dfrac{F}{m} = \\dfrac{6}{2} = 3\\,\\mathrm{m/s^2}$. The key move is that a *steady* force produces a *steady acceleration* (a constantly increasing velocity), not a steady speed — a common slip. If you answered '$6$' you used force as if it were acceleration; if you answered '$12$' you multiplied instead of divided. Hold onto *why* you divide: more mass resists the same push, so it shares the force into less acceleration.",
      },
      hintLadder: [
        "What does a force *change* — position, velocity, or the rate of change of velocity?",
        "Acceleration grows with force and shrinks with mass.",
        "Rearrange $F = ma$ to solve for $a$.",
      ],
      workedExample: [
        {
          text: "Identify the **net** force: $F = 6\\,\\mathrm{N}$. We use the net force because it's the *unbalanced* push that's left after opposing forces cancel — here friction is zero, so the applied push is the net force.",
          selfExplain: "Why must we use the NET force, not just the applied push?",
        },
        {
          text: "Apply $a = \\dfrac{F}{m} = \\dfrac{6}{2} = 3\\,\\mathrm{m/s^2}$. We divide by mass because mass measures resistance to acceleration: the same force produces less acceleration in a heavier object.",
          selfExplain: "Why would doubling the mass halve the acceleration?",
        },
      ],
      generative: [
        {
          kind: "summarize",
          prompt: "On your paper, write in one sentence what $F=ma$ lets you predict — and one thing it does NOT tell you (think about constant-speed motion).",
          model: "It predicts an object's acceleration from the net force and its mass. It says nothing extra about motion at constant velocity — that just needs zero net force (the first law).",
        },
        {
          kind: "draw",
          prompt: "Sketch a free-body diagram of the cart being pushed: draw every force as an arrow, then mark the net force.",
          model: "A horizontal arrow for the 6 N push; gravity (down) and the normal force (up) are equal and cancel; so the net force is 6 N horizontal — pointing the way the cart accelerates.",
        },
      ],
      derivation: [
        { prompt: "Start from 'force is the rate of change of momentum'. What is momentum $p$?", answer: "$p = mv$." },
        { prompt: "Differentiate $p = mv$ with respect to time for constant mass. What do you get?", answer: "$F = \\dfrac{dp}{dt} = m\\dfrac{dv}{dt} = ma$." },
      ],
      checks: [
        {
          kind: "retrieval",
          format: "mcq",
          level: "fact",
          question: "Newton's second law says the net force on an object is proportional to its —",
          options: [
            { text: "acceleration", correct: true, misconception: null },
            { text: "velocity", correct: false, misconception: "Force isn't needed to *have* velocity — a puck glides on frictionless ice with none. Force changes velocity, i.e. causes acceleration." },
            { text: "position", correct: false, misconception: "Position is two integration steps away from force; the direct link is to acceleration." },
            { text: "momentum at that instant", correct: false, misconception: "Force is the rate of *change* of momentum, not the momentum value itself." },
          ],
          answer: null,
          modelAnswer: "Acceleration — $F = ma$, so $F \\propto a$ for fixed mass.",
          rubric: ["links force to acceleration (not velocity)"],
        },
        {
          kind: "transfer",
          format: "integer",
          level: "application",
          question: "Work this on paper, then enter the number. A $0.5\\,\\mathrm{kg}$ ball feels a net force of $2\\,\\mathrm{N}$. What is its acceleration, in $\\mathrm{m/s^2}$?",
          options: [],
          answer: "4",
          modelAnswer: "$a = F/m = 2 / 0.5 = 4\\,\\mathrm{m/s^2}$.",
          rubric: ["applies $a=F/m$", "divides by 0.5 (not multiplies)"],
        },
        {
          kind: "retrieval",
          format: "fillblank",
          level: "fact",
          question: "Fill the blank (one word): with zero net force, an object's velocity stays ___.",
          options: [],
          answer: "constant",
          modelAnswer: "Constant — zero net force means zero acceleration (Newton's first law).",
          rubric: ["recognises zero net force ⇒ no change in velocity"],
        },
      ],
      calibration: { question: "Find the net force on a $3\\,\\mathrm{kg}$ mass accelerating at $2\\,\\mathrm{m/s^2}$.", modelAnswer: "$F = 6\\,\\mathrm{N}$." },
      misconceptions: [
        { misconception: "A force is needed to keep something moving at constant speed.", correction: "Force changes motion (causes acceleration). Constant velocity needs *zero* net force — that's Newton's first law." },
      ],
      teachBack: {
        whatToExplain: "Explain why $F = ma$, building it up from momentum, as if teaching a friend.",
        checklist: ["Defines net force", "Derives $F=ma$ from $p=mv$", "Addresses the 'force keeps things moving' misconception"],
      },
    },
  ],
  interleaved: [
    { prompt: "A $4\\,\\mathrm{kg}$ box on a frictionless floor is pulled by a horizontal $12\\,\\mathrm{N}$. Find its acceleration.", whichConcept: "F = ma", modelAnswer: "$a = F/m = 12/4 = 3\\,\\mathrm{m/s^2}$." },
  ],
  synthesis: [
    { question: "How do a free-body diagram and $F=ma$ work together to solve a mechanics problem?", modelAnswer: "Draw every force (free-body diagram), add them to get the net force, then apply $F=ma$ to find the acceleration." },
  ],
  spacing: [{ conceptId: "f-ma", returnAfter: "1 day" }],
};

export const SAMPLE_LESSON_JSON = JSON.stringify(SAMPLE, null, 2);

const SAMPLE_REVISION = {
  title: "Newton's Laws — revision",
  subject: "Physics",
  questions: [
    { id: "q1", kind: "retrieval", question: "State Newton's second law and give its equation.", modelAnswer: "The net force equals mass times acceleration: $F = ma$.", rubric: ["mentions NET force", "gives $F=ma$"], topic: "Second law", difficulty: "easy" },
    { id: "q2", kind: "transfer", question: "A $1500\\,\\mathrm{kg}$ car brakes from $20\\,\\mathrm{m/s}$ to rest in $5\\,\\mathrm{s}$. Find the average braking force.", modelAnswer: "$a = \\Delta v/\\Delta t = -20/5 = -4\\,\\mathrm{m/s^2}$, so $F = ma = 1500 \\times 4 = 6000\\,\\mathrm{N}$.", rubric: ["finds acceleration first", "applies $F=ma$", "≈ 6000 N"], topic: "Second law", difficulty: "medium" },
    { id: "q3", kind: "retrieval", question: "What does Newton's third law say about a book resting on a table?", modelAnswer: "The book pushes down on the table and the table pushes up on the book with an equal and opposite force.", rubric: ["equal and opposite", "identifies BOTH forces as an action–reaction pair"], topic: "Third law", difficulty: "easy" },
    { id: "q4", kind: "transfer", question: "Why does a passenger lurch forward when a bus brakes suddenly?", modelAnswer: "Inertia (first law): the passenger continues at the bus's prior velocity until a force acts; the seatbelt/seat provides that force.", rubric: ["invokes inertia / first law", "no force = constant velocity"], topic: "First law", difficulty: "medium" },
  ],
};
export const SAMPLE_REVISION_JSON = JSON.stringify(SAMPLE_REVISION, null, 2);

const SAMPLE_DOUBT = {
  concept: "Why F = ma (not F = mv)",
  methods: [
    { kind: "analogy", title: "Pushing a shopping trolley", content: "A force is like how hard you push a trolley. A gentle push doesn't set its *speed* — it changes how fast the speed is *building up*. Push harder and the speed climbs faster; load the trolley and the same push builds speed slower. That 'how fast speed builds' is acceleration — so force ties to $a$, not $v$." },
    { kind: "first-principles", title: "From momentum", content: "Force is really the rate of change of momentum $p = mv$. So $F = \\frac{dp}{dt}$. For constant mass, $F = m\\frac{dv}{dt} = ma$. Velocity $v$ only enters through *how it's changing*." },
    { kind: "edge-cases", title: "The give-away case", content: "If $F = mv$ were true, an object moving fast with NO push would still need a force just to keep moving — but a puck on frictionless ice glides forever with zero force. Constant $v$ needs zero net force; only *changing* $v$ needs force. That rules out $F=mv$." },
    { kind: "socratic", title: "Find the gap", content: "1) If you stop pushing a sliding puck on frictionless ice, does it stop? 2) So is a force needed to *have* velocity, or to *change* it? 3) Which quantity measures the change of velocity?" },
  ],
  retrievalCheck: { question: "In one sentence: a force changes which quantity — position, velocity, or the rate of change of velocity?", modelAnswer: "It changes the rate of change of velocity (the acceleration)." },
};
export const SAMPLE_DOUBT_JSON = JSON.stringify(SAMPLE_DOUBT, null, 2);
