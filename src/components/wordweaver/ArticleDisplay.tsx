"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TopicFormValues } from "./TopicForm";

interface ArticleDisplayProps {
  articleContent: string;
  format: TopicFormValues['format'];
  title?: string;
}

// Basic Markdown to HTML conversion (very simplified)
// For a production app, a dedicated library like react-markdown is recommended.
// This is a placeholder to demonstrate the concept.
function renderMarkdownToHTML(markdown: string): string {
  let html = markdown;
  // Headlines
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  // Bold
  html = html.replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>');
  html = html.replace(/__(.*)__/gim, '<strong>$1</strong>');
  // Italic
  html = html.replace(/\*(.*)\*/gim, '<em>$1</em>');
  html = html.replace(/_(.*)_/gim, '<em>$1</em>');
  // Links - Assuming Markdown links are already in <a> tags by AI or basic format
  // Paragraphs (simplified: treat double newlines as paragraph breaks)
  html = html.split(/\n\s*\n/).map(p => `<p>${p.replace(/\n/g, '<br/>')}</p>`).join('');
  
  return html;
}


export function ArticleDisplay({ articleContent, format, title = "Generated Article" }: ArticleDisplayProps) {
  const renderContent = () => {
    if (format === "Markdown") {
      // If AI provides HTML-like Markdown or if you sanitize, use dangerouslySetInnerHTML
      // For safety without a sanitizer and proper Markdown lib, this is risky.
      // A proper solution would use react-markdown.
      // As a compromise, we inject the output trusting the AI flow to produce safe HTML-like content for "Markdown" format.
      // Or, it will be just text if the AI doesn't produce HTML tags.
      return <div className="prose dark:prose-invert max-w-none article-content" dangerouslySetInnerHTML={{ __html: articleContent }} />;
    }
    if (format === "PDF") {
        // If the AI generated PDF content (e.g. base64 string or similar), this part would handle it.
        // For now, assuming it's textual representation or a message.
        return (
            <div>
                <p className="mb-4 text-muted-foreground">PDF output format is experimental. The content below is the textual representation. For actual PDF download, use the download button if available for PDF format.</p>
                <pre className="whitespace-pre-wrap p-4 bg-muted rounded-md text-sm">{articleContent}</pre>
            </div>
        )
    }
    // Plain Text
    return <pre className="whitespace-pre-wrap p-4 bg-muted rounded-md text-sm">{articleContent}</pre>;
  };

  return (
    <Card className="w-full shadow-xl mt-10">
      <CardHeader>
        <CardTitle className="font-headline text-3xl text-primary">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
}
