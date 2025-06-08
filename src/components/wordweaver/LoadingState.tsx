"use client";

import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = "Generating your article, please wait..." }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-8 bg-card rounded-lg shadow-xl my-10 min-h-[300px]">
      <Loader2 className="h-16 w-16 animate-spin text-primary" />
      <p className="text-xl font-headline text-foreground">{message}</p>
      <p className="text-muted-foreground">This may take a few moments as our AI weaves its magic.</p>
    </div>
  );
}
