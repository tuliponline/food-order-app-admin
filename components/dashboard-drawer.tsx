"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { LayoutDashboard, UtensilsCrossed, ShoppingBag, Users, LogOut, Menu } from "lucide-react"
import { initializeApp } from "firebase/app"
import { getAuth, signOut } from "firebase/auth"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

// Your Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)

export default function DashboardDrawer() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      window.location.href = "/"
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const navItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="mr-2 h-4 w-4" />,
    },
    {
      title: "Menu",
      href: "/dashboard/menu",
      icon: <UtensilsCrossed className="mr-2 h-4 w-4" />,
    },
    {
      title: "Orders",
      href: "/dashboard/orders",
      icon: <ShoppingBag className="mr-2 h-4 w-4" />,
    },
    {
      title: "Users",
      href: "/dashboard/users",
      icon: <Users className="mr-2 h-4 w-4" />,
    },
  ]

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
          <Menu className="h-4 w-4" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] sm:w-72 p-0">
        <div className="flex h-screen flex-col">
          <div className="flex h-12 sm:h-14 items-center border-b px-3 sm:px-4">
            <Link href="/" className="flex items-center font-semibold text-sm sm:text-base" onClick={() => setOpen(false)}>
              <UtensilsCrossed className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              Food Order Admin
            </Link>
          </div>
          <div className="flex-1 overflow-auto py-2">
            <nav className="grid gap-1 px-2">
              {navItems.map((item, index) => (
                <Button
                  key={index}
                  asChild
                  variant={pathname === item.href ? "secondary" : "ghost"}
                  className={cn(
                    "justify-start w-full h-10 sm:h-11 text-sm sm:text-base",
                    pathname === item.href ? "bg-secondary" : "hover:bg-muted"
                  )}
                  onClick={() => setOpen(false)}
                >
                  <Link href={item.href}>
                    {item.icon}
                    {item.title}
                  </Link>
                </Button>
              ))}
            </nav>
          </div>
          <div className="border-t p-3 sm:p-4">
            <Button 
              variant="outline" 
              className="w-full justify-start h-10 sm:h-11 text-sm sm:text-base" 
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
} 