"use client"

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { ResponsiveLine } from "@nivo/line";

// Define types for user object to prevent TypeScript errors
interface User {
  username: string;
  avatar: string;
  questionsSolved: number;
  accuracy: number;
  attempted: number;
  timePerQuestion: string;
}

export default function Component() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const handleUserClick = (user: User) => {
    setSelectedUser(user);
  };

  const handleModalClose = () => {
    setSelectedUser(null);
  };

  return (
    <>
      <Card className="w-full max-w-3xl">
        <CardHeader className="flex items-center justify-between border-b pb-4">
          <CardTitle className="text-2xl font-bold">Leaderboard</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <TrophyIcon className="h-4 w-4" />
              <span>View Prizes</span>
            </Button>
            <Button variant="outline" size="sm">
              <RefreshCwIcon className="h-4 w-4" />
              <span>Refresh</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="bg-muted/5 rounded-lg p-4">
              <div className="text-sm font-medium">Questions Solved</div>
              <div className="text-3xl font-bold">12,345</div>
              <Progress value={92.3} aria-label="92.3% accuracy" className="mt-2" />
            </div>
            <div className="bg-muted/5 rounded-lg p-4">
              <div className="text-sm font-medium">Accuracy</div>
              <div className="text-3xl font-bold">92.3%</div>
              <Progress value={92.3} aria-label="92.3% accuracy" className="mt-2" />
            </div>
            <div className="bg-muted/5 rounded-lg p-4">
              <div className="text-sm font-medium">Time per Question</div>
              <div className="text-3xl font-bold">12s</div>
              <Progress value={80} aria-label="80% time per question" className="mt-2" />
            </div>
          </div>
          <Table className="mt-6">
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">#</TableHead>
                <TableHead>Username</TableHead>
                <TableHead className="text-right">Questions Solved</TableHead>
                <TableHead className="text-right">Accuracy</TableHead>
                <TableHead className="text-right">Attempted</TableHead>
                <TableHead className="text-right">Time per Question</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                {
                  username: "shadcn",
                  avatar: "/placeholder-user.jpg",
                  questionsSolved: 12345,
                  accuracy: 92.3,
                  attempted: 13500,
                  timePerQuestion: "12s",
                },
                {
                  username: "jaredpalmer",
                  avatar: "/placeholder-user.jpg",
                  questionsSolved: 11987,
                  accuracy: 89.7,
                  attempted: 13200,
                  timePerQuestion: "14s",
                },
                {
                  username: "maxleiter",
                  avatar: "/placeholder-user.jpg",
                  questionsSolved: 10654,
                  accuracy: 87.2,
                  attempted: 12800,
                  timePerQuestion: "16s",
                },
                {
                  username: "shuding_",
                  avatar: "/placeholder-user.jpg",
                  questionsSolved: 9876,
                  accuracy: 84.5,
                  attempted: 11900,
                  timePerQuestion: "18s",
                },
                {
                  username: "lee_robinson",
                  avatar: "/placeholder-user.jpg",
                  questionsSolved: 8765,
                  accuracy: 81.2,
                  attempted: 10800,
                  timePerQuestion: "20s",
                },
              ].map((user, index) => (
                <TableRow
                  key={index}
                  className="cursor-pointer hover:bg-muted/10"
                  onClick={() => handleUserClick(user)}
                >
                  <TableCell className="text-center font-medium">{index + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} alt={`@${user.username}`} />
                        <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span>{user.username}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">{user.questionsSolved}</TableCell>
                  <TableCell className="text-right font-medium">{user.accuracy}%</TableCell>
                  <TableCell className="text-right font-medium">{user.attempted}</TableCell>
                  <TableCell className="text-right font-medium">{user.timePerQuestion}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedUser && (
        <Dialog open onOpenChange={handleModalClose}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={selectedUser.avatar} alt={selectedUser.username} />
                  <AvatarFallback>{selectedUser.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-lg font-bold">{selectedUser.username}</div>
                  <div className="text-sm text-muted-foreground">User Analytics</div>
                </div>
              </div>
            </DialogHeader>
            <div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-sm font-medium">Questions Solved</div>
                  <div className="text-2xl font-bold">{selectedUser.questionsSolved}</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Accuracy</div>
                  <div className="text-2xl font-bold">{selectedUser.accuracy}%</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Attempted</div>
                  <div className="text-2xl font-bold">{selectedUser.attempted}</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Time per Question</div>
                  <div className="text-2xl font-bold">{selectedUser.timePerQuestion}</div>
                </div>
              </div>
              <div className="mt-6">
                <LineChart className="w-full aspect-[4/3]" />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

// Define LineChart component properly with the expected props type
function LineChart(props: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props}>
      <ResponsiveLine
        data={[
          {
            id: "Desktop",
            data: [
              { x: "Jan", y: 43 },
              { x: "Feb", y: 137 },
              { x: "Mar", y: 61 },
              { x: "Apr", y: 145 },
              { x: "May", y: 26 },
              { x: "Jun", y: 154 },
            ],
          },
          {
            id: "Mobile",
            data: [
              { x: "Jan", y: 60 },
              { x: "Feb", y: 48 },
              { x: "Mar", y: 177 },
              { x: "Apr", y: 78 },
              { x: "May", y: 96 },
              { x: "Jun", y: 204 },
            ],
          },
        ]}
        margin={{ top: 10, right: 10, bottom: 40, left: 40 }}
        xScale={{ type: "point" }}
        yScale={{ type: "linear" }}
        axisTop={null}
        axisRight={null}
        axisBottom={{ tickSize: 0, tickPadding: 16 }}
        axisLeft={{ tickSize: 0, tickValues: 5, tickPadding: 16 }}
        colors={["#2563eb", "#e11d48"]}
        pointSize={6}
        useMesh={true}
        gridYValues={6}
        theme={{
          tooltip: {
            chip: { borderRadius: "9999px" },
            container: { fontSize: "12px", textTransform: "capitalize", borderRadius: "6px" },
          },
          grid: { line: { stroke: "#f3f4f6" } },
        }}
        role="application"
      />
    </div>
  );
}

// Icon components with proper type annotations
function RefreshCwIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  );
}

function TrophyIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}
