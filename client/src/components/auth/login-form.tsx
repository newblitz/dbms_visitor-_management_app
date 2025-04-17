import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@shared/schema";
import { z } from "zod";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";

export function LoginForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = (data: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    console.log("Login attempt:", data.username, data.password);
    
    // Simple role-based login without any authentication for demo
    const username = data.username.toLowerCase();
    
    // Show toast
    toast({
      title: "Login successful",
      description: `Welcome, ${data.username}!`,
    });
    
    // Wait a second to show the toast
    setTimeout(() => {
      console.log("Redirecting based on role:", username);
      
      // Hard navigation based on username - this is the most reliable approach
      if (username === "admin") {
        window.location.href = "/dashboard";
      } else if (username === "guard") {
        window.location.href = "/guard/register";
      } else if (username === "host") {
        window.location.href = "/host/approve"; 
      } else {
        // Default to guard role
        window.location.href = "/guard/register";
      }
    }, 1000);
  };
  
  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="space-y-1">
        <div className="flex justify-center mb-2">
          <div className="bg-primary-100 rounded-full p-3">
            <Shield className="h-8 w-8 text-primary-500" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-center">Sign in</CardTitle>
        <CardDescription className="text-center">
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-center w-full text-neutral-600">
          Default credentials: admin/admin123, guard/guard123, host/host123
        </p>
      </CardFooter>
    </Card>
  );
}
