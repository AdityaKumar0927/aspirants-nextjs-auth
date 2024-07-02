"use client"

import React, { useEffect, useState } from "react";

interface UserData {
  completedQuestions: number;
  reviewedQuestions: number;
  totalQuestions: number;
}

const Dashboard: React.FC = () => {
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const sessionResponse = await fetch("/api/auth/session");
        if (!sessionResponse.ok) throw new Error("Failed to fetch session");

        const sessionData = await sessionResponse.json();
        if (!sessionData || !sessionData.user) throw new Error("User not logged in");

        const userProgressResponse = await fetch("/api/user-progress");
        if (!userProgressResponse.ok) throw new Error("Failed to fetch user progress");

        const userProgressData = await userProgressResponse.json();

        const completedQuestions = userProgressData.filter((q: any) => q.completed).length;
        const reviewedQuestions = userProgressData.filter((q: any) => q.reviewed).length;
        const totalQuestions = userProgressData.length;

        setUserData({
          completedQuestions,
          reviewedQuestions,
          totalQuestions,
        });
      } catch (error) {
        console.error(error);
      }
    };

    fetchUserData();
  }, []);

  if (!userData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* Main content */}
      <div className="flex-1 ml-24 p-6">
        <div className="py-7 px-5 rounded-3xl bg-neutral-800">
          <div className="flex gap-5 max-md:flex-col max-md:gap-0">
            {/* Left column */}
            <div className="flex flex-col w-9/12 max-md:w-full">
              <div className="flex flex-col grow max-md:mt-10 max-md:max-w-full">
                <div className="flex gap-5 self-start text-base text-white">
                  <img
                    loading="lazy"
                    src="https://cdn.builder.io/api/v1/image/assets/TEMP/848c39246ea7a62d2f2d536d93502f6e919a846e3d6509ad77f35d1026623a2c?"
                    className="shrink-0 self-start aspect-[1.49] w-[21px]"
                    alt="Dashboard icon"
                  />
                  <div className="flex-auto">Dashboard da @say.valente</div>
                </div>
                <div className="flex gap-5 justify-between mt-5 max-md:flex-wrap">
                  <div className="shrink-0 rounded-3xl shadow-sm bg-stone-900 h-[153px] w-[245px] p-4 text-white">
                    <h3 className="text-lg">Completed Questions</h3>
                    <p className="text-2xl">{userData.completedQuestions}</p>
                  </div>
                  <div className="shrink-0 rounded-3xl shadow-sm bg-stone-900 h-[153px] w-[245px] p-4 text-white">
                    <h3 className="text-lg">Reviewed Questions</h3>
                    <p className="text-2xl">{userData.reviewedQuestions}</p>
                  </div>
                  <div className="shrink-0 rounded-3xl shadow-sm bg-stone-900 h-[153px] w-[245px] p-4 text-white">
                    <h3 className="text-lg">Total Questions</h3>
                    <p className="text-2xl">{userData.totalQuestions}</p>
                  </div>
                </div>
                <div className="mt-10 max-md:max-w-full">
                  <div className="shrink-0 rounded-3xl shadow-sm bg-stone-900 h-[195px] max-md:max-w-full" />
                </div>
                <div className="flex gap-5 mt-10 max-md:flex-wrap max-md:max-w-full">
                  <div className="shrink-0 rounded-3xl shadow-sm bg-stone-900 h-[157px] w-[386px] max-md:w-full" />
                  <div className="shrink-0 rounded-3xl shadow-sm bg-stone-900 h-[157px] w-[386px] max-md:w-full" />
                </div>
              </div>
            </div>
            
            {/* Right column */}
            <div className="flex flex-col ml-5 w-3/12 max-md:ml-0 max-md:w-full">
              <div className="flex z-10 flex-col grow max-md:mt-10">
                <img
                  loading="lazy"
                  src="https://cdn.builder.io/api/v1/image/assets/TEMP/1c97484e48f41b7fa35b48e0919b935d23e2d49d410e2ff64b8f5229efdba243?"
                  className="w-full aspect-square"
                  alt="Profile picture"
                />
                <div className="shrink-0 mt-12 rounded-3xl shadow-sm bg-stone-900 h-[273px] max-md:mt-10" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
