// components/planner/ToDoLists.tsx
const ToDoLists = () => {
    const todoList = [
      { task: "Finish Math Homework", priority: "High" },
      { task: "Read Physics Chapter 3", priority: "Medium" },
    ];
  
    return (
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4">To-Do Lists</h2>
        <div className="space-y-4">
          {todoList.map(todo => (
            <div key={todo.task} className="border p-4 rounded">
              <div className="text-lg font-bold">{todo.task}</div>
              <div className={`text-sm ${todo.priority === "High" ? "text-red-500" : "text-yellow-500"}`}>
                Priority: {todo.priority}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  export default ToDoLists;
  