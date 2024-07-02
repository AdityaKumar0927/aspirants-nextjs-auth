// components/planner/DailyView.tsx
const DailyView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    const dailySchedule = [
      { time: "9:00", event: "Math Class" },
      { time: "14:00", event: "Study Session" },
    ];
  
    return (
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4">Daily View</h2>
        <div className="grid grid-cols-1 gap-2">
          {hours.map(hour => (
            <div key={hour} className="border p-2">
              <div className="text-sm font-bold">{hour}</div>
              {dailySchedule
                .filter(schedule => schedule.time === hour)
                .map(schedule => (
                  <div key={schedule.event} className="text-xs bg-yellow-100 p-1 rounded">
                    {schedule.event}
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  export default DailyView;
  