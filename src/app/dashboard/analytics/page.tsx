'use client';

import { useStudySession } from "@/contexts/study-session-context";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Package } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const chartConfig = {
    points: {
        label: "Points",
        color: "hsl(var(--chart-1))",
    },
} satisfies ChartConfig;

export default function AnalyticsPage() {
    const { completedSessions } = useStudySession();

    if (completedSessions.length === 0) {
        return (
            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm min-h-[calc(100vh-10rem)]">
                <div className="flex flex-col items-center gap-2 text-center">
                    <Package className="h-16 w-16 text-muted-foreground" />
                    <h3 className="text-2xl font-bold tracking-tight font-headline">
                        No Analytics Yet
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-xs">
                        Complete a study session to see your performance analytics here.
                    </p>
                    <Link href="/dashboard/create-task" className="mt-4">
                        <Button>Start a Session</Button>
                    </Link>
                </div>
            </div>
        );
    }
    
    const chartData = completedSessions.map(session => ({
        name: session.taskName.substring(0, 15) + (session.taskName.length > 15 ? '...' : ''), // Truncate name for chart
        points: session.points
    }));

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Session Performance</CardTitle>
                <CardDescription>Points earned per study session</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
                    <BarChart accessibilityLayer data={chartData}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="name"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            tickFormatter={(value) => value.substring(0, 10) + (value.length > 10 ? '...' : '')}
                        />
                        <YAxis />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent indicator="dashed" />}
                        />
                        <Bar 
                            dataKey="points" 
                            fill="var(--color-points)"
                            radius={8}
                            background={{
                                fill: 'hsl(var(--muted))',
                                radius: 8,
                            }}
                        />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
