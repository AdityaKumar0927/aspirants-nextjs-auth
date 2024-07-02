// components/planner/ClassSchedule.tsx
const ClassSchedule = () => {
    const classSchedule = [
      { day: "Monday", time: "9:00", subject: "Math", instructor: "Dr. Smith" },
      { day: "Wednesday", time: "14:00", subject: "Physics", instructor: "Prof. Johnson" },
    ];
  
    return (
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4">Class Schedule</h2>
        <div className="space-y-4">
          {classSchedule.map(schedule => (
            <div key={schedule.subject} className="border p-4 rounded">
              <div className="text-lg font-bold">{schedule.subject}</div>
              <div className="text-sm">Day: {schedule.day}</div>
              <div className="text-sm">Time: {schedule.time}</div>
              <div className="text-sm text-gray-500">Instructor: {schedule.instructor}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  export default ClassSchedule;
  