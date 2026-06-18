"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  ChevronUp,
  Plus,
  Search,
  SortAsc,
  SortDesc,
  ThumbsUp,
  MessageSquare,
  Tag,
  User,
  Calendar,
  Send,
  Trash2,
  Lightbulb,
} from "lucide-react";
import { useForm, SubmitHandler } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast, Toaster } from "react-hot-toast";
import T from "@/components/i18n/T";

type Status = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "REJECTED";

interface FeatureRequest {
  id: string;
  title: string;
  description: string;
  status: Status;
  votes: number;
  comments: number;
  category: string;
  tags: string[];
  submittedBy: string;
  submittedDate: string;
  hasVoted: boolean;
  mine: boolean;
}

interface Comment {
  id: string;
  author: string;
  content: string;
  date: string;
}

const CATEGORIES = ["UI/UX", "Integrations", "Performance", "Security", "Content", "Other"] as const;

const STATUS_META: Record<Status, { label: string; className: string }> = {
  PENDING: { label: "Pending", className: "bg-secondary text-pencil" },
  IN_PROGRESS: { label: "In progress", className: "bg-ballpoint/10 text-ballpoint" },
  COMPLETED: { label: "Completed", className: "bg-st-answered/15 text-st-answered" },
  REJECTED: { label: "Not planned", className: "bg-redpen/10 text-redpen" },
};

const featureRequestSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters long"),
  description: z.string().min(20, "Description must be at least 20 characters long"),
  category: z.string().min(1, "Please select a category"),
  tags: z
    .string()
    .optional()
    .transform((val) =>
      (val ?? "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    ),
});

type FeatureRequestFormInput = z.input<typeof featureRequestSchema>;
type FeatureRequestFormData = z.output<typeof featureRequestSchema>;

