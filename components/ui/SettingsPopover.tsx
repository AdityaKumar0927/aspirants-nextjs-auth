'use client';

import { Dispatch, SetStateAction, useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings2 } from 'lucide-react';

interface SettingsPopoverProps {
  markschemeEnabled: boolean;
  setMarkschemeEnabled: () => void;
  aiEnabled: boolean;
  setAiEnabled: Dispatch<SetStateAction<boolean>>;
  notesEnabled: boolean;
  setNotesEnabled: Dispatch<SetStateAction<boolean>>;
}

export default function SettingsPopover({
  markschemeEnabled,
  setMarkschemeEnabled,
  aiEnabled,
  setAiEnabled,
  notesEnabled,
  setNotesEnabled,
}: SettingsPopoverProps) {
  const [openPopover, setOpenPopover] = useState(false);

  return (
    <PopoverPrimitive.Root open={openPopover} onOpenChange={setOpenPopover}>
      <PopoverPrimitive.Trigger asChild>
        <button className="text-gray-700 px-2 py-1 rounded-md text-xs">
          <span className="sr-only">Open settings</span>
          <Settings2 className="h-5 w-5" />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Content
        sideOffset={8}
        align="center"
        className="z-50 p-4"
      >
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>Manage your preferences here.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="markscheme" className="flex flex-col space-y-1">
                <span>Enable Markscheme</span>
                <span className="font-normal leading-snug text-muted-foreground">
                  Allow display of markschemes.
                </span>
              </Label>
              <Switch
                id="markscheme"
                checked={markschemeEnabled}
                onCheckedChange={setMarkschemeEnabled}
              />
            </div>
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="ai" className="flex flex-col space-y-1">
                <span>Enable AI Chat</span>
                <span className="font-normal leading-snug text-muted-foreground">
                  Allow AI assistance during sessions.
                </span>
              </Label>
              <Switch
                id="ai"
                checked={aiEnabled}
                onCheckedChange={setAiEnabled}
              />
            </div>
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="notes" className="flex flex-col space-y-1">
                <span>Enable Notes</span>
                <span className="font-normal leading-snug text-muted-foreground">
                  Allow note-taking during sessions.
                </span>
              </Label>
              <Switch
                id="notes"
                checked={notesEnabled}
                onCheckedChange={setNotesEnabled}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setOpenPopover(false)}
            >
              Save preferences
            </Button>
          </CardFooter>
        </Card>
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Root>
  );
}