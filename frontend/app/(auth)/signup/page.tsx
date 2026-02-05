import Link from "next/link";
import { GoogleOAuthButton } from "@/components/auth/oauth-button";
import { SignupForm } from "@/components/auth/signup-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const metadata = {
  title: "Sign Up | Vesting Buddy",
  description: "Create your Vesting Buddy account",
};

export default function SignupPage() {
  return (
    <Card className="bg-card/50 backdrop-blur-xl rounded-3xl border-2 border-primary/20 p-4">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold tracking-tight">
          Create an account
        </CardTitle>
        <CardDescription>
          Start optimizing your employee benefits today
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <GoogleOAuthButton />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        <SignupForm />
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <p className="text-xs text-muted-foreground text-center px-8">
          By creating an account, you agree to our Terms of Service and Privacy
          Policy
        </p>
        <div className="text-sm text-muted-foreground text-center">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-primary underline-offset-4 hover:underline font-medium"
          >
            Sign in
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
