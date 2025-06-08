"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { downloadTextFile } from '@/lib/download';
import { summarizeContent, type SummarizeContentOutput } from '@/ai/flows/summarize-content';
import { generateSeoMetadata, type GenerateSeoMetadataOutput } from '@/ai/flows/generate-seo-metadata';
import { Loader2, ClipboardCopy, Download, BookOpen, SearchCheck, ThumbsUp } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import type { TopicFormValues } from './TopicForm';

interface ArticleActionsProps {
  articleContent: string;
  articleTopic: string;
  articleFormat: TopicFormValues['format'];
}

export function ArticleActions({ articleContent, articleTopic, articleFormat }: ArticleActionsProps) {
  const [summary, setSummary] = useState<SummarizeContentOutput | null>(null);
  const [seoMeta, setSeoMeta] = useState<GenerateSeoMetadataOutput | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isGeneratingSeo, setIsGeneratingSeo] = useState(false);
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(articleContent)
      .then(() => toast({ title: "Success", description: "Article copied to clipboard!" }))
      .catch(() => toast({ variant: "destructive", title: "Error", description: "Failed to copy article." }));
  };

  const handleDownload = () => {
    let filename = `${articleTopic.replace(/\s+/g, '_').toLowerCase()}`;
    let mimeType = 'text/plain;charset=utf-8';

    if (articleFormat === 'Markdown') {
      filename += '.md';
      mimeType = 'text/markdown;charset=utf-8';
    } else if (articleFormat === 'PDF') {
      // This assumes AI generated PDF content directly, or gives a link.
      // For now, it will download the text content as .txt if it's not a direct PDF output.
      // If AI can give actual PDF bytes, this needs adjustment.
      filename += '_content.txt'; // Fallback if direct PDF output is not handled
      toast({ title: "Info", description: "PDF download is experimental. Downloading textual content as .txt." });
    } else {
      filename += '.txt';
    }
    downloadTextFile(articleContent, filename, mimeType);
    toast({ title: "Success", description: `Article downloaded as ${filename}` });
  };

  const handleSummarize = async () => {
    setIsSummarizing(true);
    setSummary(null);
    try {
      const result = await summarizeContent({ content: articleContent });
      setSummary(result);
      toast({ title: "Success", description: "Content summarized!" });
    } catch (error) {
      console.error("Summarization error:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to summarize content." });
    }
    setIsSummarizing(false);
  };

  const handleGenerateSeo = async () => {
    setIsGeneratingSeo(true);
    setSeoMeta(null);
    try {
      const result = await generateSeoMetadata({ articleContent: articleContent, userTopic: articleTopic });
      setSeoMeta(result);
      toast({ title: "Success", description: "SEO metadata generated!" });
    } catch (error) {
      console.error("SEO generation error:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to generate SEO metadata." });
    }
    setIsGeneratingSeo(false);
  };

  return (
    <Card className="w-full shadow-xl mt-10">
      <CardHeader>
        <CardTitle className="font-headline text-2xl text-primary">Article Tools</CardTitle>
        <CardDescription>Enhance and utilize your generated content.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap gap-4">
          <Button onClick={handleCopy} variant="outline">
            <ClipboardCopy className="mr-2 h-4 w-4" /> Copy Content
          </Button>
          <Button onClick={handleDownload} variant="outline">
            <Download className="mr-2 h-4 w-4" /> Download Article
          </Button>
          <Button onClick={handleSummarize} disabled={isSummarizing} variant="outline">
            {isSummarizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BookOpen className="mr-2 h-4 w-4" />}
            {isSummarizing ? "Summarizing..." : "Summarize (500 words)"}
          </Button>
          <Button onClick={handleGenerateSeo} disabled={isGeneratingSeo} variant="outline">
            {isGeneratingSeo ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <SearchCheck className="mr-2 h-4 w-4" />}
            {isGeneratingSeo ? "Generating..." : "Generate SEO Meta"}
          </Button>
        </div>

        {summary && (
          <>
            <Separator />
            <div className="space-y-2">
              <h3 className="text-xl font-headline font-semibold">Summary</h3>
              <Textarea value={summary.summary} readOnly rows={8} className="bg-muted" />
              {summary.progress && <p className="text-sm text-muted-foreground italic mt-1">{summary.progress}</p>}
            </div>
          </>
        )}

        {seoMeta && (
          <>
            <Separator />
            <div className="space-y-4">
              <h3 className="text-xl font-headline font-semibold">SEO Metadata</h3>
              <div>
                <label htmlFor="seoTitle" className="block text-sm font-medium text-muted-foreground mb-1">SEO Title</label>
                <Input id="seoTitle" value={seoMeta.seoTitle} readOnly className="bg-muted" />
              </div>
              <div>
                <label htmlFor="metaDescription" className="block text-sm font-medium text-muted-foreground mb-1">Meta Description</label>
                <Textarea id="metaDescription" value={seoMeta.metaDescription} readOnly rows={3} className="bg-muted" />
              </div>
            </div>
          </>
        )}
         <div className="pt-4 text-center">
            <Button variant="ghost" className="text-accent hover:text-accent/90">
                <ThumbsUp className="mr-2 h-5 w-5" /> Liked this article?
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
