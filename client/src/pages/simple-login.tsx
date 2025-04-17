import { useState } from "react";
import { LoginForm } from "@/components/auth/login-form";

export default function SimpleLogin() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-purple-50 to-purple-100 p-4">
      <LoginForm />
    </div>
  );
}