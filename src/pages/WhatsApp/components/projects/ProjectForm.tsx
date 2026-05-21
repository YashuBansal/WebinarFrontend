import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useProjectMutations } from "@/hooks/useProjects";
import { createProjectPayloadSchema } from "@/schemas/projectSchema"; // Assuming this is your Zod schema
import { useEffect } from "react";

// The form's validation schema inferred from your Zod schema
type ProjectFormValues = z.infer<typeof createProjectPayloadSchema>;

interface ProjectFormProps {
  adminId: string;
  onSuccess?: () => void; // Optional callback to run on successful submission
}

export function ProjectForm({ onSuccess }: ProjectFormProps) {
  // Get the mutation hook
  const { useCreateProject } = useProjectMutations();
  const { mutate: createProject, isPending, isSuccess } = useCreateProject();

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(createProjectPayloadSchema),
    defaultValues: {
      projectName: "",
    },
  });

  // Handle form submission
  function onSubmit(values: ProjectFormValues) {
    console.log("Submitting project:", values);
    createProject(values);
  }

  // If mutation was successful, call the onSuccess callback
  useEffect(() => {
    if (isSuccess) {
      form.reset();
      onSuccess?.();
    }
  }, [isSuccess, onSuccess, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Project Name Field */}
        <FormField
          control={form.control}
          name="projectName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Marketing Campaign" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "Creating..." : "Create Project"}
        </Button>
      </form>
    </Form>
  );
}
