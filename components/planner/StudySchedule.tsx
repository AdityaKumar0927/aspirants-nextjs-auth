// components/planner/StudySchedule.tsx
const StudySchedule = () => {
    const studySessions = [
      { subject: "Math", topic: "Calculus", resources: "Textbook, Notes" },
      { subject: "Physics", topic: "Mechanics", resources: "Lecture Slides" },
    ];
  
    return (
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4">Study Schedule</h2>
        <div className="space-y-4">
          {studySessions.map(session => (
            <div key={session.subject} className="border p-4 rounded">
              <div className="text-lg font-bold">{session.subject}</div>
              <div className="text-sm">Topic: {session.topic}</div>
              <div className="text-sm text-gray-500">Resources: {session.resources}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  export default StudySchedule;
  