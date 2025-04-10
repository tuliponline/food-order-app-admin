"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { LayoutDashboard, UtensilsCrossed, ShoppingBag, Users, LogOut } from "lucide-react"
import { initializeApp } from "firebase/app"
import { getAuth, signOut } from "firebase/auth"

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

export default function DashboardNav() {
  const pathname = usePathname()

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
    <div className="flex h-screen w-64 flex-col border-r bg-muted/10">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/" className="flex items-center font-semibold">
          <UtensilsCrossed className="mr-2 h-5 w-5" />
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
              className={cn("justify-start", pathname === item.href ? "bg-secondary" : "")}
            >
              <Link href={item.href}>
                {item.icon}
                {item.title}
              </Link>
            </Button>
          ))}
        </nav>
      </div>
      <div className="border-t p-4">
        <Button variant="outline" className="w-full justify-start" onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}
