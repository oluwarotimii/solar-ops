"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SetupPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [dbInitialized, setDbInitialized] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
  });

  // Check if setup is already complete
  useEffect(() => {
    const checkSetupStatus = async () => {
      try {
        const response = await fetch("/api/setup/status");
        const data = await response.json();
        
        // Always show setup page for new database setup
        setIsLoading(false);
        // if (data.setupComplete) {
        //   router.push("/login");
        // } else {
        //   setIsLoading(false);
        // }
      } catch (error) {
        console.error("Error checking setup status:", error);
        setIsLoading(false);
      }
    };

    checkSetupStatus();
  }, [router]);

  const handleInitializeDb = async () => {
    setIsInitializing(true);
    try {
      const response = await fetch("/api/setup/init", {
        method: "POST",
      });
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Database tables created successfully!",
        });
        setDbInitialized(true);
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to initialize database",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to initialize database",
        variant: "destructive",
      });
    } finally {
      setIsInitializing(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }
    
    setIsCreatingUser(true);
    try {
      const response = await fetch("/api/setup/user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Super Admin user created successfully!",
        });
        // Redirect to login page
        router.push("/login");
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to create user",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create user",
        variant: "destructive",
      });
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>SolarOps Setup</CardTitle>
          <CardDescription>Initialize your SolarOps platform</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!dbInitialized ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Welcome to SolarOps! To get started, you need to initialize the database tables.
              </p>
              <Button 
                onClick={handleInitializeDb} 
                disabled={isInitializing}
                className="w-full"
              >
                {isInitializing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Initializing...
                  </>
                ) : (
                  "Initialize Database"
                )}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <Button type="submit" disabled={isCreatingUser} className="w-full">
                {isCreatingUser ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating User...
                  </>
                ) : (
                  "Create Super Admin"
                )}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex flex-col items-start">
          {dbInitialized && (
            <p className="text-sm text-green-600 dark:text-green-400">
              ✓ Database initialized successfully
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            This setup page should only be accessible once during initial installation.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}