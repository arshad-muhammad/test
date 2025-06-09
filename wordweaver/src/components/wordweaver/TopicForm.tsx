"use client";

import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Wand2 } from "lucide-react";

const formSchema = z.object({
  user_topic: z.string().min(5, { message: "Topic must be at least 5 characters long." }),
  tone: z.enum(['Academic', 'Blog', 'Creative']).default('Blog'),
  format: z.enum(['Plain Text', 'Markdown', 'PDF']).default('Markdown'),
});

export type TopicFormValues = z.infer<typeof formSchema>;

interface TopicFormProps {
  onSubmit: SubmitHandler<TopicFormValues>;
  isSubmitting: boolean;
}

export function TopicForm({ onSubmit, isSubmitting }: TopicFormProps) {
  const form = useForm<TopicFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      user_topic: "",
      tone: "Blog",
      format: "Markdown",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="user_topic"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="user_topic" className="text-lg">Article Topic</FormLabel>
              <FormControl>
                <Input
                  id="user_topic"
                  placeholder="e.g., The Future of Renewable Energy"
                  {...field}
                  className="text-base py-3 px-4"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid md:grid-cols-2 gap-8">
          <FormField
            control={form.control}
            name="tone"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="tone" className="text-lg">Tone</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} name="tone">
                  <FormControl>
                    <SelectTrigger id="tone" className="text-base py-3 px-4 h-auto">
                      <SelectValue placeholder="Select a tone" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Blog">Blog</SelectItem>
                    <SelectItem value="Academic">Academic</SelectItem>
                    <SelectItem value="Creative">Creative</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="format"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="format" className="text-lg">Output Format</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} name="format">
                  <FormControl>
                    <SelectTrigger id="format" className="text-base py-3 px-4 h-auto">
                      <SelectValue placeholder="Select output format" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Markdown">Markdown</SelectItem>
                    <SelectItem value="Plain Text">Plain Text</SelectItem>
                    <SelectItem value="PDF">PDF (Experimental)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto text-lg py-6 px-8 bg-primary hover:bg-primary/90">
          <Wand2 className="mr-2 h-5 w-5" />
          {isSubmitting ? "Weaving Magic..." : "Generate Article"}
        </Button>
      </form>
    </Form>
  );
}
