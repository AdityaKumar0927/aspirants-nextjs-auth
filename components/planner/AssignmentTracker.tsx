// components/planner/AssignmentTracker.tsx
const AssignmentTracker = () => {
    const assignments = [
      { title: "Math Homework", dueDate: "2024-09-15" },
      { title: "Physics Project", dueDate: "2024-09-20" },
    ];
  
    return (
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4">Assignment Tracker</h2>
        <div className="space-y-4">
          {assignments.map(assignment => (
            <div key={assignment.title} className="border p-4 rounded">
              <div className="text-lg font-bold">{assignment.title}</div>
              <div className="text-sm text-gray-500">Due Date: {assignment.dueDate}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  export default AssignmentTracker;
  