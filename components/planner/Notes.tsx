// components/planner/Notes.tsx
const Notes = () => {
    const notes = [
      { date: "2024-09-15", content: "Lecture notes on calculus." },
      { date: "2024-09-20", content: "Reflection on the physics project." },
    ];
  
    return (
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4">Notes and Reflections</h2>
        <div className="space-y-4">
          {notes.map(note => (
            <div key={note.date} className="border p-4 rounded">
              <div className="text-lg font-bold">{note.date}</div>
              <div className="text-sm text-gray-500">{note.content}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  export default Notes;
  