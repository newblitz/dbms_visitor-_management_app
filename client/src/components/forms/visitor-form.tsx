import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertVisitorSchema } from "@shared/schema";
import { WebcamCapture } from "@/components/ui/webcam";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

// Extended schema with additional validation
const visitorFormSchema = insertVisitorSchema
  .extend({
    phone: z.string().min(10, "Phone number must be at least 10 digits"),
    aadharId: z.string().min(12, "Aadhar ID must be 12 digits").max(12, "Aadhar ID must be 12 digits"),
    email: z.string().email("Invalid email address").optional(),
  })
  .refine(data => !!data.photoUrl, {
    message: "Visitor photo is required",
    path: ["photoUrl"],
  });

interface Host {
  id: number;
  name: string;
  department: string;
}

interface VisitorFormProps {
  onSubmit: (data: z.infer<typeof visitorFormSchema>) => void;
  isSubmitting: boolean;
}

export function VisitorForm({ onSubmit, isSubmitting }: VisitorFormProps) {
  const [photoDataUrl, setPhotoDataUrl] = useState<string>("");
  
  // Fetch hosts
  const { data: hosts, isLoading: isLoadingHosts } = useQuery<Host[]>({
    queryKey: ['/api/hosts'],
  });
  
  const form = useForm<z.infer<typeof visitorFormSchema>>({
    resolver: zodResolver(visitorFormSchema),
    defaultValues: {
      name: "",
      aadharId: "",
      phone: "",
      email: "",
      company: "",
      purpose: "",
      expectedDuration: 60,
      photoUrl: "",
    },
  });
  
  // Handle photo capture
  const handleCapture = (photoUrl: string) => {
    setPhotoDataUrl(photoUrl);
    form.setValue("photoUrl", photoUrl);
    form.clearErrors("photoUrl");
  };
  
  const handleClearPhoto = () => {
    setPhotoDataUrl("");
    form.setValue("photoUrl", "");
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left column - Photo capture */}
          <Card>
            <CardContent className="p-6">
              <FormLabel className="block mb-2">Visitor Photo</FormLabel>
              <WebcamCapture 
                onCapture={handleCapture} 
                onClear={handleClearPhoto}
                photoDataUrl={photoDataUrl} 
              />
              {form.formState.errors.photoUrl && (
                <p className="text-red-500 text-sm mt-2">{form.formState.errors.photoUrl.message}</p>
              )}
            </CardContent>
          </Card>
          
          {/* Middle and Right columns - Form fields */}
          <div className="md:col-span-2 space-y-4">
            {/* Personal Information */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Personal Information</h3>
                
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="aadharId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Aadhar ID *</FormLabel>
                      <FormControl>
                        <Input placeholder="12-digit Aadhar number" {...field} />
                      </FormControl>
                      <FormDescription>
                        12-digit national identity number
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number *</FormLabel>
                        <FormControl>
                          <Input placeholder="+91 9999999999" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="john@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company</FormLabel>
                      <FormControl>
                        <Input placeholder="Company name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            
            {/* Visit Information */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Visit Information</h3>
                
                <FormField
                  control={form.control}
                  name="hostId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Host *</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a host" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isLoadingHosts ? (
                            <SelectItem value="loading" disabled>Loading hosts...</SelectItem>
                          ) : hosts && hosts.length > 0 ? (
                            hosts.map((host) => (
                              <SelectItem key={host.id} value={host.id.toString()}>
                                {host.name} ({host.department})
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="none" disabled>No hosts available</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Person you're visiting
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="purpose"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purpose of Visit *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Brief description of your visit purpose"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="expectedDuration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expected Duration (minutes) *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={15} 
                          step={15} 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))} 
                        />
                      </FormControl>
                      <FormDescription>
                        Estimated time for the visit in minutes
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => form.reset()}>
                Reset
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Registering..." : "Register Visitor"}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
}
