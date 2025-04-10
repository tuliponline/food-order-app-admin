"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { initializeApp } from "firebase/app"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { getFirestore, collection, getDocs } from "firebase/firestore"
import DashboardDrawer from "@/components/dashboard-drawer"

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
const db = getFirestore(app)

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    users: 0,
    menuItems: 0,
    orders: 0,
    pendingOrders: 0,
  })
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/auth/login")
        return
      }

      fetchStats()
    })

    return () => unsubscribe()
  }, [router])

  const fetchStats = async () => {
    try {
      // This is a simplified example - in a real app, you'd implement proper queries
      const usersSnapshot = await getDocs(collection(db, "users"))
      const menuItemsSnapshot = await getDocs(collection(db, "menuItems"))
      const ordersSnapshot = await getDocs(collection(db, "orders"))

      // Count pending orders (simplified)
      let pendingCount = 0
      ordersSnapshot.forEach((doc) => {
        if (doc.data().status === "pending") {
          pendingCount++
        }
      })

      setStats({
        users: usersSnapshot.size,
        menuItems: menuItemsSnapshot.size,
        orders: ordersSnapshot.size,
        pendingOrders: pendingCount,
      })
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen">
      <div className="p-4 md:p-8 ml-0">
        <div className="flex items-center gap-4 mb-6">
          <DashboardDrawer />
          <h1 className="text-3xl font-bold">Dashboard</h1>
        </div>

        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.users}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Menu Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.menuItems}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.orders}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingOrders}</div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Tabs defaultValue="recent">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="recent">Recent Orders</TabsTrigger>
              <TabsTrigger value="popular">Popular Items</TabsTrigger>
            </TabsList>
            <TabsContent value="recent" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Orders</CardTitle>
                  <CardDescription>Latest customer orders from your app</CardDescription>
                </CardHeader>
                <CardContent>
                  {stats.orders === 0 ? (
                    <p className="text-muted-foreground">No orders yet</p>
                  ) : (
                    <div className="rounded-md border">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 p-4 font-medium">
                        <div>Order ID</div>
                        <div>Customer</div>
                        <div className="hidden sm:block">Items</div>
                        <div className="hidden md:block">Total</div>
                        <div className="hidden md:block">Status</div>
                      </div>
                      <div className="divide-y">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 p-4">
                          <div className="text-sm">#ORD-001</div>
                          <div className="text-sm">John Doe</div>
                          <div className="text-sm hidden sm:block">3 items</div>
                          <div className="text-sm hidden md:block">$24.99</div>
                          <div className="text-sm hidden md:block">
                            <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs text-yellow-800">
                              Pending
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="popular" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Popular Items</CardTitle>
                  <CardDescription>Most ordered food items</CardDescription>
                </CardHeader>
                <CardContent>
                  {stats.menuItems === 0 ? (
                    <p className="text-muted-foreground">No menu items yet</p>
                  ) : (
                    <div className="rounded-md border">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-4 font-medium">
                        <div>Item</div>
                        <div className="hidden sm:block">Category</div>
                        <div className="hidden md:block">Price</div>
                        <div>Orders</div>
                      </div>
                      <div className="divide-y">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-4">
                          <div className="text-sm">Margherita Pizza</div>
                          <div className="text-sm hidden sm:block">Pizza</div>
                          <div className="text-sm hidden md:block">$12.99</div>
                          <div className="text-sm">42</div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
