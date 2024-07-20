"use client";

import { useState } from "react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useForm, Controller } from "react-hook-form";
import { RocketIcon } from "lucide-react";
import { toast, Toaster } from "sonner";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";

type Note = {
  id: number;
  title: string;
  note: string;
  date: Date;
  type: "text";
};

export function NoteApp() {
  const [notes, setNotes] = useState<Note[]>([]);
  const { control, handleSubmit, reset } = useForm<{ title: string; note: string }>({
    defaultValues: { title: "", note: "" },
  });
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const onSubmit = (data: { title: string; note: string }) => {
    const newNote: Note = {
      ...data,
      id: editingNote ? editingNote.id : Date.now(),
      date: new Date(),
      type: "text",
    };

    if (editingNote) {
      setNotes(notes.map((note) => (note.id === editingNote.id ? newNote : note)));
      setEditingNote(null);
    } else {
      setNotes([...notes, newNote]);
    }

    toast("Note added", {
      description: "Your text note has been added.",
    });
    reset();
  };

  const deleteNote = (id: number) => {
    const noteToDelete = notes.find((note) => note.id === id);
    if (noteToDelete) {
      setNotes(notes.filter((note) => note.id !== id));
      toast("Note deleted", {
        description: "Your note has been deleted.",
        action: {
          label: "Undo",
          onClick: () => setNotes((prevNotes) => [...prevNotes, noteToDelete]),
        },
      });
    }
  };

  const handleEdit = (note: Note) => {
    setEditingNote(note);
    reset({ title: note.title, note: note.note });
  };

  return (
    <>
      <Toaster />
      <div className="flex min-h-screen w-full flex-col">
        <header className="flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">Menu</Button>
            </PopoverTrigger>
            <PopoverContent>
              <Command>
                <CommandInput placeholder="Type a command or search..." />
                <CommandList>
                  <CommandEmpty>No results found.</CommandEmpty>
                  <CommandGroup heading="Suggestions">
                    <CommandItem>
                      <RocketIcon className="mr-2 h-4 w-4" />
                      <span>Launch</span>
                    </CommandItem>
                  </CommandGroup>
                  <CommandSeparator />
                  <CommandGroup heading="Settings">
                    <CommandItem>
                      <MagnifyingGlassIcon className="mr-2 h-4 w-4" />
                      <span>Search</span>
                      <CommandShortcut>⌘K</CommandShortcut>
                    </CommandItem>
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 overflow-auto">
          <h1 className="text-2xl font-bold">Notes</h1>
          <Alert>
            <RocketIcon className="h-4 w-4" />
            <AlertTitle>Heads up!</AlertTitle>
            <AlertDescription>
              Ideally, you should use an external digital tablet and pen for note-taking.
            </AlertDescription>
          </Alert>

          <Card className="w-full md:w-[700px]">
            <CardHeader>
              <CardTitle>Create Note</CardTitle>
              <CardDescription>Type your note below.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="grid w-full items-center gap-4">
                  <Controller
                    name="title"
                    control={control}
                    render={({ field }) => (
                      <Input {...field} placeholder="Title" />
                    )}
                  />
                  <Controller
                    name="note"
                    control={control}
                    render={({ field }) => (
                      <Input {...field} placeholder="Write your note here..." />
                    )}
                  />
                </div>
                <div className="mt-4 flex justify-between">
                  <Button type="submit">{editingNote ? "Update Note" : "Add Note"}</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
            {notes.map((note) => (
              <Card key={note.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {note.title || "Untitled Note"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-md">{note.note}</p>
                  <p className="text-xs text-muted-foreground">{note.date.toLocaleString()}</p>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm">Options</Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48">
                      <Button
                        variant="ghost"
                        className="w-full text-left text-gray-500"
                        onClick={() => handleEdit(note)}
                      >
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" className="w-full text-left text-gray-500">Delete</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete your note.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteNote(note.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </PopoverContent>
                  </Popover>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    </>
  );
}
