"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { initializeApp } from "firebase/app"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { getFirestore, collection, getDocs, doc, updateDoc, query, where, orderBy } from "firebase/firestore"
import DashboardDrawer from "@/components/dashboard-drawer"
import { Eye } from "lucide-react"

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

type Order = {
  id: string
  userId: string
  userName: string
  items: Array<{
    id: string
    name: string
    price: number
    quantity: number
  }>
  total: number
  status: "pending" | "processing" | "completed" | "cancelled"
  address: string
  phone: string
  createdAt: any // Firestore timestamp
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("all")
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)
  const [statusUpdate, setStatusUpdate] = useState<{
    orderId: string
    currentStatus: Order["status"]
    newStatus: Order["status"]
  } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/auth/login")
        return
      }

      fetchOrders()
    })

    return () => unsubscribe()
  }, [router, activeTab])

  const fetchOrders = async () => {
    setError(null)
    try {
      console.log("Fetching orders...")
      let ordersQuery = collection(db, "orders")

      // Filter by status if not "all"
      let finalQuery = query(ordersQuery, orderBy("createdAt", "desc"))
      if (activeTab !== "all") {
        finalQuery = query(ordersQuery, where("status", "==", activeTab), orderBy("createdAt", "desc"))
      }

      const querySnapshot = await getDocs(finalQuery)
      const fetchedOrders: Order[] = []

      querySnapshot.forEach((doc) => {
        fetchedOrders.push({
          id: doc.id,
          ...(doc.data() as Omit<Order, "id">),
        })
      })

      console.log(`Fetched ${fetchedOrders.length} orders`)
      setOrders(fetchedOrders)
    } catch (err) {
      console.error("Error fetching orders:", err)
      setError("Failed to load orders. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  const confirmStatusUpdate = (orderId: string, currentStatus: Order["status"], newStatus: Order["status"]) => {
    setStatusUpdate({ orderId, currentStatus, newStatus })
    setIsStatusDialogOpen(true)
  }

  const updateOrderStatus = async () => {
    if (!statusUpdate) return

    setIsSubmitting(true)
    try {
      console.log(
        `Updating order ${statusUpdate.orderId} status from ${statusUpdate.currentStatus} to ${statusUpdate.newStatus}`,
      )
      await updateDoc(doc(db, "orders", statusUpdate.orderId), {
        status: statusUpdate.newStatus,
      })

      console.log("Order status updated successfully")

      // Update local state
      setOrders(
        orders.map((order) =>
          order.id === statusUpdate.orderId ? { ...order, status: statusUpdate.newStatus } : order,
        ),
      )

      // Close dialog
      setStatusUpdate(null)
      setIsStatusDialogOpen(false)
    } catch (err) {
      console.error("Error updating order status:", err)
      setError("Failed to update order status. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusBadgeClass = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "processing":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusActionText = (newStatus: Order["status"]) => {
    switch (newStatus) {
      case "processing":
        return "Process"
      case "completed":
        return "Complete"
      case "cancelled":
        return "Cancel"
      default:
        return "Update"
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
          <h1 className="text-3xl font-bold">Order Management</h1>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All Orders</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="processing">Processing</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>
          <TabsContent value={activeTab} className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  {activeTab === "all"
                    ? "All Orders"
                    : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Orders`}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <p className="text-center text-muted-foreground">No orders found</p>
                ) : (
                  <div className="rounded-md border">
                    <div className="grid grid-cols-7 gap-4 p-4 font-medium">
                      <div>Order ID</div>
                      <div>Customer</div>
                      <div>Items</div>
                      <div>Total</div>
                      <div>Date</div>
                      <div>Status</div>
                      <div>Actions</div>
                    </div>
                    <div className="divide-y">
                      {orders.map((order) => (
                        <div key={order.id} className="grid grid-cols-7 gap-4 p-4">
                          <div className="text-sm font-medium">#{order.id.slice(0, 8)}</div>
                          <div className="text-sm">{order.userName}</div>
                          <div className="text-sm">{order.items.length} items</div>
                          <div className="text-sm font-medium">${order.total.toFixed(2)}</div>
                          <div className="text-sm">{new Date(order.createdAt.seconds * 1000).toLocaleDateString()}</div>
                          <div className="text-sm">
                            <span className={`rounded-full px-2 py-1 text-xs ${getStatusBadgeClass(order.status)}`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </Button>
                            {order.status === "pending" && (
                              <Select
                                onValueChange={(value) =>
                                  confirmStatusUpdate(order.id, order.status, value as Order["status"])
                                }
                                defaultValue={order.status}
                              >
                                <SelectTrigger className="h-8 w-[110px]">
                                  <SelectValue placeholder="Update" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="processing">Process</SelectItem>
                                  <SelectItem value="completed">Complete</SelectItem>
                                  <SelectItem value="cancelled">Cancel</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                            {order.status === "processing" && (
                              <Select
                                onValueChange={(value) =>
                                  confirmStatusUpdate(order.id, order.status, value as Order["status"])
                                }
                                defaultValue={order.status}
                              >
                                <SelectTrigger className="h-8 w-[110px]">
                                  <SelectValue placeholder="Update" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="completed">Complete</SelectItem>
                                  <SelectItem value="cancelled">Cancel</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Status Update Confirmation Dialog */}
        <AlertDialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Status Update</AlertDialogTitle>
              <AlertDialogDescription>
                {statusUpdate && (
                  <>
                    Are you sure you want to change the status of order #{statusUpdate.orderId.slice(0, 8)} from{" "}
                    <span className="font-semibold">{statusUpdate.currentStatus}</span> to{" "}
                    <span className="font-semibold">{statusUpdate.newStatus}</span>?
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={updateOrderStatus} disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : statusUpdate ? getStatusActionText(statusUpdate.newStatus) : "Update"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
