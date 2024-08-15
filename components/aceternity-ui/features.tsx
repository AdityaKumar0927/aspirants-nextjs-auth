import React from "react";
import { GradientContainer } from "./gradient-container";
import { Container } from "./container";
import { Heading } from "./heading";
import { Subheading } from "./subheading";
import { FeatureIconContainer } from "./feature-icon-container";
import { FaBolt } from "react-icons/fa";
import {
  Card,
  CardDescription,
  CardSkeletonContainer,
  CardTitle,
} from "./card";
import { SkeletonOne } from "./first";
import { SkeletonTwo } from "./second";
import { SkeletonThree } from "./third";
import { SkeletonFour } from "./fourth";
import { SkeletonFive } from "./fifth";

export const Features = () => {
  return (
    <GradientContainer className="md:my-20 bg-black w-full border rounded-3xl">
      <Container className="py-20 max-w-5xl mx-auto  relative z-40">
        <FeatureIconContainer className="flex justify-center items-center overflow-hidden">
          <FaBolt className="h-6 w-6 text-cyan-500" />
        </FeatureIconContainer>
        <Heading className="pt-4">Automate Your Exam Prep</Heading>
        <Subheading>
          aspirants provides you tools to convert handwritten/typed PDFs of exam papers/question-banks to shareable Mock Exams & Question Banks
        </Subheading>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 py-10">
          <Card className="lg:col-span-2">
            <CardTitle>Post to multiple platforms at once</CardTitle>
            <CardDescription>
              With our AI-powered platform, you can post to multiple platforms
              at once, saving you time and effort.
            </CardDescription>
            <CardSkeletonContainer>
              <SkeletonOne />
            </CardSkeletonContainer>
          </Card>
          <Card>
            <CardSkeletonContainer className="max-w-[16rem] mx-auto">
              <SkeletonTwo />
            </CardSkeletonContainer>
            <CardTitle>Analytics for everything</CardTitle>
            <CardDescription>
              Check analytics, track your posts, and get insights into your
              audience.
            </CardDescription>
          </Card>
          <Card>
            <CardSkeletonContainer>
              <SkeletonThree />
            </CardSkeletonContainer>
            <CardTitle>Integrated AI</CardTitle>
            <CardDescription>
              Proactiv uses AI to help you create engaging content.
            </CardDescription>
          </Card>
          <Card>
            <CardSkeletonContainer
              showGradient={false}
              className="max-w-[16rem] mx-auto"
            >
              <SkeletonFour />
            </CardSkeletonContainer>
            <CardTitle>Easy Collaboration</CardTitle>
            <CardDescription>
              Proactive can integrate with Zapier, Slack and every other popular
              integration tools.
            </CardDescription>
          </Card>
          <Card>
            <CardSkeletonContainer>
              <SkeletonFive />
            </CardSkeletonContainer>
            <CardTitle>Know your audience</CardTitle>
            <CardDescription>
              Based on your audience, create funnels and drive more traffic.
            </CardDescription>
          </Card>
        </div>
      </Container>
    </GradientContainer>
  );
};
