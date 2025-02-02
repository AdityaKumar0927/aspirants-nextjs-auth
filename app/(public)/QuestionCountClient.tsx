"use client";

import useSWR from "swr";

// Simple fetcher function for SWR
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch question stats");
  }
  return res.json();
};

export default function QuestionCountClient() {
  // Using SWR to fetch the stats
  const { data, error } = useSWR("/api/questions/stats", fetcher);

  // If there's an error, just show fallback
  if (error) {
    return <span>1000+ questions</span>;
  }

  // While loading, you can show a skeleton or fallback
  if (!data) {
    return <span>Loading...</span>;
  }

  // data.total contains the count from your API
  return <span>{data.total}+ questions</span>;
}
