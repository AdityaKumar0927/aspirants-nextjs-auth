// @/app/administrator/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Avatar } from "@/components/administrator-ui/avatar";
import { Badge } from "@/components/administrator-ui/badge";
import { Divider } from "@/components/administrator-ui/divider";
import { Heading, Subheading } from "@/components/administrator-ui/heading";
import { Select } from "@/components/administrator-ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/administrator-ui/table";
import { Button } from "@/components/ui/button";
import { Stat } from "@/components/administrator-ui/Stat";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

// Define the Issue type
interface Issue {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  reporterName: string;
}

export default function Home() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState("last_week");
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    fetchIssues();
  }, [selectedPeriod]);

  const fetchIssues = async () => {
    try {
      const response = await fetch("/api/issues");
      if (!response.ok) throw new Error("Failed to fetch issues");
      const data = await response.json();
      setIssues(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Unable to fetch issues. Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/issues/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) throw new Error("Failed to update issue status");

      toast({
        title: "Success",
        description: `Issue status updated to ${status}.`,
      });

      fetchIssues(); // Refresh the list after update
    } catch (error) {
      toast({
        title: "Error",
        description: "Unable to update issue status.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteIssue = async (id: string) => {
    try {
      const response = await fetch(`/api/issues/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete issue");

      toast({
        title: "Success",
        description: "Issue deleted successfully.",
      });

      fetchIssues(); // Refresh the list after deletion
    } catch (error) {
      toast({
        title: "Error",
        description: "Unable to delete issue.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Heading>Good afternoon, Administrator</Heading>
      <div className="mt-8 flex items-end justify-between">
        <Subheading>Issue Overview</Subheading>
        <Select
          name="period"
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
        >
          <option value="last_week">Last week</option>
          <option value="last_two">Last two weeks</option>
          <option value="last_month">Last month</option>
          <option value="last_quarter">Last quarter</option>
        </Select>
      </div>
      <div className="mt-4 grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
        <Stat title="Total issues" value={`${issues.length}`} change="+5%" />
        <Stat title="Resolved issues" value="5" change="-10%" />
        <Stat title="Open issues" value="5" change="+20%" />
        <Stat title="Average resolution time" value="2 days" change="+5%" />
      </div>
      <Subheading className="mt-14">Recent Issues</Subheading>
      <Table className="mt-4 [--gutter:theme(spacing.6)] lg:[--gutter:theme(spacing.10)]">
        <TableHead>
          <TableRow>
            <TableHeader>Issue number</TableHeader>
            <TableHeader>Reported date</TableHeader>
            <TableHeader>Reporter</TableHeader>
            <TableHeader>Status</TableHeader>
            <TableHeader className="text-right">Actions</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {issues.map((issue) => (
            <TableRow key={issue.id}>
              <TableCell>{issue.id}</TableCell>
              <TableCell className="text-zinc-500">{issue.createdAt}</TableCell>
              <TableCell>{issue.reporterName}</TableCell>
              <TableCell>{issue.status}</TableCell>
              <TableCell className="text-right">
                <Button
                  onClick={() => handleStatusUpdate(issue.id, "Resolved")}
                >
                  Resolve
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteIssue(issue.id)}
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
