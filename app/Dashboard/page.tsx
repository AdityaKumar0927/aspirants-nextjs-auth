"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";

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
        if (!sessionData || !sessionData.user) {
          // Use sample data for unsigned-in users
          setUserData({
            completedQuestions: 10,
            reviewedQuestions: 5,
            totalQuestions: 20,
          });
          return;
        }

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
    <div className="flex flex-col justify-center h-10/12 w-10/12 max-w-[480px] bg-white rounded-2xl shadow-lg">
      <Image
        src="/background.png"
        alt="Background"
        layout="fill"
        objectFit="cover"
        className="rounded-2xl"
      />
      <div className="flex flex-col pt-7 pr-2.5 pb-2 pl-10 w-full backdrop-blur-[22.5px]">
        <div className="flex gap-2">
          <div className="flex flex-col grow shrink-0 basis-0 w-fit">
            <div className="flex gap-5 justify-between text-base text-center text-black whitespace-nowrap font-[590]">
              <div>Dashboard</div>
            </div>
            <div className="flex gap-4 mt-6 tracking-normal whitespace-nowrap">
              <div className="flex flex-col p-3.5 font-bold text-center text-black h-[151px] rounded-[30px] bg-white bg-opacity-20 backdrop-blur-lg border border-white border-opacity-30">
                <h3 className="text-lg">Completed Questions</h3>
                <p className="text-2xl">{userData.completedQuestions}</p>
              </div>
              <div className="flex flex-col p-3.5 font-bold text-center text-black h-[151px] rounded-[30px] bg-white bg-opacity-20 backdrop-blur-lg border border-white border-opacity-30">
                <h3 className="text-lg">Reviewed Questions</h3>
                <p className="text-2xl">{userData.reviewedQuestions}</p>
              </div>
              <div className="flex flex-col p-3.5 font-bold text-center text-black h-[151px] rounded-[30px] bg-white bg-opacity-20 backdrop-blur-lg border border-white border-opacity-30">
                <h3 className="text-lg">Total Questions</h3>
                <p className="text-2xl">{userData.totalQuestions}</p>
              </div>
            </div>
            <div className="flex gap-4 mt-4">
              <div className="flex flex-col flex-1 whitespace-nowrap">
                <div className="flex gap-4 text-xl font-bold tracking-normal text-center">
                  <button className="justify-center items-center px-5 text-black h-[68px] rounded-[100px] bg-white bg-opacity-20 backdrop-blur-lg border border-white border-opacity-30">
                    Button
                  </button>
                </div>
                <div className="flex flex-col justify-between px-3.5 pt-3.5 pb-4 mt-4 rounded-3xl bg-white bg-opacity-20 backdrop-blur-lg border border-white border-opacity-30 h-[151px]">
                  <div className="text-black font-[590] text-ellipsis">Additional Info</div>
                  <div className="font-[510] leading-[129%] text-ellipsis text-black text-opacity-30">
                    Additional details here.
                  </div>
                </div>
              </div>
              <div className="flex flex-col flex-1">
                <div className="flex gap-4">
                  <button className="flex flex-col flex-1 rounded-3xl bg-white bg-opacity-20 backdrop-blur-lg border border-white border-opacity-30">
                    <div className="shrink-0 h-16 rounded-3xl" />
                  </button>
                  <button className="flex flex-col flex-1 rounded-3xl bg-white bg-opacity-20 backdrop-blur-lg border border-white border-opacity-30">
                    <div className="shrink-0 h-24 rounded-3xl" />
                  </button>
                </div>
                <div className="flex gap-4 mt-4 text-3xl tracking-normal text-center text-black whitespace-nowrap font-[510]">
                  <button className="justify-center items-center px-5 h-[68px] rounded-[100px] bg-white bg-opacity-20 backdrop-blur-lg border border-white border-opacity-30">
                    Button
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col justify-center self-center mt-56 max-w-full w-[139px]">
          <div className="shrink-0 bg-black h-[5px] rounded-[100px]" />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
