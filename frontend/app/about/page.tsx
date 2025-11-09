'use client'

import Particles from "@/components/Particles";
import { Card, CardHeader, CardDescription, CardContent, CardTitle } from "@/components/ui/card";

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
                                The frontend of ResQ-Earth features an interactive 3D Earth interface that visualizes real-time wildfire, flood, and thunderstorm data. It provides a smooth, user-friendly experience where disaster markers update automatically as new satellite data arrives. Users can easily navigate the globe, view active alerts, and access essential information instantly. The interface also integrates the alert system and chatbot, making the platform accessible and intuitive for all users.
                            </p>
                        </div>
                        <Card className="max-w-2xl w-full mt-10">
                            <div className="p-6 space-y-4">
                                <h2 className="text-2xl font-semibold">Our Mission</h2>
                                <p className="text-muted-foreground">
                                    Our mission is to provide communities with fast, reliable, and accessible disaster information by unifying real-time satellite data, weather alerts, and prevention tools into one simple platform. We aim to empower people with early awareness so they can stay safe, prepared, and protected from environmental threats.
                                </p>
                            </div>
                        </Card>
                    </section>
                </main>
            </div>
        </div>
    );
}