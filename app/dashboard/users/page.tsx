"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
import { getFirestore, collection, getDocs, doc, deleteDoc } from "firebase/firestore"
import DashboardDrawer from "@/components/dashboard-drawer"
import { Eye, Trash2 } from "lucide-react"

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

type User = {
  id: string
  name: string
  email: string
  phone: string
  address: string
  createdAt: any // Firestore timestamp
  orderCount: number
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/auth/login")
        return
      }

      fetchUsers()
    })

    return () => unsubscribe()
  }, [router])

  const fetchUsers = async () => {
    setError(null)
    try {
      console.log("Fetching users...")
      const querySnapshot = await getDocs(collection(db, "users"))
      const fetchedUsers: User[] = []

      // Get all orders to count per user
      const ordersSnapshot = await getDocs(collection(db, "orders"))
      const ordersByUser: Record<string, number> = {}

      ordersSnapshot.forEach((doc) => {
        const userId = doc.data().userId
        ordersByUser[userId] = (ordersByUser[userId] || 0) + 1
      })

      querySnapshot.forEach((doc) => {
        fetchedUsers.push({
          id: doc.id,
          ...(doc.data() as Omit<User, "id" | "orderCount">),
          orderCount: ordersByUser[doc.id] || 0,
        })
      })

      console.log(`Fetched ${fetchedUsers.length} users`)
      setUsers(fetchedUsers)
    } catch (err) {
      console.error("Error fetching users:", err)
      setError("Failed to load users. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  const confirmDeleteUser = (user: User) => {
    setUserToDelete(user)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteUser = async () => {
    if (!userToDelete) return

    setIsSubmitting(true)
    try {
      console.log(`Deleting user: ${userToDelete.id} (${userToDelete.name})`)
      await deleteDoc(doc(db, "users", userToDelete.id))
      console.log("User deleted successfully")

      // Update local state
      setUsers(users.filter((user) => user.id !== userToDelete.id))

      // Close dialog
      setUserToDelete(null)
      setIsDeleteDialogOpen(false)
    } catch (err) {
      console.error("Error deleting user:", err)
      setError("Failed to delete user. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleViewUser = (user: User) => {
    setSelectedUser(user)
    setIsViewDialogOpen(true)
  }

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen">
       <div className="p-4 md:p-8 ml-0">
        <div className="flex items-center gap-4 mb-6">
          <DashboardDrawer />
          <h1 className="text-3xl font-bold">User Management</h1>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <p className="text-center text-muted-foreground">No users found</p>
            ) : (
              <div className="rounded-md border">
                <div className="grid grid-cols-6 gap-4 p-4 font-medium">
                  <div>Name</div>
                  <div>Email</div>
                  <div>Phone</div>
                  <div>Joined</div>
                  <div>Orders</div>
                  <div>Actions</div>
                </div>
                <div className="divide-y">
                  {users.map((user) => (
                    <div key={user.id} className="grid grid-cols-6 gap-4 p-4">
                      <div className="text-sm font-medium">{user.name}</div>
                      <div className="text-sm">{user.email}</div>
                      <div className="text-sm">{user.phone}</div>
                      <div className="text-sm">{new Date(user.createdAt.seconds * 1000).toLocaleDateString()}</div>
                      <div className="text-sm">{user.orderCount}</div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => handleViewUser(user)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => confirmDeleteUser(user)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Details Dialog */}
        {selectedUser && (
          <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>User Details</DialogTitle>
                <DialogDescription>Detailed information about {selectedUser.name}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="font-medium">Name:</div>
                  <div>{selectedUser.name}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="font-medium">Email:</div>
                  <div>{selectedUser.email}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="font-medium">Phone:</div>
                  <div>{selectedUser.phone}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="font-medium">Address:</div>
                  <div>{selectedUser.address}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="font-medium">Joined:</div>
                  <div>{new Date(selectedUser.createdAt.seconds * 1000).toLocaleDateString()}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="font-medium">Total Orders:</div>
                  <div>{selectedUser.orderCount}</div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Delete User Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                {userToDelete && (
                  <>
                    This action cannot be undone. This will permanently delete the user{" "}
                    <span className="font-semibold">{userToDelete.name}</span> and all associated data.
                    {userToDelete.orderCount > 0 && (
                      <p className="mt-2 text-red-500">
                        Warning: This user has {userToDelete.orderCount} orders. Deleting this user may cause issues
                        with order management.
                      </p>
                    )}
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteUser}
                disabled={isSubmitting}
                className="bg-red-500 hover:bg-red-600"
              >
                {isSubmitting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
