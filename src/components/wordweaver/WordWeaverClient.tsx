
"use client";

import React, { useState, useTransition, useRef } from 'react';
import { TopicForm, type TopicFormValues } from './TopicForm';
import { LoadingState } from './LoadingState';
import { ArticleDisplay } from './ArticleDisplay';
import { ArticleActions } from './ArticleActions';
import { generateArticle, type GenerateArticleOutput as InitialArticleOutput } from '@/ai/flows/generate-article';
import { extendAndFinalizeArticle, type ExtendAndFinalizeArticleOutput } from '@/ai/flows/extend-and-finalize-article-flow';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { BrandIcon } from '@/components/icons/BrandIcon';
import { useToast } from "@/hooks/use-toast";

export function WordWeaverClient() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Generating your article, please wait...");
  const [finalArticle, setFinalArticle] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<TopicFormValues | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const articleContentRef = useRef<HTMLDivElement>(null);

  const handleFormSubmit = async (values: TopicFormValues) => {
    setFormValues(values);
    setError(null);
    setFinalArticle(null); 
    
    startTransition(async () => {
      setIsLoading(true);
      try {
        setLoadingMessage("Generating initial draft (approx. 4000 words)...");
        const initialResult: InitialArticleOutput = await generateArticle({
          user_topic: values.user_topic,
          tone: values.tone,
          format: values.format,
        });

        setLoadingMessage("Extending content and finalizing references (approx. 2000-3000 more words)...");
        const finalResult: ExtendAndFinalizeArticleOutput = await extendAndFinalizeArticle({
          initialArticleContent: initialResult.articleContent,
          userTopic: values.user_topic,
          tone: values.tone,
          format: values.format,
        });
        
        setFinalArticle(finalResult.finalFullArticle);
        toast({ title: "Article Generated!", description: "Your masterpiece is ready.", duration: 5000 });

      } catch (err) {
        console.error("Article generation process error:", err);
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during article generation.";
        setError(errorMessage);
        toast({ variant: "destructive", title: "Generation Failed", description: errorMessage, duration: 8000 });
      } finally {
        setIsLoading(false);
        setLoadingMessage("Generating your article, please wait..."); // Reset message
      }
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
      <header className="mb-10 text-center">
        <div className="flex items-center justify-center space-x-3 mb-2">
          <BrandIcon className="h-10 w-10 text-primary" />
          <h1 className="text-5xl font-headline font-bold text-primary">
            WordWeaver <span className="text-accent">AI</span>
          </h1>
        </div>
        <p className="text-xl text-muted-foreground">
          Craft compelling, long-form articles with the power of AI.
        </p>
      </header>

      <main>
        {!finalArticle && !isLoading && (
            <TopicForm onSubmit={handleFormSubmit} isSubmitting={isLoading || isPending} />
        )}
        
        {(isLoading || isPending) && <LoadingState message={loadingMessage} />}

        {error && !isLoading && (
          <Alert variant="destructive" className="my-8">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Error Generating Article</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {finalArticle && formValues && !isLoading && (
          <>
            <ArticleDisplay
              articleContent={finalArticle}
              format={formValues.format}
              title={`Article on: ${formValues.user_topic}`}
              contentRef={articleContentRef}
            />
            <ArticleActions
              articleContent={finalArticle}
              articleTopic={formValues.user_topic}
              articleFormat={formValues.format}
              contentRef={articleContentRef}
            />
             <div className="mt-8 text-center">
                <button 
                    onClick={() => {
                        setFinalArticle(null);
                        setError(null);
                        setFormValues(null);
                    }}
                    className="text-primary hover:underline font-medium"
                >
                    Generate another article
                </button>
            </div>
          </>
        )}
      </main>

      <footer className="mt-16 pt-8 border-t border-border text-center">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} WordWeaver AI. Weaving words, powered by Gemini.
        </p>
      </footer>
    </div>
  );
}
