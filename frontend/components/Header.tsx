// components/layout/Header.tsx
'use client'

import { Satellite, MapPin } from "lucide-react"
import { UserMenu } from "@/components/auth/user-menu"
import Link from "next/link";
import { Button } from "./ui/button";

export function Header() {
  return (
    <header className="border-b fixed top-0 left-0 right-0 bg-background z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <Link href="/">
            <h1 className="text-2xl font-bold">ResQ-Earth</h1>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex gap-8">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                Home
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/alerts">
              <Button variant="ghost" size="sm">
                Alerts
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/analytics">
              <Button variant="ghost" size="sm">
                Analytics
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/knowledge-base">
              <Button variant="ghost" size="sm">
                Knowledge Base
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/about">
              <Button variant="ghost" size="sm">
                About Us
              </Button>
            </Link>
          </div>
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-3">
          <Link href="/check-my-area">
            <Button variant="outline" size="sm">
              <MapPin className="h-4 w-4 mr-2" />
              Check My Area
            </Button>
          </Link>
          <UserMenu />
        </div>
      </div>
    </header>
  )
}

/* Tiny helper – keeps the JSX tidy */
function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="text-foreground hover:text-primary transition-colors"
    >
      {children}
    </a>
  )
}