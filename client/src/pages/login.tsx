import { LoginForm } from "@/components/auth/login-form";

export default function Login() {
  return (
    <div className="flex min-h-screen bg-neutral-50">
      <div className="flex flex-col justify-center items-center w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary-500">Visitor Management System</h1>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
