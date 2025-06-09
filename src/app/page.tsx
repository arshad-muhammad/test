// @ts-nocheck
"use client";

import { useState, useEffect } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from 'lucide-react';
import type { DetectPlagiarismOutput } from '@/ai/flows/detect-plagiarism';
import { analyzeTextForPlagiarism } from './actions';

export default function PlagiarismAnalyzerPage() {
  const [inputText, setInputText] = useState<string>('');
  const [result, setResult] = useState<DetectPlagiarismOutput | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentYear, setCurrentYear] = useState<number | null>(null);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);


  const handleSubmit = async () => {
    if (!inputText.trim()) {
      setError('Please enter some text to analyze.');
      setResult(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const analysisResult = await analyzeTextForPlagiarism({ text: inputText });
      setResult(analysisResult);
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 md:p-8 bg-background">
      <Card className="w-full max-w-2xl shadow-xl rounded-lg overflow-hidden">
        <CardHeader className="text-center bg-primary text-primary-foreground p-6">
          <CardTitle className="text-3xl md:text-4xl font-headline">Plagiarism Analyzer</CardTitle>
          <CardDescription className="font-body text-primary-foreground/90 mt-1">
            Enter your text below to check for plagiarism.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <Textarea
              placeholder="Paste your text here..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={10}
              className="font-body text-base border-input focus:ring-primary shadow-sm"
              disabled={isLoading}
              aria-label="Text input for plagiarism analysis"
            />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !inputText.trim()}
            className="w-full font-body text-lg py-3 bg-accent hover:bg-accent/90 text-accent-foreground"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Analyze Text'
            )}
          </Button>

          {error && (
            <div className="mt-4 p-4 rounded-md bg-destructive/10 border border-destructive/30 text-destructive font-body text-sm" role="alert">
              <p className="font-semibold">Error</p>
              <p>{error}</p>
            </div>
          )}

          {result && !isLoading && (
            <div className="mt-6 space-y-4 animate-in fade-in duration-500">
              <h2 className="text-2xl md:text-3xl font-headline text-center text-primary">Analysis Results</h2>
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="font-body text-xl text-center">
                    Plagiarism Detected:{' '}
                    <span className="font-bold text-accent">{result.plagiarismPercentage.toFixed(2)}%</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div>
                    <h3 className="text-lg font-semibold font-body mb-2 text-foreground/80">Analyzed Text:</h3>
                    <div
                      className="p-4 border rounded-md bg-secondary/30 font-body text-sm leading-relaxed prose-sm max-w-none overflow-y-auto max-h-96 shadow-inner"
                      dangerouslySetInnerHTML={{ __html: result.highlightedText }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
        <CardFooter className="bg-secondary/30 p-4">
           {currentYear !== null && (
             <p className="text-xs text-muted-foreground font-body text-center w-full">
               &copy; {currentYear} Plagiarism Analyzer. All rights reserved.
             </p>
           )}
        </CardFooter>
      </Card>
    </div>
  );
}
