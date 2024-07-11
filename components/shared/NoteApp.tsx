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
  CardFooter,
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
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { RocketIcon, Pencil, X } from "lucide-react";
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
import CanvasDraw from "react-canvas-draw";

type Note = {
  id: number;
  note: string;
  date: Date;
  type: "text" | "scribbled";
  drawingData?: string;
};

export function NoteApp() {
  const [notes, setNotes] = useState<Note[]>([]);
  const { control, handleSubmit, reset } = useForm<{ note: string }>({
    defaultValues: { note: "" },
  });
  const [noteType, setNoteType] = useState<"text" | "scribbled">("text");
  const [drawingData, setDrawingData] = useState("");
  const [isDrawing, setIsDrawing] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const onSubmit = (data: { note: string }) => {
    const newNote = {
      ...data,
      id: editingNote ? editingNote.id : Date.now(),
      date: new Date(),
      type: noteType,
      drawingData: noteType === "scribbled" ? drawingData : undefined,
    };

    if (editingNote) {
      setNotes(notes.map((note) => (note.id === editingNote.id ? newNote : note)));
      setEditingNote(null);
    } else {
      setNotes([...notes, newNote]);
    }

    toast("Note added", {
      description: `Your ${noteType} note has been added.`,
    });
    reset();
    setDrawingData("");
    setIsDrawing(false);
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
    setNoteType(note.type);
    if (note.type === "scribbled" && note.drawingData) {
      setDrawingData(note.drawingData);
    } else {
      reset({ note: note.note });
    }
    setIsDrawing(note.type === "scribbled");
  };

  return (
    <>
      <Toaster />
      <div className="flex min-h-screen w-full flex-col">
        <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
          <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
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
          </nav>
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

          <Card className="w-[700px]">
            <CardHeader>
              <CardTitle>Create Note</CardTitle>
              <CardDescription>Type your note below or draw your note.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <ToggleGroup
                  type="single"
                  value={noteType}
                  onValueChange={(value) => setNoteType(value as "text" | "scribbled")}
                  className="mb-4"
                >
                  <ToggleGroupItem value="text" aria-label="Text">
                    Text
                  </ToggleGroupItem>
                  <ToggleGroupItem value="scribbled" aria-label="Drawing">
                    Scribble
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
              {noteType === "text" ? (
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className="grid w-full items-center gap-4">
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
              ) : (
                <>
                  {isDrawing && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                      <Card className="relative w-[90%] h-[90%] p-4 bg-white rounded-3xl">
                        <Button className="absolute top-4 right-4" onClick={() => setIsDrawing(false)}>
                          <X className="h-4 w-4" />
                        </Button>
                        <CanvasDraw
                          canvasWidth={700}
                          canvasHeight={500}
                          brushRadius={2}
                          lazyRadius={12}
                          saveData={drawingData}
                          onChange={(canvas) => setDrawingData(canvas.getSaveData())}
                        />
                        <div className="mt-4 flex justify-between">
                          <Button onClick={handleSubmit(onSubmit)}>Save Drawing</Button>
                        </div>
                      </Card>
                    </div>
                  )}
                  <Button onClick={() => setIsDrawing(true)} className="mt-4">
                    {editingNote ? "Edit Drawing" : "Start Drawing"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
            {notes.map((note) => (
              <Card key={note.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {note.type === "scribbled" ? "Scribbled Note" : "Text Note"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {note.type === "text" ? (
                    <p className="text-md">{note.note}</p>
                  ) : (
                    <div className="overflow-hidden">
                      <CanvasDraw
                        disabled
                        hideGrid
                        saveData={note.drawingData}
                        canvasWidth={300}
                        canvasHeight={200}
                      />
                    </div>
                  )}
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
        <style jsx>{`
          main {
            max-height: calc(100vh - 64px);
            overflow-y: auto;
          }

          main::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }

          main::-webkit-scrollbar-track {
            background: #ffffff;
            border: 1px solid #e5e7eb; /* Tailwind gray-200 */
            border-radius: 0.25rem; /* Tailwind rounded */
          }

          main::-webkit-scrollbar-thumb {
            background-color: #d1d5db; /* Tailwind gray-300 */
            border-radius: 0.25rem; /* Tailwind rounded */
          }
        `}</style>
      </div>
    </>
  );
}
