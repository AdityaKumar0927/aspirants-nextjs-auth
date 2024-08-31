// app/administrator/manage-roles/page.tsx
"use client";

import React, { useState, useEffect } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: { name: string };
}

const validRoles = ["member", "volunteer", "moderator", "administrator"];

const ManageRoles: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  // Define the fetchUsers function
  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/user/get"); // Correct endpoint and method for fetching users
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      setMessage(`Error: ${(error as Error).message}`);
    }
  };

  useEffect(() => {
    fetchUsers(); // Fetch users on component mount
  }, []);

  const handleRoleChange = async () => {
    if (!selectedUser || !selectedRole) {
      setMessage("Please select a user and a role.");
      return;
    }

    try {
      const response = await fetch("/api/user/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUser, roleName: selectedRole }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update user role");
      }

      setMessage(`User role updated to ${selectedRole} successfully.`);
      fetchUsers(); // Re-fetch users to update the list after role change
    } catch (error) {
      setMessage(`Error: ${(error as Error).message}`);
    }
  };

  return (
    <div className="p-8 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4">Manage User Roles</h1>

      <div className="mb-4">
        <label className="block mb-2 text-sm font-medium">Select User:</label>
        <select
          className="border rounded-md p-2 w-full"
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
        >
          <option value="">-- Select User --</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} ({user.email}) - Current Role: {user.role.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label className="block mb-2 text-sm font-medium">Select Role:</label>
        <select
          className="border rounded-md p-2 w-full"
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
        >
          <option value="">-- Select Role --</option>
          {validRoles.map((role) => (
            <option key={role} value={role}>
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <button
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        onClick={handleRoleChange}
      >
        Update Role
      </button>

      {message && <p className="mt-4 text-red-500">{message}</p>}
    </div>
  );
};

export default ManageRoles;
