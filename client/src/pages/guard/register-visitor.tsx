import { Layout } from "@/components/layout/layout";
import { VisitorForm } from "@/components/forms/visitor-form";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";

export default function RegisterVisitor() {
  const { toast } = useToast();
  const [success, setSuccess] = useState(false);
  
  const mutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/visitors", data);
    },
    onSuccess: () => {
      toast({
        title: "Visitor registered successfully",
        description: "The visitor has been registered and the host has been notified.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/visitors'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      setSuccess(true);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to register visitor",
        description: (error as Error).message || "Something went wrong. Please try again.",
      });
    },
  });
  
  // Reset success state after 3 seconds to allow for another registration
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [success]);
  
  const handleSubmit = (data: any) => {
    mutation.mutate(data);
  };
  
  return (
    <Layout title="Register Visitor" subtitle="Register a new visitor and notify the host">
      {success ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <h3 className="text-green-800 text-xl font-medium mb-2">Visitor Registered Successfully!</h3>
          <p className="text-green-700 mb-4">The host has been notified about the visitor.</p>
          <button
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
            onClick={() => setSuccess(false)}
          >
            Register Another Visitor
          </button>
        </div>
      ) : (
        <VisitorForm onSubmit={handleSubmit} isSubmitting={mutation.isPending} />
      )}
    </Layout>
  );
}
