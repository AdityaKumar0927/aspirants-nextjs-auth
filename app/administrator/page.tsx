import Link from "next/link"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  BookOpen,
  Users,
  MessageSquare,
  Bell,
  Settings,
  PlusCircle,
  Search,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  ChevronRight,
} from "lucide-react"

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-grid">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Image
                src="https://sjc.microlink.io/85UjeBAnuJ0sCiUSUuyzlEwWuZ3PoqATpiYYhXIgLLxNK5ctKjvj_Vq4_rvCSPXcXAnxoUDogGgSZTHszenNFQ.jpeg"
                alt="Aspirants Logo"
                width={32}
                height={32}
                className="w-8 h-8"
              />
              <span className="ml-2 text-lg font-semibold text-gray-900">
                aspirants<span className="text-blue-600">.tech</span>
              </span>
            </div>
            <nav className="hidden md:flex space-x-8">
              <NavLink href="#" active>
                Overview
              </NavLink>
              <NavLink href="#">Questions</NavLink>
              <NavLink href="#">Users</NavLink>
              <NavLink href="#">Reports</NavLink>
            </nav>
            <div className="flex items-center">
              <button className="p-2 text-gray-400 hover:text-gray-500">
                <Bell className="h-5 w-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-500 ml-4">
                <Settings className="h-5 w-5" />
              </button>
              <div className="ml-4 flex items-center">
                <Image
                  className="h-8 w-8 rounded-full"
                  src="https://sjc.microlink.io/85UjeBAnuJ0sCiUSUuyzlEwWuZ3PoqATpiYYhXIgLLxNK5ctKjvj_Vq4_rvCSPXcXAnxoUDogGgSZTHszenNFQ.jpeg"
                  alt="User avatar"
                  width={32}
                  height={32}
                />
                <span className="ml-2 text-sm font-medium text-gray-700">Admin</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">Administrator Dashboard</h1>
          <div className="flex space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            <Button className="rounded-full">
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Question
            </Button>
          </div>
        </div>

        <div className="grid gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Question Bank"
            value="1,234"
            change="+12 today"
            trend="up"
            icon={<BookOpen className="h-6 w-6" />}
          />
          <StatCard
            title="Active Users"
            value="5,678"
            change="+89 this week"
            trend="up"
            icon={<Users className="h-6 w-6" />}
          />
          <StatCard
            title="Open Reports"
            value="23"
            change="5 urgent"
            trend="neutral"
            urgent
            icon={<MessageSquare className="h-6 w-6" />}
          />
          <StatCard
            title="Success Rate"
            value="94.2%"
            change="+2.1% this week"
            trend="up"
            icon={<TrendingUp className="h-6 w-6" />}
          />
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Questions</h2>
          </div>
          <div className="divide-y divide-gray-200">
            <QuestionItem
              id="Q-1234"
              title="Orthocenter of a Triangle"
              subject="Mathematics"
              difficulty="Medium"
              tags={["JEE", "Geometry"]}
              status="Active"
            />
            <QuestionItem
              id="Q-1233"
              title="Newton's Laws of Motion"
              subject="Physics"
              difficulty="Hard"
              tags={["NEET", "Mechanics"]}
              status="Review"
            />
            <QuestionItem
              id="Q-1232"
              title="Organic Chemistry Basics"
              subject="Chemistry"
              difficulty="Easy"
              tags={["JEE", "Organic"]}
              status="Active"
            />
          </div>
          <div className="px-6 py-4 bg-gray-50">
            <Button variant="outline" className="w-full justify-center">
              View All Questions
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}

function NavLink({ href, children, active = false }: { href: string; children: React.ReactNode; active?: boolean }) {
  return (
    <Link
      href={href}
      className={`text-sm font-medium ${
        active ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-900"
      } px-1 py-4`}
    >
      {children}
    </Link>
  )
}

function StatCard({
  title,
  value,
  change,
  trend,
  urgent,
  icon,
}: {
  title: string
  value: string
  change: string
  trend: "up" | "down" | "neutral"
  urgent?: boolean
  icon: React.ReactNode
}) {
  return (
    <Card className="p-6 hover-lift">
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 rounded-full bg-blue-100 text-blue-600">{icon}</div>
        <div
          className={`text-sm font-medium ${
            urgent
              ? "text-red-600 bg-red-100"
              : trend === "up"
                ? "text-green-600 bg-green-100"
                : trend === "down"
                  ? "text-red-600 bg-red-100"
                  : "text-gray-600 bg-gray-100"
          } px-2 py-1 rounded-full`}
        >
          {change}
        </div>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{value}</h3>
      <p className="text-sm text-gray-500">{title}</p>
    </Card>
  )
}

function QuestionItem({
  id,
  title,
  subject,
  difficulty,
  tags,
  status,
}: {
  id: string
  title: string
  subject: string
  difficulty: string
  tags: string[]
  status: "Active" | "Review"
}) {
  return (
    <div className="flex items-center justify-between py-4 px-6 hover:bg-gray-50 transition-colors">
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
            {id.split("-")[1]}
          </div>
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-900">{title}</h4>
          <div className="mt-1 flex items-center space-x-2 text-xs text-gray-500">
            <span>{subject}</span>
            <span>•</span>
            <span>{difficulty}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <div className="flex space-x-2">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs px-2 py-1">
              {tag}
            </Badge>
          ))}
        </div>
        <Badge variant={status === "Active" ? "default" : "secondary"} className="text-xs px-2 py-1">
          {status}
        </Badge>
        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-500">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

