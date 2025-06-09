
// @ts-nocheck
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, FileText, XCircle } from 'lucide-react';
import type { DetectPlagiarismOutput } from '@/ai/flows/detect-plagiarism';
import { analyzeTextForPlagiarism } from './actions';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

export default function PlagiarismAnalyzerPage() {
  const [inputText, setInputText] = useState<string>('');
  const [result, setResult] = useState<DetectPlagiarismOutput | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false); // For AI analysis
  const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false); // For file reading/parsing
  const [error, setError] = useState<string | null>(null);
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
    // Set the workerSrc for pdfjs-dist to the ES Module version
    // Using a CDN for simplicity. For production, consider hosting it locally or bundling.
    if (typeof window !== 'undefined') { // Ensure this only runs in the browser
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
    }
  }, []);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      clearSelectedFile();
      return;
    }

    setSelectedFile(file);
    setInputText('');
    setResult(null);
    setError(null);
    setIsProcessingFile(true);

    try {
      if (file.type === 'text/plain') {
        const text = await file.text();
        setInputText(text);
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') { // .docx
        const arrayBuffer = await file.arrayBuffer();
        const mammothResult = await mammoth.extractRawText({ arrayBuffer });
        setInputText(mammothResult.value);
      } else if (file.type === 'application/pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDocument = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        for (let i = 1; i <= pdfDocument.numPages; i++) {
          const page = await pdfDocument.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .filter((item: any): item is { str: string } => item && typeof item.str === 'string') 
            .map((item: any) => item.str)
            .join(' '); 
          fullText += pageText + '\n'; 
        }
        setInputText(fullText.trim()); 
      } else {
        setError('Unsupported file type. Please upload a .txt, .docx, or .pdf file.');
        setSelectedFile(null); 
      }
    } catch (e) {
      console.error('Error processing file:', e); 
      let errorMessage = 'Could not read file content. Please ensure it is a valid .txt, .docx, or .pdf file and not corrupted.';
      if (e instanceof Error) {
        const messageSnippet = e.message.substring(0, 100);
        errorMessage = `Failed to process file: ${messageSnippet}${e.message.length > 100 ? '...' : ''}. Please check the file.`;
      }
      setError(errorMessage);
      setSelectedFile(null); 
    } finally {
      setIsProcessingFile(false);
      
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setInputText(''); 
    setError(null);
    setResult(null);
  };

  const handleSubmit = async () => {
    if (!inputText.trim() && !selectedFile) { 
      setError('Please enter some text or upload a file to analyze.');
      setResult(null);
      return;
    }
    if (!inputText.trim()){ 
        setError('The uploaded file appears to be empty or could not be read. Please try a different file or paste text.');
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
        setError('An unexpected error occurred during analysis. Please try again.');
      }
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };
  
  const analysisButtonDisabled = isLoading || isProcessingFile || (!inputText.trim() && !selectedFile && !inputText.trim());


  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 md:p-8 bg-background">
      <Card className="w-full max-w-2xl shadow-xl rounded-lg overflow-hidden">
        <CardHeader className="text-center bg-primary text-primary-foreground p-6">
          <CardTitle className="text-3xl md:text-4xl font-headline">Plagiarism Analyzer</CardTitle>
          <CardDescription className="font-body text-primary-foreground/90 mt-1">
            Paste your text or upload a document (.txt, .docx, .pdf) to check for plagiarism.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <label htmlFor="file-upload" className="font-medium text-sm text-foreground/90">Upload Document:</label>
            <Input
              id="file-upload"
              type="file"
              accept=".txt,.docx,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
              onChange={handleFileChange}
              className="font-body text-sm border-input focus:ring-primary shadow-sm"
              disabled={isProcessingFile || isLoading}
              aria-label="File input for plagiarism analysis"
            />
            {selectedFile && (
              <div className="mt-2 flex items-center justify-between p-2 bg-secondary/50 rounded-md text-sm">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-muted-foreground" />
                  <span className="font-body text-foreground truncate max-w-xs" title={selectedFile.name}>{selectedFile.name}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={clearSelectedFile} disabled={isProcessingFile || isLoading} aria-label="Clear selected file">
                  <XCircle size={18} className="text-muted-foreground hover:text-destructive" />
                </Button>
              </div>
            )}
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground font-body">
                Or
              </span>
            </div>
          </div>
          
          <div className="space-y-2">
             <label htmlFor="text-input" className="font-medium text-sm text-foreground/90">Paste Text:</label>
            <Textarea
              id="text-input"
              placeholder="Paste your text here..."
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                if (selectedFile) setSelectedFile(null); 
                setError(null);
                setResult(null);
              }}
              rows={selectedFile && inputText ? Math.max(10, inputText.split('\n').length) : 10}
              className="font-body text-base border-input focus:ring-primary shadow-sm"
              disabled={isProcessingFile || isLoading}
              aria-label="Text input for plagiarism analysis"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={analysisButtonDisabled}
            className="w-full font-body text-lg py-3 bg-accent hover:bg-accent/90 text-accent-foreground"
            size="lg"
          >
            {isProcessingFile ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing File...
              </>
            ) : isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Analyze Content'
            )}
          </Button>

          {error && (
            <div className="mt-4 p-4 rounded-md bg-destructive/10 border border-destructive/30 text-destructive font-body text-sm" role="alert">
              <p className="font-semibold">Error</p>
              <p>{error}</p>
            </div>
          )}

          {result && !isLoading && !isProcessingFile && (
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

