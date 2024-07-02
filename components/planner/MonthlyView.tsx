// components/planner/MonthlyView.tsx
const MonthlyView = () => {
    // Placeholder data
    const daysInMonth = new Date(2024, 8, 0).getDate(); // September 2024
    const events = [
      { date: 5, title: "Exam 1" },
      { date: 12, title: "Project Deadline" },
      { date: 21, title: "Mid-term Exam" },
    ];
  
    return (
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4">Monthly View</h2>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: daysInMonth }, (_, i) => (
            <div key={i} className="border p-2">
              <div className="text-sm font-bold">{i + 1}</div>
              {events
                .filter(event => event.date === i + 1)
                .map(event => (
                  <div key={event.title} className="text-xs bg-blue-100 p-1 rounded">
                    {event.title}
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  export default MonthlyView;
  