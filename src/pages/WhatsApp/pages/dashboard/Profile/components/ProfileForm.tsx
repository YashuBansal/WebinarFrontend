import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  updateBusinessProfilePayloadSchema,
  BUSINESS_VERTICAL_LABELS,
  type UpdateBusinessProfilePayload,
  type BusinessVertical,
} from "@/schemas/profileSchema";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import type { BusinessProfile } from "@/schemas/profileSchema";

interface ProfileFormProps {
  profile?: BusinessProfile;
  isEditing: boolean;
  onSubmit: (data: UpdateBusinessProfilePayload) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export const ProfileForm = ({
  profile,
  isEditing,
  onSubmit,
  onCancel,
  isSubmitting,
}: ProfileFormProps) => {
  const form = useForm<UpdateBusinessProfilePayload>({
    resolver: zodResolver(updateBusinessProfilePayloadSchema),
    defaultValues: {
      about: profile?.about || "",
      address: profile?.address || "",
      description: profile?.description || "",
      email: profile?.email || "",
      vertical: profile?.vertical || undefined,
      websites: profile?.websites || [],
    },
  });

  const handleSubmit = (data: UpdateBusinessProfilePayload) => {
    // Normalize and filter websites to remove empty entries
    const cleanedWebsites = Array.isArray(data.websites)
      ? data.websites.filter((url) => typeof url === "string" && url.trim() !== "")
      : undefined;

    const normalizedData: UpdateBusinessProfilePayload = {
      ...data,
      websites: cleanedWebsites,
    };

    // Filter out empty strings, undefined values, and remove empty arrays
    const filteredData = Object.fromEntries(
      Object.entries(normalizedData).filter(([_, value]) => {
        if (Array.isArray(value)) {
          return value.length > 0;
        }
        return value !== "" && value !== undefined;
      })
    ) as UpdateBusinessProfilePayload;

    onSubmit(filteredData);
  };

  const businessVerticals = Object.entries(BUSINESS_VERTICAL_LABELS) as [
    BusinessVertical,
    string
  ][];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Category */}
        <FormField
          control={form.control}
          name="vertical"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={!isEditing}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {businessVerticals.map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Describe your business"
                  disabled={!isEditing}
                  className="min-h-[100px]"
                />
              </FormControl>
              <FormDescription>
                Optional • {field.value?.length || 0}/512 characters
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* About */}
        <FormField
          control={form.control}
          name="about"
          render={({ field }) => (
            <FormItem>
              <FormLabel>About</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Brief description about your business"
                  disabled={!isEditing}
                  className="min-h-[80px]"
                />
              </FormControl>
              <FormDescription>
                Optional • {field.value?.length || 0}/139 characters
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Address */}
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Your business address"
                  disabled={!isEditing}
                />
              </FormControl>
              <FormDescription>
                Optional • {field.value?.length || 0}/256 characters
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Email */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="email"
                  placeholder="contact@yourbusiness.com"
                  disabled={!isEditing}
                />
              </FormControl>
              <FormDescription>
                Optional • {field.value?.length || 0}/128 characters
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Websites */}
        <div className="space-y-4">
          <FormLabel>Website</FormLabel>
          <FormDescription>Optional • Up to 2 websites (second is optional)</FormDescription>

          {/* Website 1 */}
          <FormField
            control={form.control}
            name="websites.0"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="https://www.example.com"
                    disabled={!isEditing}
                  />
                </FormControl>
                <FormDescription>
                  {field.value?.length || 0}/256 characters
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Website 2 */}
          <FormField
            control={form.control}
            name="websites.1"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="https://www.example.com"
                    disabled={!isEditing}
                  />
                </FormControl>
                <FormDescription>
                  {field.value?.length || 0}/256 characters
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Current Profile Display (Read-only) */}
        {!isEditing && (
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium">Current Profile Information</h4>

            {typeof profile?.vertical === "string" && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Category:</span>
                <Badge variant="secondary">
                  {profile.vertical.trim().split("_").join(" ")}
                </Badge>
              </div>
            )}

            {profile?.description && (
              <div>
                <span className="text-sm font-medium">Description:</span>
                <p className="text-sm text-muted-foreground mt-1">
                  {profile.description}
                </p>
              </div>
            )}

            {profile?.about && (
              <div>
                <span className="text-sm font-medium">About:</span>
                <p className="text-sm text-muted-foreground mt-1">
                  {profile.about}
                </p>
              </div>
            )}

            {profile?.address && (
              <div>
                <span className="text-sm font-medium">Address:</span>
                <p className="text-sm text-muted-foreground mt-1">
                  {profile.address}
                </p>
              </div>
            )}

            {profile?.email && (
              <div>
                <span className="text-sm font-medium">Email:</span>
                <p className="text-sm text-muted-foreground mt-1">
                  {profile.email}
                </p>
              </div>
            )}

            {profile?.websites && profile.websites.length > 0 && (
              <div>
                <span className="text-sm font-medium">Websites:</span>
                <div className="mt-1 space-y-1">
                  {profile.websites.map((website, index) => (
                    <a
                      key={index}
                      href={website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline block"
                    >
                      {website}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Submit Button */}
        {isEditing && (
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-50">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="h-11 px-8 rounded-xl font-bold text-slate-500 border-slate-200 hover:bg-slate-50 transition-all"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="h-11 px-8 rounded-xl bg-[#22B573] hover:bg-[#1da467] text-white font-bold shadow-lg shadow-green-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Save Changes
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
};
