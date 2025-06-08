
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TopicFormValues } from "./TopicForm";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Link as LinkIcon } from "lucide-react"; 
import type React from 'react';

interface ArticleDisplayProps {
  articleContent: string;
  format: TopicFormValues['format'];
  title?: string;
  contentRef?: React.RefObject<HTMLDivElement>; // Added ref for PDF generation
}

export function ArticleDisplay({ articleContent, format, title = "Generated Article", contentRef }: ArticleDisplayProps) {

  const customMarkdownComponents = {
    a: ({node, children, href, ...props}: {node: any, children: React.ReactNode, href?: string, [key: string]: any}) => {
      if (!href) {
        return <span {...props}>{children}</span>;
      }
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center align-middle mx-1 text-primary hover:text-primary/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                title={href} 
                {...props} 
              >
                <LinkIcon className="h-4 w-4" />
              </a>
            </TooltipTrigger>
            <TooltipContent>
              <p>{href}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
  };

  const renderContent = () => {
    if (format === "Markdown") {
      return (
        <div className="prose dark:prose-invert max-w-none article-content">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={customMarkdownComponents}
          >
            {articleContent}
          </ReactMarkdown>
        </div>
      );
    }
    if (format === "PDF") {
        // For PDF format, the content is still textual. 
        // The actual PDF generation happens via download button using the rendered output.
        // Display it as Markdown or preformatted text based on its likely nature.
        // Assuming PDF format prompt to LLM might result in Markdown-like text.
        return (
             <div className="prose dark:prose-invert max-w-none article-content">
                <p className="mb-4 text-muted-foreground">Below is the textual representation. Use the 'Download Article' button to get the PDF.</p>
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={customMarkdownComponents}
                >
                    {articleContent}
                </ReactMarkdown>
            </div>
        )
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
