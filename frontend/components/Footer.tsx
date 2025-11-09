// components/layout/Footer.tsx
'use client'

import { Satellite } from "lucide-react"

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t bg-background mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Satellite className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">ResQ Earth</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Saving lives with space-based disaster intelligence.
            </p>
          </div>

          {/* Platform links */}
          <div>
            <h4 className="font-semibold mb-3">Platform</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="/" className="hover:text-primary transition-colors">Home</a></li>
              <li><a href="/alerts" className="hover:text-primary transition-colors">Disaster Alerts</a></li>
              <li><a href="/knowledge-base" className="hover:text-primary transition-colors">Knowledge Base</a></li>
            </ul>
          </div>

          {/* Company links */}
          <div>
            <h4 className="font-semibold mb-3">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="/about" className="hover:text-primary transition-colors">About Us</a></li>
              <li><a href="/check-my-area" className="hover:text-primary transition-colors">Check My Area</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom line */}
        <div className="mt-10 pt-6 border-t text-center text-sm text-muted-foreground">
          <p>© {year} ResQ Earth. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}