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
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });
  
  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    try {
      setIsLoading(true);
      // Simulate role-based login
      let userRole = "";
      
      // Check username to determine role for simulation
      if (data.username.toLowerCase() === "admin") {
        userRole = "admin";
      } else if (data.username.toLowerCase() === "guard") {
        userRole = "guard";
      } else if (data.username.toLowerCase() === "host") {
        userRole = "host";
      } else {
        // Default to guard for any other username
        userRole = "guard";
      }
      
      toast({
        title: "Login successful",
        description: `Welcome, ${data.username}! You are logged in as ${userRole}.`,
      });
      
      // Redirect based on role after 1 second
      setTimeout(() => {
        if (userRole === "admin") {
          window.location.href = '/dashboard';
        } else if (userRole === "guard") {
          window.location.href = '/guard/register';
        } else if (userRole === "host") {
          window.location.href = '/host/approve';
        } else {
          window.location.href = '/dashboard';
        }
      }, 1000);
      
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: (error as Error).message || "Something went wrong",
      });
    } finally {
      setIsLoading(false);
    }
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
