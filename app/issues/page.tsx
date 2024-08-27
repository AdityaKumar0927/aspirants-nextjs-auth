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
  const router = useRouter();

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const response = await fetch("/api/issues");
        if (!response.ok) {
          throw new Error("Failed to fetch issues");
        }
        const data = await response.json();
        setIssues(data);
      } catch (error) {
        console.error("Error fetching issues:", error);
      }
    };

    fetchIssues();
  }, []);

  const handleRefresh = () => {
    router.refresh(); // Use router.refresh instead of router.reload in the app directory
  };

  return (
    <div className="h-full w-full">
    <Card className="p-4">
      <CardHeader>
        <CardTitle>Reported Issues</CardTitle>
        <Button onClick={handleRefresh} className="ml-auto">
          Refresh
        </Button>
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
