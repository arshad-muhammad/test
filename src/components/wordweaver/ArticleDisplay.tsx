
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TopicFormValues } from "./TopicForm";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Link as LinkIcon } from "lucide-react"; // Renamed to avoid conflict with potential Link component from Next.js

interface ArticleDisplayProps {
  articleContent: string;
  format: TopicFormValues['format'];
  title?: string;
}

export function ArticleDisplay({ articleContent, format, title = "Generated Article" }: ArticleDisplayProps) {

  const customMarkdownComponents = {
    a: ({node, children, href, ...props}: {node: any, children: React.ReactNode, href?: string, [key: string]: any}) => {
      if (!href) {
        // Render children as is or a span if href is missing
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
                title={href} // Provides a native tooltip as a fallback and for accessibility
                {...props} // Spread remaining props, but href is handled
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
    // You can add more custom renderers here for other elements if needed
    // e.g. p: ({node, ...props}) => <p className="mb-4" {...props} />,
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
