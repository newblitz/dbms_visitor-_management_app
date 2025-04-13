import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CameraCapture } from "./camera-capture";
import { useToast } from "@/hooks/use-toast";
import { insertVisitorSchema } from "@shared/schema";
import { AlertCircle, Check, UserCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Extend the schema with client-side validation
const visitorFormSchema = insertVisitorSchema.extend({
  hostId: z.string().min(1, "Host is required"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  aadharId: z.string().min(12, "Aadhar ID must be at least 12 characters"),
  mobile: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  purpose: z.string().min(3, "Purpose must be at least 3 characters"),
});

interface VisitorFormProps {
  guardId: number;
  onSuccess: () => void;
}

export function VisitorForm({ guardId, onSuccess }: VisitorFormProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  // Fetch hosts for dropdown
  const { data: hosts = [], isLoading: hostsLoading } = useQuery({
    queryKey: ["/api/users/hosts"],
  });
  
  const form = useForm<z.infer<typeof visitorFormSchema>>({
    resolver: zodResolver(visitorFormSchema),
    defaultValues: {
      name: "",
      aadharId: "",
      mobile: "",
      email: "",
      purpose: "",
      hostId: "",
    },
  });
  
  const onSubmit = async (data: z.infer<typeof visitorFormSchema>) => {
    if (!photoUrl) {
      toast({
        title: "Photo Required",
        description: "Please capture a photo of the visitor",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Convert photo to file
      const response = await fetch(photoUrl);
      const blob = await response.blob();
      const file = new File([blob], "visitor-photo.jpg", { type: "image/jpeg" });
      
      // Create form data for multipart/form-data submission
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("aadharId", data.aadharId);
      if (data.mobile) formData.append("mobile", data.mobile);
      if (data.email) formData.append("email", data.email);
      formData.append("purpose", data.purpose);
      formData.append("hostId", data.hostId);
      formData.append("createdBy", guardId.toString());
      formData.append("photo", file);
      
      const submitResponse = await fetch("/api/visitors", {
        method: "POST",
        body: formData,
      });
      
      if (!submitResponse.ok) {
        const errorData = await submitResponse.json();
        throw new Error(errorData.message || "Failed to register visitor");
      }
      
      const result = await submitResponse.json();
      
      toast({
        title: "Visitor Registered",
        description: `${result.name} has been successfully registered`,
      });
      
      // Reset form and state
      form.reset();
      setPhotoUrl(null);
      onSuccess();
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handlePhotoCapture = (dataUrl: string) => {
    setPhotoUrl(dataUrl);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Register New Visitor</CardTitle>
        <CardDescription>
          Capture visitor information and photo for registration
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name*</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter visitor's full name" {...field} />
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
                      <FormLabel>Aadhar ID*</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter 12-digit Aadhar ID" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="mobile"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mobile Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Mobile number" {...field} />
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
                          <Input placeholder="Email address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="purpose"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purpose of Visit*</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter the purpose of visit" 
                          className="resize-none" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="hostId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Host*</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a host" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {hostsLoading ? (
                            <SelectItem value="loading" disabled>
                              Loading hosts...
                            </SelectItem>
                          ) : hosts.length === 0 ? (
                            <SelectItem value="none" disabled>
                              No hosts available
                            </SelectItem>
                          ) : (
                            hosts.map((host: any) => (
                              <SelectItem key={host.id} value={host.id.toString()}>
                                {host.name} ({host.department})
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The person being visited
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="pt-4">
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Registering...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <UserCheck className="mr-2 h-4 w-4" />
                        Register Visitor
                      </div>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Visitor Photo*</h3>
              <CameraCapture onCapture={handlePhotoCapture} />
            </div>
            
            {photoUrl ? (
              <Alert className="bg-green-50 border-green-200">
                <Check className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Photo captured</AlertTitle>
                <AlertDescription className="text-green-700">
                  Visitor photo has been captured successfully
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Required</AlertTitle>
                <AlertDescription>
                  A photo of the visitor is required for registration
                </AlertDescription>
              </Alert>
            )}
            
            {photoUrl && (
              <div className="mt-2">
                <div className="rounded-md overflow-hidden border">
                  <img src={photoUrl} alt="Captured visitor" className="w-full h-auto" />
                </div>
                <Button 
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => setPhotoUrl(null)}
                >
                  Retake Photo
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
