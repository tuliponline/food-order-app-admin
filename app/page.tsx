import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
      <div className="flex flex-col items-center justify-center space-y-4 sm:space-y-6 text-center">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
          Food Order Admin Panel
        </h1>
        <p className="max-w-[600px] sm:max-w-[700px] text-base sm:text-lg text-muted-foreground">
          Manage your food ordering application from this admin panel. Connect to the same Firebase backend used by your
          Flutter mobile app.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-4 sm:mt-6 w-full sm:w-auto">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
            <Link href="/auth/login">Login</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-12 sm:mt-16">
        <Card className="h-full flex flex-col">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">User Management</CardTitle>
            <CardDescription>Manage users and authentication</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-sm sm:text-base">Handle user registrations, logins, and profile management with Firebase Authentication.</p>
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/users">Manage Users</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="h-full flex flex-col">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">Menu Management</CardTitle>
            <CardDescription>Manage food items and categories</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-sm sm:text-base">Add, edit, and remove food items and categories. Upload images to Firebase Storage.</p>
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/menu">Manage Menu</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="h-full flex flex-col">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">Order Management</CardTitle>
            <CardDescription>Track and manage customer orders</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-sm sm:text-base">View, update, and process customer orders stored in Firebase Firestore.</p>
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/orders">Manage Orders</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
