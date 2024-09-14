"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  ChevronUp,
  ChevronDown,
  Plus,
  X,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  ThumbsUp,
  MessageSquare,
  Tag,
  User,
  Calendar,
} from 'lucide-react';
import { useForm, SubmitHandler } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast, Toaster } from 'react-hot-toast';

// Types
interface FeatureRequest {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'rejected';
  votes: number;
  comments: number;
  category: string;
  submittedBy: string;
  submittedDate: string;
  tags: string[];
}

interface Comment {
  id: number;
  author: string;
  content: string;
  date: string;
}

// Zod schema for form validation
const featureRequestSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters long'),
  description: z.string().min(20, 'Description must be at least 20 characters long'),
  category: z.string().min(1, 'Please select a category'),
  tags: z.string().transform(val => val.split(',').map(tag => tag.trim())),
});

type FeatureRequestFormData = z.infer<typeof featureRequestSchema>;

// Mock data
const mockFeatureRequests: FeatureRequest[] = [
  {
    id: 1,
    title: 'Dark mode support',
    description: 'Implement a dark mode option for better visibility in low-light environments.',
    status: 'in-progress',
    votes: 120,
    comments: 15,
    category: 'UI/UX',
    submittedBy: 'Alice Johnson',
    submittedDate: '2023-05-15',
    tags: ['dark-mode', 'accessibility'],
  },
  {
    id: 2,
    title: 'Integration with Slack',
    description: 'Add the ability to receive notifications and updates via Slack.',
    status: 'pending',
    votes: 85,
    comments: 8,
    category: 'Integrations',
    submittedBy: 'Bob Smith',
    submittedDate: '2023-05-20',
    tags: ['slack', 'notifications'],
  },
  // Add more mock data as needed
];

const mockComments: Comment[] = [
  {
    id: 1,
    author: 'Alice Johnson',
    content: 'This would be a great addition! Looking forward to it.',
    date: '2023-05-16',
  },
  {
    id: 2,
    author: 'Bob Smith',
    content: 'I agree, dark mode is essential for reducing eye strain.',
    date: '2023-05-17',
  },
  // Add more mock comments as needed
];

