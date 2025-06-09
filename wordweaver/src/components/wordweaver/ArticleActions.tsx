"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { downloadTextFile } from '@/lib/download';
import { summarizeContent, type SummarizeContentOutput } from '@/ai/flows/summarize-content';
import { generateSeoMetadata, type GenerateSeoMetadataOutput } from '@/ai/flows/generate-seo-metadata';
import { Loader2, ClipboardCopy, Download, BookOpen, SearchCheck, ThumbsUp } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import type { TopicFormValues } from './TopicForm';
import jsPDF from 'jspdf';
// html2canvas is imported by jsPDF.html method if available, ensure it's installed.
// dompurify is also used by jsPDF.html method if available, ensure it's installed.


interface ArticleActionsProps {
  articleContent: string;
  articleTopic: string;
  articleFormat: TopicFormValues['format'];
  contentRef: React.RefObject<HTMLDivElement>; // Ref to the article content display element
}

export function ArticleActions({ articleContent, articleTopic, articleFormat, contentRef }: ArticleActionsProps) {
  const [summary, setSummary] = useState<SummarizeContentOutput | null>(null);
  const [seoMeta, setSeoMeta] = useState<GenerateSeoMetadataOutput | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isGeneratingSeo, setIsGeneratingSeo] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(articleContent)
      .then(() => toast({ title: "Success", description: "Article copied to clipboard!" }))
      .catch(() => toast({ variant: "destructive", title: "Error", description: "Failed to copy article." }));
  };

  const handleDownload = () => {
    let filename = `${articleTopic.replace(/\s+/g, '_').toLowerCase()}`;

    if (articleFormat === 'PDF') {
      filename += '.pdf';
      if (contentRef.current) {
        setIsDownloadingPdf(true);
        toast({ title: "Info", description: "Generating PDF, this may take a moment..." });
        
        const pdf = new jsPDF('p', 'pt', 'a4');
        // Access the first child of CardContent as the source for pdf.html
        // to avoid capturing the CardContent padding if any, and focus on the rendered article.
        const sourceElement = contentRef.current.firstChild as HTMLElement || contentRef.current;

        pdf.html(sourceElement, {
          callback: function (doc) {
            doc.save(filename);
            toast({ title: "Success", description: `Article downloaded as ${filename}` });
            setIsDownloadingPdf(false);
          },
          error: function (err) {
            console.error("jsPDF html error:", err);
            toast({ variant: "destructive", title: "PDF Generation Error", description: "Failed to generate PDF. Check console for details." });
            setIsDownloadingPdf(false);
          },
          margin: [40, 40, 40, 40], // top, right, bottom, left in points
          autoPaging: 'text', // 'text' tries to avoid cutting text lines, 'slice' is simpler
          html2canvas: {
            scale: 0.60, // Adjust scale to fit content better. Lower scale means smaller content on PDF.
            useCORS: true, // Important if your content includes images from other domains
            logging: false, // Disable html2canvas logging in console
             // Ensure there's a background color if the source element doesn't have one explicitly (e.g., for dark mode capture)
            backgroundColor: window.getComputedStyle(sourceElement).backgroundColor,
          },
          // width: pdf.internal.pageSize.getWidth() - 80, // You can set explicit width
          // windowWidth: sourceElement.scrollWidth, // Use element's scroll width
        });
      } else {
        toast({ variant: "destructive", title: "Error", description: "Article content element not found for PDF generation." });
      }
      return; // Prevent fallback to other download types
    }

    // Original download logic for Markdown and Plain Text
    let mimeType = 'text/plain;charset=utf-8';
    if (articleFormat === 'Markdown') {
      filename += '.md';
      mimeType = 'text/markdown;charset=utf-8';
    } else { // Plain Text
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
          <Button onClick={handleDownload} variant="outline" disabled={isDownloadingPdf}>
            {isDownloadingPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            {isDownloadingPdf ? "Downloading PDF..." : "Download Article"}
          </Button>
          <Button onClick={handleSummarize} disabled={isSummarizing || isDownloadingPdf} variant="outline">
            {isSummarizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BookOpen className="mr-2 h-4 w-4" />}
            {isSummarizing ? "Summarizing..." : "Summarize (500 words)"}
          </Button>
          <Button onClick={handleGenerateSeo} disabled={isGeneratingSeo || isDownloadingPdf} variant="outline">
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
                <Label htmlFor="seoTitle" className="block text-sm font-medium text-muted-foreground mb-1">SEO Title</Label>
                <Input id="seoTitle" value={seoMeta.seoTitle} readOnly className="bg-muted" />
              </div>
              <div>
                <Label htmlFor="metaDescription" className="block text-sm font-medium text-muted-foreground mb-1">Meta Description</Label>
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
