import { Suspense } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifyToken, getUserById } from "@/lib/auth";
import DashboardClientLayout from "./client-layout";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect('/login');
  }

  let user = null;
  try {
    const decodedToken = verifyToken(token);
    if (decodedToken) {
      user = await getUserById(decodedToken.userId);
    }
  } catch (error) {
    console.error("Server-side token verification failed:", error);
    redirect('/login');
  }

  if (!user) {
    redirect('/login');
  }

  return (
    <DashboardClientLayout user={user}>
      {children}
    </DashboardClientLayout>
  );
}
