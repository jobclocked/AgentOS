import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useCreateAgent, getListAgentsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  goal: z.string().min(10, { message: "Goal must be at least 10 characters." }),
  model: z.string({ required_error: "Please select a model." }),
  instructions: z.string().optional(),
  temperature: z.number().min(0).max(2),
  maxTokens: z.number().min(1).max(8192),
});

export default function AgentNew() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createAgent = useCreateAgent();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      goal: "",
      model: "gpt-4o",
      instructions: "",
      temperature: 0.7,
      maxTokens: 2048,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    createAgent.mutate(
      { data: values },
      {
        onSuccess: (newAgent) => {
          queryClient.invalidateQueries({ queryKey: getListAgentsQueryKey() });
          toast({
            title: "Agent Created",
            description: `${newAgent.name} has been created successfully.`,
          });
          setLocation(`/agents/${newAgent.id}`);
        },
        onError: (error) => {
          toast({
            title: "Error",
            description: error.data?.error || error.message || "Failed to create agent.",
            variant: "destructive",
          });
        },
      }
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Agent</h1>
        <p className="text-muted-foreground mt-1">Configure a new AI agent to perform tasks.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Identity and core objective of the agent.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Lead Qualifier" {...field} />
                    </FormControl>
                    <FormDescription>A memorable name for your agent.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="What does this agent do?" {...field} />
                    </FormControl>
                    <FormDescription>A brief description for internal reference.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="goal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Goal</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Define the primary objective..." {...field} />
                    </FormControl>
                    <FormDescription>The ultimate goal the agent should strive to achieve.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
              <CardDescription>Model and behavioral settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a model" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="gpt-4o">GPT-4o (OpenAI)</SelectItem>
                        <SelectItem value="gpt-4o-mini">GPT-4o Mini (OpenAI)</SelectItem>
                        <SelectItem value="claude-3-5-sonnet">Claude 3.5 Sonnet (Anthropic)</SelectItem>
                        <SelectItem value="claude-3-haiku">Claude 3 Haiku (Anthropic)</SelectItem>
                        <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro (Google)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="instructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>System Instructions</FormLabel>
                    <FormControl>
                      <Textarea className="min-h-[150px] font-mono text-sm" placeholder="You are a helpful assistant..." {...field} />
                    </FormControl>
                    <FormDescription>The base prompt that dictates the agent's behavior.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="temperature"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Temperature: {field.value}</FormLabel>
                      <FormControl>
                        <Slider
                          min={0}
                          max={2}
                          step={0.1}
                          value={[field.value]}
                          onValueChange={(vals) => field.onChange(vals[0])}
                        />
                      </FormControl>
                      <FormDescription>Controls randomness: 0 is focused, 2 is highly creative.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="maxTokens"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Tokens</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                      </FormControl>
                      <FormDescription>Maximum length of the generated response.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button variant="outline" type="button" onClick={() => setLocation("/agents")}>Cancel</Button>
            <Button type="submit" disabled={createAgent.isPending}>
              {createAgent.isPending ? "Creating..." : "Create Agent"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}