export default function FeatureRequestPage() {
  const [featureRequests, setFeatureRequests] = useState<FeatureRequest[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<FeatureRequest | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'votes' | 'date'>('votes');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FeatureRequestFormData>({
    resolver: zodResolver(featureRequestSchema),
  });

  useEffect(() => {
    // Simulating API call to fetch feature requests
    setTimeout(() => {
      setFeatureRequests(mockFeatureRequests);
    }, 1000);
  }, []);

  const handleNewFeatureSubmit: SubmitHandler<FeatureRequestFormData> = (data) => {
    const newFeature: FeatureRequest = {
      id: featureRequests.length + 1,
      title: data.title,
      description: data.description,
      status: 'pending',
      votes: 0,
      comments: 0,
      category: data.category,
      submittedBy: 'Current User', // Replace with actual user data
      submittedDate: new Date().toISOString().split('T')[0],
      tags: data.tags,
    };

    setFeatureRequests([...featureRequests, newFeature]);
    setIsModalOpen(false);
    reset();
    toast.success('Feature request submitted successfully!');
  };

  const handleVote = (id: number, increment: boolean) => {
    setFeatureRequests(featureRequests.map(feature =>
      feature.id === id ? { ...feature, votes: feature.votes + (increment ? 1 : -1) } : feature
    ));
  };

  const handleFeatureClick = (feature: FeatureRequest) => {
    setSelectedFeature(feature);
    // Simulating API call to fetch comments
    setTimeout(() => {
      setComments(mockComments);
    }, 500);
  };

  const filteredAndSortedFeatures = featureRequests
    .filter(feature =>
      (selectedCategory === 'all' || feature.category === selectedCategory) &&
      (selectedStatus === 'all' || feature.status === selectedStatus) &&
      (feature.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
       feature.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
       feature.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
    )
    .sort((a, b) => {
      if (sortBy === 'votes') {
        return sortOrder === 'asc' ? a.votes - b.votes : b.votes - a.votes;
      } else {
        return sortOrder === 'asc'
          ? new Date(a.submittedDate).getTime() - new Date(b.submittedDate).getTime()
          : new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime();
      }
    });

  return (
    <div className="container mx-auto px-4 py-8">
      <Toaster position="top-right" />
      <h1 className="text-4xl font-bold mb-8">Feature Requests</h1>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
        <div className="flex items-center space-x-2">
          <Input
            type="text"
            placeholder="Search feature requests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64"
          />
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="UI/UX">UI/UX</SelectItem>
              <SelectItem value="Integrations">Integrations</SelectItem>
              <SelectItem value="Performance">Performance</SelectItem>
              <SelectItem value="Security">Security</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortBy(sortBy === 'votes' ? 'date' : 'votes')}
          >
            {sortBy === 'votes' ? <ThumbsUp className="mr-2 h-4 w-4" /> : <Calendar className="mr-2 h-4 w-4" />}
            Sort by {sortBy === 'votes' ? 'Votes' : 'Date'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? <SortAsc className="mr-2 h-4 w-4" /> : <SortDesc className="mr-2 h-4 w-4" />}
            {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          </Button>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Feature Request
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Submit a New Feature Request</DialogTitle>
                <DialogDescription>
                  Describe the feature you&apos;d like to see implemented. Be as detailed as possible.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(handleNewFeatureSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" {...register('title')} />
                  {errors.title && <p className="text-red-500 text-sm">{errors.title.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" {...register('description')} />
                  {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select onValueChange={(value) => register('category').onChange({ target: { value } })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UI/UX">UI/UX</SelectItem>
                      <SelectItem value="Integrations">Integrations</SelectItem>
                      <SelectItem value="Performance">Performance</SelectItem>
                      <SelectItem value="Security">Security</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.category && <p className="text-red-500 text-sm">{errors.category.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input id="tags" {...register('tags')} />
                </div>
                <Button type="submit">Submit Request</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ScrollArea className="h-[800px] rounded-md border p-4">
          <AnimatePresence>
            {filteredAndSortedFeatures.map((feature) => (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="mb-4 cursor-pointer hover:shadow-md transition-shadow duration-200" onClick={() => handleFeatureClick(feature)}>
                  <CardHeader>
                    <CardTitle className="flex justify-between items-start">
                      <span>{feature.title}</span>
                      <Badge variant={feature.status === 'completed' ? 'default' : 'outline'}>
                        {feature.status}
                      </Badge>
                    </CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <ThumbsUp className="mr-1 h-4 w-4" />
                        {feature.votes}
                      </span>
                      <span className="flex items-center">
                        <MessageSquare className="mr-1 h-4 w-4" />
                        {feature.comments}
                      </span>
                      <span className="flex items-center">
                        <Tag className="mr-1 h-4 w-4" />
                        {feature.category}
                      </span>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between items-center">
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <User className="h-4 w-4" />
                      <span>{feature.submittedBy}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {format(new Date(feature.submittedDate), 'MMM d, yyyy')}
                    </div>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </ScrollArea>

        <Card className="h-[800px] flex flex-col">
          <CardHeader>
            <CardTitle>Feature Details</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow overflow-auto">
            {selectedFeature ? (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">{selectedFeature.title}</h2>
                <p>{selectedFeature.description}</p>
                <div className="flex items-center space-x-2">
                  {selectedFeature.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleVote(selectedFeature.id, true)}
                    >
                      <ChevronUp className="mr-1 h-4 w-4" />
                      Upvote ({selectedFeature.votes})
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleVote(selectedFeature.id, false)}
                    >
                      <ChevronDown className="mr-1 h-4 w-4" />
                      Downvote
                    </Button>
                  </div>
                  <Badge variant={selectedFeature.status === 'completed' ? 'default' : 'outline'}>
                    {selectedFeature.status}
                  </Badge>
                </div>
                <Separator />
                <h3 className="text-xl font-semibold">Comments</h3>
                <ScrollArea className="h-64 rounded-md border p-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="mb-4">
                      <div className="flex items-center space-x-2 mb-1">
                        <Avatar>
                          <AvatarFallback>{comment.author[0]}</AvatarFallback>
                        </Avatar>
                        <span className="font-semibold">{comment.author}</span>
                        <span className="text-sm text-gray-500">
                          {format(new Date(comment.date), 'MMM d, yyyy')}
                        </span>
                      </div>
                      <p className="text-gray-700">{comment.content}</p>
                    </div>
                  ))}
                </ScrollArea>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Select a feature request to view details
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
