"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check for a token in localStorage or cookies
    const token = localStorage.getItem('token'); // Assuming token is stored in localStorage
    // You might also check for a cookie here if your auth system uses cookies
    if (token) {
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
    }
  }, []);
  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          {/* Solar Panel Icon Placeholder */}
          <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs">☀️</span>
          </div>
          <span className="text-xl font-bold text-gray-900">Solar Field Ops</span>
        </div>
        <nav className="flex items-center space-x-4">
          {/* <Link href="/contact" className="text-gray-600 hover:text-blue-600 transition-colors duration-200">
            Contact
          </Link> */}
          <Link href="/login" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 shadow-md">
            Sign In
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-12 md:py-20 flex flex-col md:flex-row items-center justify-between">
        <div className="md:w-1/2 text-center md:text-left mb-10 md:mb-0">
          <h1 className="text-4xl md:text-5xl font-bold leading-tight text-gray-900 mb-4">
            Power your solar operations from anywhere.
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-8">
            Real-time job tracking, technician coordination, and smart maintenance — simplified.
          </p>
          <Link href={isLoggedIn ? "/dashboard" : "/login"} className="inline-block px-8 py-3 bg-yellow-500 text-gray-900 font-semibold rounded-md hover:bg-yellow-600 transition-colors duration-200 shadow-lg">
            Launch Dashboard
          </Link>
        </div>
        <div className="md:w-1/2 flex justify-center md:justify-end">
          <Image
            src="/hero.png"
            alt="Solar Field Operations Illustration"
            width={600}
            height={400}
            layout="responsive"
            objectFit="contain"
            className="rounded-lg shadow-xl"
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-6 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500 mt-12">
        <span>© 2025 Solar Field Ops</span>
        <Link href="/privacy-policy" className="hover:text-blue-600 transition-colors duration-200 mt-2 md:mt-0">
          Privacy Policy
        </Link>
      </footer>
    </div>
  );
}