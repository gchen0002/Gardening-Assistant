'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Import Shadcn Card components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function LoginPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        // User is logged in, redirect to home page or dashboard
        router.push('/');
      }
    });

    // Cleanup subscription on unmount
    return () => {
      subscription?.unsubscribe();
    };
  }, [supabase, router]);

  return (
    <div className="flex justify-center items-center min-h-screen p-4">
      {/* Use Shadcn Card */}
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Welcome Back!</CardTitle>
          <CardDescription>Sign in or create an account to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            theme="dark" // Match this with your Tailwind theme (dark/light)
            providers={['google', 'github']} // Add desired providers
            redirectTo={`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`}
            socialLayout="horizontal"
            // You might want to remove default borders/padding from Supabase UI
            // if they conflict with the Card styling. Check appearance options.
            // appearance={{ 
            //   variables: { 
            //     default: { 
            //       colors: { brand: 'transparent', brandAccent: 'transparent' }, 
            //       space: { /* Adjust spacing */ },
            //     }
            //   },
            //   extend: false, // Prevent Supabase UI from adding default styles
            // }}
          />
        </CardContent>
      </Card>
    </div>
  );
} 