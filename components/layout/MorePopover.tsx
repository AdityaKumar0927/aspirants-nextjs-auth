"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MoreVertical } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

export function MorePopover() {
  const [openPopover, setOpenPopover] = useState(false);
  const [area, setArea] = useState("billing");
  const [priority, setPriority] = useState("MEDIUM"); // Defaulting to a valid enum value
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const { toast } = useToast();

  const handleSubmit = async () => {
    try {
      // Prepare data for API request
      const response = await fetch("/api/issues", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: subject,
          description,
          area,
          securityLevel: mapPriorityToSecurityLevel(priority), // Correctly mapping the priority to security level
        }),
      });

      // Check the response status
      if (response.ok) {
        toast({
          title: "Issue reported",
          description: "Your issue has been successfully reported.",
        });
        setOpenPopover(false);
        setSubject("");
        setDescription("");
      } else {
        // Extract error message from the response
        const errorData = await response.json();
        toast({
          title: "Error",
          description:
            errorData.error || "There was an error reporting your issue. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      // Handle unexpected errors
      toast({
        title: "Error",
        description: "There was an error reporting your issue. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Maps the priority string to the expected security level for backend
  const mapPriorityToSecurityLevel = (priority: String) => {
    switch (priority) {
      case "LOW":
        return "4";
      case "MEDIUM":
        return "3";
      case "HIGH":
        return "2";
      case "CRITICAL":
        return "1";
      default:
        return "3"; // Default to medium if not matched
    }
  };

  return (
    <PopoverPrimitive.Root open={openPopover} onOpenChange={setOpenPopover}>
      <PopoverPrimitive.Trigger asChild>
        <button className="text-gray-700 px-2 py-1 rounded-md text-xs">
          <span className="sr-only">Open more options</span>
          <MoreVertical className="h-5 w-5" />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Content sideOffset={8} align="center" className="z-50 p-2">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Report an issue</CardTitle>
            <CardDescription>What area are you having problems with?</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="area">Area</Label>
                <Select defaultValue="billing" onValueChange={setArea}>
                  <SelectTrigger id="area">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="team">Team</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                    <SelectItem value="account">Account</SelectItem>
                    <SelectItem value="deployments">Deployments</SelectItem>
                    <SelectItem value="support">Support</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="priority">Priority</Label>
                <Select defaultValue="MEDIUM" onValueChange={setPriority}>
                  <SelectTrigger id="priority" className="line-clamp-1 w-[160px] truncate">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Severity 4 (Lowest)</SelectItem>
                    <SelectItem value="MEDIUM">Severity 3</SelectItem>
                    <SelectItem value="HIGH">Severity 2</SelectItem>
                    <SelectItem value="CRITICAL">Severity 1 (Highest)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="I need help with..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Please include all information relevant to your issue."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="justify-between space-x-2">
            <Button variant="ghost" onClick={() => setOpenPopover(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Submit</Button>
          </CardFooter>
        </Card>
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Root>
  );
}
