// @/app/administrator/page.tsx
import { Avatar } from '@/components/administrator-ui/avatar';
import { Badge } from '@/components/administrator-ui/badge';
import { Divider } from '@/components/administrator-ui/divider';
import { Heading, Subheading } from '@/components/administrator-ui/heading';
import { Select } from '@/components/administrator-ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/administrator-ui/table';
import { Button } from '@/components/ui/button';
import { Stat } from '@/components/administrator-ui/Stat';

// Define the Issue type
interface Issue {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  reporterName: string; // Assuming you have this field
}

export default async function Home() {
  const issues: Issue[] = await getRecentIssues(); // Adjust with your data fetching logic

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
        <Stat title="Total issues" value="10" change="+5%" />
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
            <TableRow key={issue.id} href={`/administrator/issues/${issue.id}`} title={`Issue #${issue.id}`}>
              <TableCell>{issue.id}</TableCell>
              <TableCell className="text-zinc-500">{issue.createdAt}</TableCell>
              <TableCell>{issue.reporterName}</TableCell>
              <TableCell>{issue.status}</TableCell>
              <TableCell className="text-right">
                <Button>View</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}

// Replace this with your actual data fetching logic
async function getRecentIssues(): Promise<Issue[]> {
  // Mock data for demonstration
  return [
    {
      id: "1",
      title: "Sample Issue",
      description: "This is a sample issue",
      status: "Open",
      createdAt: "2024-08-24",
      updatedAt: "2024-08-24",
      reporterName: "John Doe",
    },
    // Add more issues as needed
  ];
}
