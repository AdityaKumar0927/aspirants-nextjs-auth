// components/planner/WeeklyView.tsx
const WeeklyView = () => {
    const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const weekSchedule = [
      { day: "Monday", events: ["Math Class", "Study Session"] },
      { day: "Wednesday", events: ["Physics Class", "Project Meeting"] },
    ];
  
    return (
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4">Weekly View</h2>
        <div className="grid grid-cols-7 gap-2">
          {daysOfWeek.map(day => (
            <div key={day} className="border p-2">
              <div className="text-sm font-bold">{day}</div>
              {weekSchedule
                .filter(schedule => schedule.day === day)
                .map(schedule => (
                  <div key={schedule.day}>
                    {schedule.events.map(event => (
                      <div key={event} className="text-xs bg-green-100 p-1 rounded">
                        {event}
                      </div>
                    ))}
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  export default WeeklyView;
  