'use client'

import Particles from "@/components/Particles";
import { Card, CardHeader, CardDescription, CardContent, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function Page() {
    return (
        <div className="min-h-screen bg-background relative">
            {/* Fixed position background particles */}
            <div className="fixed inset-0 w-full h-full z-0">
                <Particles
                    particleColors={['#ffffff', '#ffffff']}
                    particleCount={200}
                    particleSpread={10}
                    speed={0.1}
                    particleBaseSize={100}
                    moveParticlesOnHover={true}
                    alphaParticles={false}
                    disableRotation={false}
                />
            </div>
            {/* Content wrapper */}
            <div className="relative z-10">
                <main className="mb-10">
                    <section className="container mx-auto px-4 py-16 flex flex-col items-center">
                        <div className="max-w-2xl w-full text-center space-y-6">
                            <h1 className="text-4xl font-bold mb-2">About ResQ Earth</h1>
                            <p className="text-lg text-muted-foreground">
                                ResQ Earth is an advanced space-based disaster response and monitoring platform that leverages satellite imagery and AI-powered analytics to provide real-time disaster detection, early warnings, and actionable insights for effective disaster management.
                            </p>
                        </div>
                        <Card className="max-w-2xl w-full mt-10">
                            <div className="p-6 space-y-4">
                                <h2 className="text-2xl font-semibold">Our Mission</h2>
                                <p className="text-muted-foreground">
                                    At ResQ Earth, our mission is to harness the power of space technology and artificial intelligence to enhance global disaster response capabilities. We aim to provide timely and accurate information to aid organizations and governments in mitigating the impact of natural disasters on communities worldwide.
                                </p>
                            </div>
                        </Card>
                    </section>
                    <section className="container mx-auto py-12 flex flex-col items-center">
                        <h2 className="text-2xl font-bold mb-8 text-center">Meet the Team</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 w-full justify-items-center">
                            <Card className="flex flex-col items-center text-center">
                                <CardHeader className="pb-2 flex flex-col items-center">
                                    <Users className="h-8 w-8 text-primary" />
                                    <CardTitle className="text-sm mt-2">John Doe</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <CardDescription>
                                        Lead Developer - Responsible for core architecture and backend implementation
                                    </CardDescription>
                                </CardContent>
                            </Card>
                            <Card className="flex flex-col items-center text-center">
                                <CardHeader className="pb-2 flex flex-col items-center">
                                    <Users className="h-8 w-8 text-primary" />
                                    <CardTitle className="text-sm mt-2">Jane Smith</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <CardDescription>
                                        UI/UX Designer - Created intuitive interfaces and user flows
                                    </CardDescription>
                                </CardContent>
                            </Card>
                            <Card className="flex flex-col items-center text-center">
                                <CardHeader className="pb-2 flex flex-col items-center">
                                    <Users className="h-8 w-8 text-primary" />
                                    <CardTitle className="text-sm mt-2">Alex Johnson</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <CardDescription>
                                        Data Scientist - Implemented AI models for predictive analytics
                                    </CardDescription>
                                </CardContent>
                            </Card>
                            <Card className="flex flex-col items-center text-center">
                                <CardHeader className="pb-2 flex flex-col items-center">
                                    <Users className="h-8 w-8 text-primary" />
                                    <CardTitle className="text-sm mt-2">Emily Davis</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <CardDescription>
                                        Project Manager - Coordinated team efforts and ensured timely delivery
                                    </CardDescription>
                                </CardContent>
                            </Card>
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
}