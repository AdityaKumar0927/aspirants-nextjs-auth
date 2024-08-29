"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button"; // Correct Button import
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { MorePopover } from "@/components/layout/MorePopover";
import { useRouter } from "next/navigation"; // Correct import for useRouter in app directory

interface Issue {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
}

export default function IssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchIssues = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/issues");
        if (!response.ok) {
          throw new Error("Failed to fetch issues");
        }
        const data = await response.json();
        setIssues(data);
      } catch (error) {
        console.error("Error fetching issues:", error);
        setError("Failed to load issues. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchIssues();
  }, []);

  const handleRefresh = () => {
    router.refresh(); // Use router.refresh instead of router.reload in the app directory
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return (
      <div>
        <p>{error}</p>
        <Button onClick={handleRefresh}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <Card className="p-4">
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Reported Issues</CardTitle>
          <Button onClick={handleRefresh}>Refresh</Button>
        </CardHeader>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {issues.map((issue) => (
              <TableRow key={issue.id}>
                <TableCell>{issue.id}</TableCell>
                <TableCell>{issue.title}</TableCell>
                <TableCell>{issue.description}</TableCell>
                <TableCell>{issue.status}</TableCell>
                <TableCell>{issue.priority}</TableCell>
                <TableCell>
                  <MorePopover /> {/* Reuse the MorePopover component for each issue */}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
