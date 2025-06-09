
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TopicFormValues } from "./TopicForm";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
// LinkIcon import is no longer needed
import type React from 'react';

interface ArticleDisplayProps {
  articleContent: string;
  format: TopicFormValues['format'];
  title?: string;
  contentRef?: React.RefObject<HTMLDivElement>; // Added ref for PDF generation
}

export function ArticleDisplay({ articleContent, format, title = "Generated Article", contentRef }: ArticleDisplayProps) {
  let linkCounter = 0; // Counter for numbered references, reset on each render

  const customMarkdownComponents = {
    a: ({node, children, href, ...props}: {node: any, children: React.ReactNode, href?: string, [key: string]: any}) => {
      if (!href) {
        // Handle cases where 'a' tag might not be a typical link (e.g. anchor links)
        // or if children exist, render them. For now, render as simple span.
        return <span {...props}>{children}</span>;
      }
      linkCounter++;
      const currentLinkNumber = linkCounter;

      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="mx-0.5 px-1 py-0.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 rounded-sm focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                title={`Link ${currentLinkNumber}: ${href}`} // Standard browser tooltip as fallback/enhancement
                {...props} // Spread other props like `key` if ReactMarkdown passes them
              >
                [{currentLinkNumber}] {/* Display numbered reference */}
              </a>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs break-all">
              <p>{href}</p> {/* ShadCN Tooltip shows the URL */}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
  };

  const renderContent = () => {
    linkCounter = 0; // Ensure counter is reset before rendering Markdown
    if (format === "Markdown" || format === "PDF") { // Treat PDF textual content as Markdown for display
      return (
        <div className="prose dark:prose-invert max-w-none article-content">
          {format === "PDF" && (
            <p className="mb-4 text-sm text-muted-foreground italic">
              Textual representation for PDF. Use 'Download Article' for the actual PDF file.
            </p>
          )}
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={customMarkdownComponents}
          >
            {articleContent}
          </ReactMarkdown>
        </div>
      );
    }
    // Plain Text
    return <pre className="whitespace-pre-wrap p-4 bg-muted rounded-md text-sm article-content">{articleContent}</pre>;
  };

  return (
    <Card className="w-full shadow-xl mt-10">
      <CardHeader>
        <CardTitle className="font-headline text-3xl text-primary">{title}</CardTitle>
      </CardHeader>
      <CardContent ref={contentRef}> {/* Attach the ref here */}
        {renderContent()}
      </CardContent>
    </Card>
  );
}
