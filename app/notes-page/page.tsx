"use client";

import React, { useState, useEffect, useCallback } from "react";
import cx from "classnames";
import Popover from "@/components/shared/popover";
import { ChevronDown } from "lucide-react";
import yaml from "js-yaml";
import ImprovedStudyPlanner from "@/components/shared/study-planner";

interface NoteType {
  title: string;
  content: string;
  subject: string;
  topic: string;
  subtopic: string;
  note: string;
  example: string;
  mistakes: string;
}

const fetchNotesData = async (): Promise<NoteType[]> => {
  const response = await fetch("/components/shared/notes.yaml");
  const yamlText = await response.text();
  const notesData = yaml.load(yamlText) as NoteType[];
  return notesData;
};

const initialFilters = {
  subjects: [] as string[],
  topics: [] as string[],
  subtopics: [] as string[],
  status: "all",
};

type FilterKeys = keyof typeof initialFilters;
type DropdownKeys = "subject" | "topic" | "subtopic";

const NotesPage: React.FC = () => {
  const [filteredNotes, setFilteredNotes] = useState<NoteType[]>([]);
  const [filters, setFilters] = useState(initialFilters);
  const [dropdowns, setDropdowns] = useState<Record<DropdownKeys, boolean>>({
    subject: false,
    topic: false,
    subtopic: false,
  });

  useEffect(() => {
    fetchNotesData().then(setFilteredNotes);
  }, []);

  const subjects = Array.from(new Set(filteredNotes.map((n) => n.subject)));
  const topics = Array.from(new Set(filteredNotes.map((n) => n.topic)));
  const subtopics = Array.from(new Set(filteredNotes.map((n) => n.subtopic)));

  const filterNotes = useCallback(() => {
    let filtered = filteredNotes.filter((note) => {
      return (
        (!filters.subjects.length || filters.subjects.includes(note.subject)) &&
        (!filters.topics.length || filters.topics.includes(note.topic)) &&
        (!filters.subtopics.length || filters.subtopics.includes(note.subtopic))
      );
    });
    setFilteredNotes(filtered);
  }, [filters, filteredNotes]);

  useEffect(() => {
    filterNotes();
  }, [filters, filterNotes]);

  const handleFilterChange = (tag: FilterKeys, value: string) => {
    setFilters((prevFilters) => {
      const filterValues = prevFilters[tag] as string[];
      const isSelected = filterValues.includes(value);
      const updatedFilter = isSelected
        ? filterValues.filter((v: string) => v !== value)
        : [...filterValues, value];
      return { ...prevFilters, [tag]: updatedFilter };
    });
  };

  return (
    <div className="bg-white w-full h-full p-4 sm:p-8 min-h-screen flex justify-center">
      <div className="max-w-6xl w-full">
        <h1 className="mb-2 text-left font-display text-4xl font-bold tracking-[-0.02em] drop-shadow-sm sm:text-5xl sm:leading-[5rem]">
          Notes
        </h1>

        <div className="flex space-x-4 mb-2">
          {["all", "complete", "review"].map((status) => (
            <button
              key={status}
              onClick={() => setFilters({ ...filters, status })}
              className={cx("px-4 py-2 rounded-md", {
                "bg-white border hover:border-black border-gray-600 text-gray-500": filters.status === status,
                "bg-white hover:border-black border border-gray-300 text-gray-500": filters.status !== status,
              })}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-4">
          {["subjects", "topics", "subtopics"].map((filterType) => (
            <Popover
              key={filterType}
              content={
                <div className="w-full bg-white rounded-md p-2 sm:w-40">
                  {(filterType === "subjects"
                    ? subjects
                    : filterType === "topics"
                    ? topics
                    : subtopics
                  ).map((value) => (
                    <div key={value} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`${filterType}-${value}`}
                        className="mr-2"
                        checked={(filters[filterType as FilterKeys] as string[]).includes(value)}
                        onChange={() => handleFilterChange(filterType as FilterKeys, value)}
                      />
                      <label
                        htmlFor={`${filterType}-${value}`}
                        className="flex w-full items-center justify-start space-x-2 rounded-md p-2 text-left text-sm transition-all duration-75 hover:bg-gray-100 active:bg-gray-200"
                      >
                        {value}
                      </label>
                    </div>
                  ))}
                </div>
              }
              align="start"
              openPopover={dropdowns[filterType as DropdownKeys]}
              setOpenPopover={(open) => {
                setDropdowns((prev) => ({
                  ...prev,
                  [filterType as DropdownKeys]: open,
                }));
              }}
            >
              <button
                onClick={() =>
                  setDropdowns((prev) => ({
                    ...prev,
                    [filterType as DropdownKeys]: !prev[filterType as DropdownKeys],
                  }))
                }
                className="flex w-full sm:w-36 items-center justify-between rounded-md border border-gray-300 px-4 py-2 bg-white transition-all duration-75 hover:border-gray-800 focus:outline-none active:bg-gray-100"
              >
                <p className="text-gray-600">
                  {(filters[filterType as FilterKeys] as string[]).length
                    ? `${(filters[filterType as FilterKeys] as string[]).length} selected`
                    : filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                </p>
                <ChevronDown
                  className={`h-4 w-4 text-gray-600 transition-all ${
                    dropdowns[filterType as DropdownKeys] ? "rotate-180" : ""
                  }`}
                />
              </button>
            </Popover>
          ))}
        </div>

        {filteredNotes.length > 0 ? (
          filteredNotes.map((note, index) => (
            <div key={index} className="mb-4 p-4 border border-gray-300 rounded-md">
              <h2 className="text-xl font-bold">{note.title}</h2>
              <div dangerouslySetInnerHTML={{ __html: note.content }} />
              <div className="mt-2">
                <h3 className="font-semibold">Note:</h3>
                <p>{note.note}</p>
              </div>
              <div className="mt-2">
                <h3 className="font-semibold">Example:</h3>
                <p>{note.example}</p>
              </div>
              <div className="mt-2">
                <h3 className="font-semibold">Common Mistakes:</h3>
                <p>{note.mistakes}</p>
              </div>
            </div>
          ))
        ) : (
          <p>No notes found with the selected filters.</p>
        )}
      </div>
      <ImprovedStudyPlanner />
    </div>


  );
};

export default NotesPage;
