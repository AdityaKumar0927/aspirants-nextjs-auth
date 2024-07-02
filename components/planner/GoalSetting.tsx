// components/planner/GoalSetting.tsx
const GoalSetting = () => {
    const goals = [
      { title: "Finish Math Homework", milestones: ["Chapter 1", "Chapter 2"] },
      { title: "Prepare for Physics Exam", milestones: ["Week 1 Notes", "Week 2 Notes"] },
    ];
  
    return (
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4">Goal Setting</h2>
        <div className="space-y-4">
          {goals.map(goal => (
            <div key={goal.title} className="border p-4 rounded">
              <div className="text-lg font-bold">{goal.title}</div>
              <ul className="list-disc pl-4 mt-2">
                {goal.milestones.map(milestone => (
                  <li key={milestone} className="text-sm">{milestone}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  export default GoalSetting;
  