export default function FeatureRequestPage() {
  const [featureRequests, setFeatureRequests] = useState<FeatureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeature, setSelectedFeature] = useState<FeatureRequest | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [posting, setPosting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"votes" | "date">("votes");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setFocus,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FeatureRequestFormInput, unknown, FeatureRequestFormData>({
    resolver: zodResolver(featureRequestSchema),
  });
  const category = watch("category");
  const composerRef = useRef<HTMLDivElement>(null);

  const fetchRequests = useCallback(async () => {
    try {
      const res = await fetch("/api/feature-requests", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load");
      setFeatureRequests(await res.json());
    } catch {
      toast.error("Couldn’t load feature requests.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleNewFeatureSubmit: SubmitHandler<FeatureRequestFormData> = async (data) => {
    try {
      const res = await fetch("/api/feature-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.status === 401) {
        toast.error("Please sign in to submit a request.");
        return;
      }
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e?.error || "Submit failed");
      }
      reset();
      toast.success("Feature request submitted!");
      fetchRequests();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  const handleVote = async (id: string) => {
    try {
      const res = await fetch(`/api/feature-requests/${id}/vote`, { method: "POST" });
      if (res.status === 401) {
        toast.error("Please sign in to vote.");
        return;
      }
      if (!res.ok) throw new Error("Vote failed");
      const { votes, hasVoted } = (await res.json()) as { votes: number; hasVoted: boolean };
      setFeatureRequests((prev) =>
        prev.map((f) => (f.id === id ? { ...f, votes, hasVoted } : f))
      );
      setSelectedFeature((prev) => (prev && prev.id === id ? { ...prev, votes, hasVoted } : prev));
    } catch {
      toast.error("Couldn’t register your vote.");
    }
  };

  const handleFeatureClick = async (feature: FeatureRequest) => {
    setSelectedFeature(feature);
    setComments([]);
    try {
      const res = await fetch(`/api/feature-requests/${feature.id}/comments`, { cache: "no-store" });
      if (res.ok) setComments(await res.json());
    } catch {
      /* non-fatal */
    }
  };

  const addComment = async () => {
    if (!selectedFeature || !commentText.trim()) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/feature-requests/${selectedFeature.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentText.trim() }),
      });
      if (res.status === 401) {
        toast.error("Please sign in to comment.");
        return;
      }
      if (!res.ok) throw new Error("Comment failed");
      const created = (await res.json()) as Comment;
      setComments((prev) => [...prev, created]);
      setCommentText("");
      setFeatureRequests((prev) =>
        prev.map((f) =>
          f.id === selectedFeature.id ? { ...f, comments: f.comments + 1 } : f
        )
      );
    } catch {
      toast.error("Couldn’t post your comment.");
    } finally {
      setPosting(false);
    }
  };

  const deleteOwnRequest = async () => {
    if (!selectedFeature) return;
    if (!window.confirm("Permanently delete your feature request? This can’t be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/feature-requests/${selectedFeature.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setFeatureRequests((prev) => prev.filter((f) => f.id !== selectedFeature.id));
      setSelectedFeature(null);
      toast.success("Your feature request was deleted.");
    } catch {
      toast.error("Couldn’t delete your request. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const filteredAndSortedFeatures = featureRequests
    .filter(
      (feature) =>
        (selectedCategory === "all" || feature.category === selectedCategory) &&
        (selectedStatus === "all" || feature.status === selectedStatus) &&
        (feature.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          feature.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          feature.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())))
    )
    .sort((a, b) => {
      if (sortBy === "votes") {
        return sortOrder === "asc" ? a.votes - b.votes : b.votes - a.votes;
      }
      return sortOrder === "asc"
        ? new Date(a.submittedDate).getTime() - new Date(b.submittedDate).getTime()
        : new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime();
    });

  return (
    <div className="container mx-auto px-4 py-8">
      <Toaster position="top-right" />
      <h1 className="type-display text-3xl text-ink sm:text-4xl mb-8">
        <T k="auto.featureRequestsPage.featureRequests" />
      </h1>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 md:gap-0">
        <div className="flex w-full flex-wrap items-center gap-2 md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pencil" />
            <Input
              type="text"
              placeholder="Search feature requests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[calc(50%-0.25rem)] sm:w-[170px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <T k="auto.featureRequestsPage.allCategories" />
              </SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[calc(50%-0.25rem)] sm:w-[170px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <T k="auto.featureRequestsPage.allStatuses" />
              </SelectItem>
              {(Object.keys(STATUS_META) as Status[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_META[s].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 md:w-auto">
          <Button
            variant={sortBy === "votes" ? "default" : "outline"}
            size="sm"
            aria-pressed={sortBy === "votes"}
            onClick={() => setSortBy("votes")}
          >
            <ThumbsUp className="mr-2 h-4 w-4" />
            Most voted
          </Button>
          <Button
            variant={sortBy === "date" ? "default" : "outline"}
            size="sm"
            aria-pressed={sortBy === "date"}
            onClick={() => setSortBy("date")}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Newest
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          >
            {sortOrder === "asc" ? (
              <SortAsc className="mr-2 h-4 w-4" />
            ) : (
              <SortDesc className="mr-2 h-4 w-4" />
            )}
            {sortOrder === "asc" ? "Ascending" : "Descending"}
          </Button>
          <Button
            onClick={() => {
              composerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
              setTimeout(() => setFocus("title"), 350);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            <T k="auto.featureRequestsPage.newFeatureRequest" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ScrollArea className="h-[60vh] md:h-[800px] rounded-md border border-rule p-4">
          {loading ? (
            <p className="py-12 text-center text-sm text-pencil">Loading…</p>
          ) : filteredAndSortedFeatures.length === 0 ? (
            <div className="py-16 text-center">
              <p className="type-display text-lg text-ink">No requests yet</p>
              <p className="mt-1 text-sm text-pencil">Be the first to suggest a feature.</p>
            </div>
          ) : (
            <AnimatePresence>
              {filteredAndSortedFeatures.map((feature) => (
                <motion.div
                  key={feature.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card
                    className="mb-4 cursor-pointer transition-shadow duration-200 hover:shadow-md"
                    onClick={() => handleFeatureClick(feature)}
                  >
                    <CardHeader>
                      <CardTitle className="flex items-start justify-between gap-3">
                        <span>{feature.title}</span>
                        <Badge className={STATUS_META[feature.status].className}>
                          {STATUS_META[feature.status].label}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="line-clamp-2">{feature.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-pencil">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVote(feature.id);
                          }}
                          className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 transition-colors hover:text-ballpoint ${
                            feature.hasVoted ? "text-ballpoint" : ""
                          }`}
                          aria-pressed={feature.hasVoted}
                        >
                          <ChevronUp className="h-4 w-4" />
                          {feature.votes}
                        </button>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          {feature.comments}
                        </span>
                        <span className="flex items-center gap-1">
                          <Tag className="h-4 w-4" />
                          {feature.category}
                        </span>
                      </div>
                    </CardContent>
                    <CardFooter className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-pencil">
                        <User className="h-4 w-4" />
                        <span>{feature.submittedBy}</span>
                      </div>
                      <div className="text-sm text-pencil">
                        {format(new Date(feature.submittedDate), "MMM d, yyyy")}
                      </div>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </ScrollArea>

        <div className="flex flex-col gap-6 md:h-[800px]">
          <Card className="flex flex-col md:min-h-0 md:flex-1">
          <CardHeader className="pb-3">
            <CardTitle>
              <T k="auto.featureRequestsPage.featureDetails" />
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-grow overflow-auto">
            {selectedFeature ? (
              <div className="space-y-4">
                <h2 className="type-display text-2xl text-ink">{selectedFeature.title}</h2>
                <p className="text-pencil">{selectedFeature.description}</p>
                {selectedFeature.tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    {selectedFeature.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <Button
                    size="sm"
                    variant={selectedFeature.hasVoted ? "default" : "outline"}
                    onClick={() => handleVote(selectedFeature.id)}
                  >
                    <ChevronUp className="mr-1 h-4 w-4" />
                    {selectedFeature.hasVoted ? "Upvoted" : "Upvote"} ({selectedFeature.votes})
                  </Button>
                  <Badge className={STATUS_META[selectedFeature.status].className}>
                    {STATUS_META[selectedFeature.status].label}
                  </Badge>
                </div>
                {selectedFeature.mine && (
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={deleteOwnRequest}
                      disabled={deleting}
                      className="text-redpen hover:bg-redpen/10 hover:text-redpen"
                    >
                      <Trash2 className="mr-1.5 h-4 w-4" />
                      {deleting ? "Deleting…" : "Delete my request"}
                    </Button>
                  </div>
                )}
                <Separator />
                <h3 className="type-display text-lg text-ink">
                  <T k="auto.featureRequestsPage.comments" /> ({comments.length})
                </h3>
                <div className="flex items-end gap-2">
                  <Textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment…"
                    rows={2}
                    className="min-h-0"
                  />
                  <Button size="icon" onClick={addComment} disabled={posting || !commentText.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <ScrollArea className="h-64 rounded-md border border-rule p-4">
                  {comments.length === 0 ? (
                    <p className="text-sm text-pencil">No comments yet — start the conversation.</p>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="mb-4">
                        <div className="mb-1 flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback>{comment.author[0]?.toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-ink">{comment.author}</span>
                          <span className="text-sm text-pencil">
                            {format(new Date(comment.date), "MMM d, yyyy")}
                          </span>
                        </div>
                        <p className="text-sm text-pencil">{comment.content}</p>
                      </div>
                    ))
                  )}
                </ScrollArea>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-pencil">
                <T k="auto.featureRequestsPage.selectAFeatureRequestTo" />
              </div>
            )}
          </CardContent>
          </Card>

          {/* Inline new-request composer — replaces the old modal; lives under Feature details. */}
          <Card ref={composerRef} className="shrink-0">
            <CardHeader>
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ballpoint/10 text-ballpoint">
                  <Lightbulb className="h-5 w-5" />
                </span>
                <div className="space-y-1">
                  <CardTitle className="type-display text-lg text-ink">
                    <T k="auto.featureRequestsPage.submitANewFeatureRequest" />
                  </CardTitle>
                  <CardDescription>
                    <T k="auto.featureRequestsPage.describeTheFeatureYouD" />
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(handleNewFeatureSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="fr-title">
                    <T k="auto.featureRequestsPage.title" />
                  </Label>
                  <Input id="fr-title" placeholder="A short, clear summary" className="bg-paper" {...register("title")} />
                  {errors.title && <p className="text-xs text-redpen">{errors.title.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fr-description">
                    <T k="auto.featureRequestsPage.description" />
                  </Label>
                  <Textarea
                    id="fr-description"
                    rows={5}
                    placeholder="What should it do, and what problem does it solve?"
                    className="resize-none bg-paper"
                    {...register("description")}
                  />
                  {errors.description && <p className="text-xs text-redpen">{errors.description.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>
                    <T k="auto.featureRequestsPage.category" />
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((c) => {
                      const active = category === c;
                      return (
                        <button
                          key={c}
                          type="button"
                          aria-pressed={active}
                          onClick={() => setValue("category", c, { shouldValidate: true })}
                          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                            active
                              ? "border-ballpoint bg-ballpoint text-paper"
                              : "border-rule bg-paper text-pencil hover:border-ballpoint/50 hover:text-ink"
                          }`}
                        >
                          {c}
                        </button>
                      );
                    })}
                  </div>
                  {errors.category && <p className="text-xs text-redpen">{errors.category.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fr-tags">
                    <T k="auto.featureRequestsPage.tagsCommaSeparated" />
                  </Label>
                  <div className="relative">
                    <Tag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pencil" />
                    <Input id="fr-tags" placeholder="e.g. dark-mode, mobile" className="bg-paper pl-9" {...register("tags")} />
                  </div>
                  <p className="type-data text-[11px] text-pencil">Optional — separate with commas.</p>
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? (
                    "Submitting…"
                  ) : (
                    <span className="inline-flex items-center">
                      <Send className="mr-2 h-4 w-4" />
                      <T k="auto.featureRequestsPage.submitRequest" />
                    </span>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
