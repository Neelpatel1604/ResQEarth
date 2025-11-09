// components/layout/Footer.tsx
'use client'

import { Satellite, Twitter, Github, Linkedin, Mail } from "lucide-react"

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t bg-background mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

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
              <li><a href="/map" className="hover:text-primary transition-colors">Global Map</a></li>
              <li><a href="/alerts" className="hover:text-primary transition-colors">Disaster Alerts</a></li>
              <li><a href="/analytics" className="hover:text-primary transition-colors">Analytics</a></li>
              <li><a href="/teams" className="hover:text-primary transition-colors">Response Teams</a></li>
            </ul>
          </div>

          {/* Company links */}
          <div>
            <h4 className="font-semibold mb-3">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="/about" className="hover:text-primary transition-colors">About Us</a></li>
              <li><a href="/careers" className="hover:text-primary transition-colors">Careers</a></li>
              <li><a href="/contact" className="hover:text-primary transition-colors">Contact</a></li>
              <li><a href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</a></li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-semibold mb-3">Follow Us</h4>
            <div className="flex space-x-3">
              <SocialLink href="#" icon={Twitter} />
              <SocialLink href="#" icon={Github} />
              <SocialLink href="#" icon={Linkedin} />
              <SocialLink href="#" icon={Mail} />
            </div>
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

/* Helper for social icons */
function SocialLink({ href, icon: Icon }: { href: string; icon: any }) {
  return (
    <a
      href={href}
      className="text-muted-foreground hover:text-primary transition-colors"
      aria-label={Icon.displayName ?? "social"}
    >
      <Icon className="h-5 w-5" />
    </a>
  )
}