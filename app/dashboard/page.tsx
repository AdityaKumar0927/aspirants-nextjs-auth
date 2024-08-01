"use client"

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MainNav } from "@/app/dashboard/main-nav";
import { Search } from "@/app/dashboard/search";
import TeamSwitcher from "@/app/dashboard/team-switcher";
import { UserNav } from "@/app/dashboard/user-nav";
import { useState, useEffect } from 'react';


export default function DashboardPage() {
  const [questionBanks, setQuestionBanks] = useState([]);

  useEffect(() => {
    const fetchQuestionBanks = async () => {
      const response = await fetch(`/api/question-bank/get?userId=userId_placeholder`);
      const data = await response.json();
      setQuestionBanks(data);
    };

    fetchQuestionBanks();
  }, []);

  return (
    <>
      <div className="w-10/12 mb-auto p-10">
        <div className="md:hidden">
          <Image
            src="/examples/dashboard-light.png"
            width={1280}
            height={866}
            alt="Dashboard"
            className="block dark:hidden"
          />
          <Image
            src="/examples/dashboard-dark.png"
            width={1280}
            height={866}
            alt="Dashboard"
            className="hidden dark:block"
          />
        </div>
        <div className="hidden flex-col md:flex">
          <div className="border-b">
            <div className="flex h-16 items-center px-4">
              <TeamSwitcher />
              <MainNav className="mx-6" />
              <div className="ml-auto flex items-center space-x-4">
                <Search />
                <UserNav />
              </div>
            </div>
          </div>
          <div className="flex-1 space-y-4 p-8 pt-6">
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="analytics" disabled>
                  Analytics
                </TabsTrigger>
                <TabsTrigger value="reports" disabled>
                  Reports
                </TabsTrigger>
                <TabsTrigger value="notifications" disabled>
                  Notifications
                  </TabsTrigger>
                </TabsList>
              <TabsContent value="overview" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {questionBanks.map((bank: any) => (
                    <Card key={bank.id}>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          {bank.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{bank.title}</div>
                        <p className="text-xs text-muted-foreground">
                          {bank.questions.length} Questions
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </>
  );
}
