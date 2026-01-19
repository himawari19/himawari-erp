import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, CheckCircle2, LayoutDashboard, ShieldCheck, Zap } from "lucide-react";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
            <LayoutDashboard className="h-6 w-6 text-indigo-600" />
            <span>Himawari ERP</span>
          </div>
          <nav className="hidden gap-6 md:flex">
            <Link className="text-sm font-medium hover:text-indigo-600 transition-colors" href="#">Features</Link>
            <Link className="text-sm font-medium hover:text-indigo-600 transition-colors" href="#">Pricing</Link>
            <Link className="text-sm font-medium hover:text-indigo-600 transition-colors" href="#">About</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="inline-flex h-9 items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-700"
            >
              Login
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-[url('https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=2574&auto=format&fit=crop')] bg-cover bg-center relative">
          <div className="absolute inset-0 bg-white/90"></div>
          <div className="container px-4 md:px-6 relative z-10">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl/none text-slate-900">
                  Manage Your Business with <span className="text-indigo-600">Confidence</span>
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  The complete POS & Inventory Management solution for modern multi-warehouse businesses. Simple, Fast, and Secure.
                </p>
              </div>
              <div className="space-x-4 pt-4">
                <Link
                  href="/login"
                  className="inline-flex h-12 items-center justify-center rounded-lg bg-indigo-600 px-8 text-sm font-medium text-white shadow-lg transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-700 disabled:pointer-events-none disabled:opacity-50"
                >
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link
                  href="#"
                  className="inline-flex h-12 items-center justify-center rounded-lg border border-gray-200 bg-white px-8 text-sm font-medium shadow-sm transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50"
                >
                  Learn more
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-50">
          <div className="container px-4 md:px-6">
            <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-3">
              <div className="grid gap-2 p-6 bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow">
                <ShieldCheck className="h-10 w-10 text-indigo-600 mb-2" />
                <h3 className="text-xl font-bold">Role-Based Security</h3>
                <p className="text-sm text-gray-500">
                  Granular access control for Superadmins, Warehouse Managers, and Cashiers. Secure your data effectively.
                </p>
              </div>
              <div className="grid gap-2 p-6 bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow">
                <LayoutDashboard className="h-10 w-10 text-indigo-600 mb-2" />
                <h3 className="text-xl font-bold">Multi-Warehouse</h3>
                <p className="text-sm text-gray-500">
                  Track inventory across multiple locations in real-time. Transfer stock and manage batches seamlessly.
                </p>
              </div>
              <div className="grid gap-2 p-6 bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow">
                <Zap className="h-10 w-10 text-indigo-600 mb-2" />
                <h3 className="text-xl font-bold">Fast POS</h3>
                <p className="text-sm text-gray-500">
                  Lightning fast Point of Sale interface designed for high-volume transactions with FIFO stock deduction.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t font-light text-xs text-gray-500">
        <p>© 2024 Himawari ERP. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="hover:underline underline-offset-4" href="#">Terms of Service</Link>
          <Link className="hover:underline underline-offset-4" href="#">Privacy</Link>
        </nav>
      </footer>
    </div>
  );
}
