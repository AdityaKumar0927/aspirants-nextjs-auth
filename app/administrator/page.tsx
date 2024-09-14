"use client";

import { Heading, Subheading } from '@/components/administrator-ui/heading';
import { Select } from '@/components/administrator-ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/administrator-ui/table';
import { Button } from '@/components/ui/button';
import { Stat } from '@/components/administrator-ui/Stat';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/components/ui/use-toast';

// Define types for status
type Status = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

// Define the Issue type
interface Issue {
  id: string;
  title: string;
  description: string;
  status: Status;
  createdAt: string;
  updatedAt: string;
  reporterName: string;
}

export default function Home() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const { toast } = useToast();

  const fetchIssues = useCallback(async () => {
    try {
      const response = await fetch('/api/issues');
      if (!response.ok) throw new Error('Failed to fetch issues');
      const data = await response.json();
      setIssues(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch issues. Please try again.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const handleStatusUpdate = useCallback(
    async (id: string, status: Status) => {
      try {
        const response = await fetch(`/api/issues/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status }),
        });

        if (!response.ok) throw new Error('Failed to update issue status');

        toast({
          title: 'Success',
          description: `Issue status updated to ${status}.`,
        });

        // Optimistically update the issue in the state
        setIssues((prevIssues) =>
          prevIssues.map((issue) =>
            issue.id === id ? { ...issue, status } : issue
          )
        );
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Unable to update issue status.',
          variant: 'destructive',
        });
      }
    },
    [toast]
  );

  const totalIssues = issues.length;
  const resolvedIssues = useMemo(
    () => issues.filter((issue) => issue.status === 'RESOLVED').length,
    [issues]
  );
  const openIssues = useMemo(
    () => issues.filter((issue) => issue.status === 'OPEN').length,
    [issues]
  );

  const IssueRow = ({ issue }: { issue: Issue }) => (
    <TableRow
      key={issue.id}
      href={`/administrator/issues/${issue.id}`}
      title={`Issue #${issue.id}`}
    >
      <TableCell>{issue.id}</TableCell>
      <TableCell className="text-zinc-500">{issue.createdAt}</TableCell>
      <TableCell>{issue.reporterName}</TableCell>
      <TableCell>
        <Select
          value={issue.status}
          onChange={(e) => handleStatusUpdate(issue.id, e.target.value as Status)}
          disabled={issue.status === 'CLOSED'}
        >
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </Select>
      </TableCell>
      <TableCell className="text-right">
        <Button
          onClick={() => handleStatusUpdate(issue.id, 'CLOSED')}
          disabled={issue.status === 'CLOSED'}
        >
          Close
        </Button>
      </TableCell>
    </TableRow>
  );

  return (
    <>
      <Heading>Good afternoon, Administrator</Heading>
      <div className="mt-8 flex items-end justify-between">
        <Subheading>Issue Overview</Subheading>
        <div>
          <Select name="period">
            <option value="last_week">Last week</option>
            <option value="last_two">Last two weeks</option>
            <option value="last_month">Last month</option>
            <option value="last_quarter">Last quarter</option>
          </Select>
        </div>
      </div>
      <div className="mt-4 grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
        <Stat title="Total issues" value={String(totalIssues)} change="+5%" />
        <Stat title="Resolved issues" value={String(resolvedIssues)} change="-10%" />
        <Stat title="Open issues" value={String(openIssues)} change="+20%" />
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
            <IssueRow key={issue.id} issue={issue} />
          ))}
        </TableBody>
      </Table>
    </>
  );
}
