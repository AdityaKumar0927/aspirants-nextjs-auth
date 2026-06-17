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
