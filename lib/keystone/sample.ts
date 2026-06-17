/**
 * A small, valid sample lesson — lets a student see the player immediately
 * (and serves as a test fixture) without first running the prompt through an
 * LLM. Matches the contract in lib/keystone/schema.ts.
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
      question: "In words and units, what is acceleration?",
      modelAnswer: "The rate of change of velocity with time. Units: $\\mathrm{m/s^2}$.",
      ifShaky: "Revisit kinematics — the difference between velocity and acceleration.",
    },
  ],
  concepts: [
    {
      id: "f-ma",
      name: "F = ma",
      anchorProblem: {
        prompt: "A **2 kg** cart on a frictionless floor is pushed with a steady **6 N**. What is its acceleration?",
        whatToNotice: "You need a relationship linking force, mass, and acceleration — that's what we'll build.",
      },
      hintLadder: [
        "What does a force *change* — position, velocity, or the rate of change of velocity?",
        "Acceleration grows with force and shrinks with mass.",
        "Rearrange $F = ma$ to solve for $a$.",
      ],
      workedExample: [
        { text: "The net force is $F = 6\\,\\mathrm{N}$ and the mass is $m = 2\\,\\mathrm{kg}$.", selfExplain: "Why must we use the NET force, not just the applied push?" },
        { text: "$a = \\dfrac{F}{m} = \\dfrac{6}{2} = 3\\,\\mathrm{m/s^2}$.", selfExplain: "Why would doubling the mass halve the acceleration?" },
      ],
      derivation: [
        { prompt: "Start from 'force is the rate of change of momentum'. What is momentum $p$?", answer: "$p = mv$." },
        { prompt: "Differentiate $p = mv$ with respect to time for constant mass. What do you get?", answer: "$F = \\dfrac{dp}{dt} = m\\dfrac{dv}{dt} = ma$." },
      ],
      checks: [
        { kind: "retrieval", question: "State Newton's second law in your own words.", modelAnswer: "The net force on an object equals its mass times its acceleration.", rubric: ["mentions NET force", "links force to acceleration (not velocity)"] },
        { kind: "transfer", question: "A $0.5\\,\\mathrm{kg}$ ball accelerates at $4\\,\\mathrm{m/s^2}$. What net force acts on it?", modelAnswer: "$F = ma = 0.5 \\times 4 = 2\\,\\mathrm{N}$.", rubric: ["applies $F=ma$", "correct value and units (N)"] },
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
