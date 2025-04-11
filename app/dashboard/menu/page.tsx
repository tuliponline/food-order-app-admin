"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { initializeApp } from "firebase/app"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc, updateDoc } from "firebase/firestore"
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"
import DashboardDrawer from "@/components/dashboard-drawer"
import { Pencil, Trash2, Plus, Globe, Grid, List, Table } from "lucide-react"
import { Switch } from "@/components/ui/switch"

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
const storage = getStorage(app)

// Define language type for multi-language support
type LanguageContent = {
  en: string
  lo: string
  th: string
}

type MenuItem = {
  id: string
  name: LanguageContent
  description: LanguageContent
  price: number
  category: string
  imageUrl: string
  status: "enabled" | "disabled"
}

type Category = {
  id: string
  name: LanguageContent
  slug: string
  sequence: number
}

// Available languages
const languages = [
  { code: "en", name: "อังกฤษ" },
  { code: "lo", name: "ลาว" },
  { code: "th", name: "ไทย" },
]

// Helper function to resize image
const resizeImage = async (file: File, maxWidth: number = 800, maxHeight: number = 800): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.src = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(img.src)
      let width = img.width
      let height = img.height

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width)
        width = maxWidth
      }

      if (height > maxHeight) {
        width = Math.round((width * maxHeight) / height)
        height = maxHeight
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Could not get canvas context'))
        return
      }
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Could not create blob'))
          return
        }
        resolve(blob)
      }, file.type, 0.8) // 0.8 is the quality (0-1)
    }
    img.onerror = () => {
      URL.revokeObjectURL(img.src)
      reject(new Error('Failed to load image'))
    }
  })
}

export default function MenuPage() {
  const [activeTab, setActiveTab] = useState("items")
  const [viewMode, setViewMode] = useState<"grid" | "list" | "table">("grid")
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [displayLanguage, setDisplayLanguage] = useState<"en" | "lo" | "th">("en")

  // Menu item state
  const [newItem, setNewItem] = useState({
    name: { en: "", lo: "", th: "" },
    description: { en: "", lo: "", th: "" },
    price: "",
    category: "",
    image: null as File | null,
    status: "enabled" as "enabled" | "disabled"
  })
  const [editItem, setEditItem] = useState<{
    id: string
    name: LanguageContent
    description: LanguageContent
    price: string
    category: string
    imageUrl: string
    image: File | null
    status: "enabled" | "disabled"
  } | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)

  // Category state
  const [newCategory, setNewCategory] = useState({
    name: { en: "", lo: "", th: "" },
    slug: "",
    sequence: 0
  })
  const [editCategory, setEditCategory] = useState<{
    id: string
    name: LanguageContent
    slug: string
    sequence: number
  } | null>(null)
  const [isCategoryAddDialogOpen, setIsCategoryAddDialogOpen] = useState(false)
  const [isCategoryEditDialogOpen, setIsCategoryEditDialogOpen] = useState(false)
  const [isCategoryDeleteDialogOpen, setIsCategoryDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/auth/login")
        return
      }

      fetchData()
    })

    return () => unsubscribe()
  }, [router])

  const fetchData = async () => {
    setError(null)
    setLoading(true)
    try {
      await Promise.all([fetchMenuItems(), fetchCategories()])
    } catch (err) {
      console.error("ผิดพลาดการดึงข้อมูล:", err)
      setError("การดึงข้อมูลล้มเหลว กรุณาลองใหม่อีกครั้ง")
    } finally {
      setLoading(false)
    }
  }

  const fetchMenuItems = async () => {
    try {
      console.log("ดึงข้อมูลเมนู...")
      const querySnapshot = await getDocs(collection(db, "menuItems"))
      const items: MenuItem[] = []

      querySnapshot.forEach((doc) => {
        const data = doc.data()

        // Handle both old format and new multi-language format
        const name = typeof data.name === "object" ? data.name : { en: data.name, lo: data.name, th: data.name }
        const description =
          typeof data.description === "object"
            ? data.description
            : { en: data.description, lo: data.description, th: data.description }

        items.push({
          id: doc.id,
          name,
          description,
          price: data.price,
          category: data.category,
          imageUrl: data.imageUrl,
          status: data.status || "enabled"
        })
      })

      console.log(`Fetched ${items.length} menu items`)
      setMenuItems(items)
      return items
    } catch (err) {
      console.error("ผิดพลาดการดึงข้อมูลเมนู:", err)
      throw err
    }
  }

  const fetchCategories = async () => {
    try {
      console.log("ดึงข้อมูลหมวดหมู่...")
      const querySnapshot = await getDocs(collection(db, "categories"))
      const fetchedCategories: Category[] = []

      querySnapshot.forEach((doc) => {
        const data = doc.data()

        // Handle both old format and new multi-language format
        const name = typeof data.name === "object" ? data.name : { en: data.name, lo: data.name, th: data.name }

        fetchedCategories.push({
          id: doc.id,
          name,
          slug: data.slug,
          sequence: data.sequence || 0
        })
      })

      // Sort categories by sequence number
      fetchedCategories.sort((a, b) => a.sequence - b.sequence)

      console.log(`ดึงข้อมูล ${fetchedCategories.length} หมวดหมู่`)
      setCategories(fetchedCategories)
      return fetchedCategories
    } catch (err) {
      console.error("ผิดพลาดการดึงข้อมูลหมวดหมู่:", err)
      throw err
    }
  }

  // Menu Item Functions
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setIsSubmitting(true)

    try {
      // Validate inputs
      if (!newItem.name.en || !newItem.description.en || !newItem.price || !newItem.category) {
        setFormError("กรุณากรอกข้อมูลทั้งหมด (อย่างน้อยหนึ่งภาษาเป็นอังกฤษ)")
        setIsSubmitting(false)
        return
      }

      console.log("เพิ่มเมนูใหม่:", newItem)
      let imageUrl = ""

      // Upload image if provided
      if (newItem.image) {
        console.log("ปรับขนาดและอัพโหลดรูปภาพไปยัง Firebase Storage...")
        const resizedImage = await resizeImage(newItem.image)
        const storageRef = ref(storage, `menuItems/${Date.now()}_${newItem.image.name}`)
        const snapshot = await uploadBytes(storageRef, resizedImage)
        imageUrl = await getDownloadURL(snapshot.ref)
        console.log("รูปภาพอัพโหลดสำเร็จ:", imageUrl)
      }

      // Add document to Firestore
      console.log("เพิ่มเอกสารไปยัง Firestore...")
      const docRef = await addDoc(collection(db, "menuItems"), {
        name: newItem.name,
        description: newItem.description,
        price: Number.parseFloat(newItem.price),
        category: newItem.category,
        imageUrl: imageUrl,
        status: newItem.status
      })

      console.log("เพิ่มเอกสารด้วย ID:", docRef.id)

      // Reset form and close dialog
      setNewItem({
        name: { en: "", lo: "", th: "" },
        description: { en: "", lo: "", th: "" },
        price: "",
        category: "",
        image: null,
        status: "enabled"
      })
      setIsAddDialogOpen(false)

      // Refresh menu items
      fetchMenuItems()
    } catch (err) {
      console.error("ผิดพลาดในการเพิ่มเมนู:", err)
      setFormError("การเพิ่มเมนูล้มเหลว กรุณาลองใหม่อีกครั้ง")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editItem) return

    setFormError(null)
    setIsSubmitting(true)

    try {
      // Validate inputs
      if (!editItem.name.en || !editItem.description.en || !editItem.price || !editItem.category) {
        setFormError("กรุณากรอกข้อมูลทั้งหมด (อย่างน้อยหนึ่งภาษาเป็นอังกฤษ)")
        setIsSubmitting(false)
        return
      }

      console.log("อัพเดตเมนู:", editItem)
      let imageUrl = editItem.imageUrl

      // Upload new image if provided
      if (editItem.image) {
        console.log("ปรับขนาดและอัพโหลดรูปภาพใหม่ไปยัง Firebase Storage...")
        const resizedImage = await resizeImage(editItem.image)
        const storageRef = ref(storage, `menuItems/${Date.now()}_${editItem.image.name}`)
        const snapshot = await uploadBytes(storageRef, resizedImage)
        imageUrl = await getDownloadURL(snapshot.ref)
        console.log("รูปภาพอัพโหลดสำเร็จ:", imageUrl)
      }

      // Update document in Firestore
      console.log("อัพเดตเอกสาร...")
      await updateDoc(doc(db, "menuItems", editItem.id), {
        name: editItem.name,
        description: editItem.description,
        price: Number.parseFloat(editItem.price),
        category: editItem.category,
        imageUrl: imageUrl,
        status: editItem.status
      })

      console.log("เอกสารอัพเดตสำเร็จ")

      // Reset form and close dialog
      setEditItem(null)
      setIsEditDialogOpen(false)

      // Refresh menu items
      fetchMenuItems()
    } catch (err) {
      console.error("ผิดพลาดในการอัพเดตเมนู:", err)
      setFormError("การอัพเดตเมนูล้มเหลว กรุณาลองใหม่อีกครั้ง")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteItem = async () => {
    if (!itemToDelete) return

    setIsSubmitting(true)
    try {
      console.log("ลบเมนู:", itemToDelete)
      await deleteDoc(doc(db, "menuItems", itemToDelete))
      console.log("เอกสารลบสำเร็จ")

      // Close dialog and refresh menu items
      setItemToDelete(null)
      setIsDeleteDialogOpen(false)
      fetchMenuItems()
    } catch (err) {
      console.error("ผิดพลาดในการลบเมนู:", err)
      setError("การลบเมนูล้มเหลว กรุณาลองใหม่อีกครั้ง")
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEditDialog = (item: MenuItem) => {
    setEditItem({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      category: item.category,
      imageUrl: item.imageUrl,
      image: null,
      status: item.status
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (id: string) => {
    setItemToDelete(id)
    setIsDeleteDialogOpen(true)
  }

  // Category Functions
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setIsSubmitting(true)

    try {
      // Validate inputs
      if (!newCategory.name.en || !newCategory.slug) {
        setFormError("กรุณากรอกข้อมูลทั้งหมด (อย่างน้อยหนึ่งภาษาเป็นอังกฤษ)")
        setIsSubmitting(false)
        return
      }

      // Check if slug already exists
      const slugExists = categories.some((category) => category.slug === newCategory.slug)
      if (slugExists) {
        setFormError("A category with this slug already exists")
        setIsSubmitting(false)
        return
      }

      // Get the next sequence number
      const nextSequence = categories.length > 0 
        ? Math.max(...categories.map(c => c.sequence)) + 1 
        : 1

      console.log("เพิ่มหมวดหมู่ใหม่:", newCategory)

      // Add document to Firestore
      const docRef = await addDoc(collection(db, "categories"), {
        name: newCategory.name,
        slug: newCategory.slug,
        sequence: nextSequence
      })

      console.log("เพิ่มหมวดหมู่ด้วย ID:", docRef.id)

      // Reset form and close dialog
      setNewCategory({
        name: { en: "", lo: "", th: "" },
        slug: "",
        sequence: 0
      })
      setIsCategoryAddDialogOpen(false)

      // Refresh categories
      fetchCategories()
    } catch (err) {
      console.error("ผิดพลาดในการเพิ่มหมวดหมู่:", err)
      setFormError("การเพิ่มหมวดหมู่ล้มเหลว กรุณาลองใหม่อีกครั้ง")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editCategory) return

    setFormError(null)
    setIsSubmitting(true)

    try {
      // Validate inputs
      if (!editCategory.name.en || !editCategory.slug) {
        setFormError("กรุณากรอกข้อมูลทั้งหมด (อย่างน้อยหนึ่งภาษาเป็นอังกฤษ)")
        setIsSubmitting(false)
        return
      }

      // Check if slug already exists (excluding the current category)
      const slugExists = categories.some(
        (category) => category.slug === editCategory.slug && category.id !== editCategory.id,
      )
      if (slugExists) {
        setFormError("A category with this slug already exists")
        setIsSubmitting(false)
        return
      }

      console.log("Updating category:", editCategory)

      // Update document in Firestore
      await updateDoc(doc(db, "categories", editCategory.id), {
        name: editCategory.name,
        slug: editCategory.slug,
      })

      console.log("Category updated successfully")

      // Reset form and close dialog
      setEditCategory(null)
      setIsCategoryEditDialogOpen(false)

      // Refresh categories
      fetchCategories()
    } catch (err) {
      console.error("Error updating category:", err)
      setFormError("Failed to update category. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return

    setIsSubmitting(true)
    try {
      console.log("Deleting category:", categoryToDelete)

      // Check if any menu items use this category
      const itemsWithCategory = menuItems.filter((item) => item.category === categoryToDelete.slug)

      if (itemsWithCategory.length > 0) {
        setError(
          `ไม่สามารถลบหมวดหมู่ "${categoryToDelete.name[displayLanguage]}" เพราะมี ${itemsWithCategory.length} เมนูอาหารใช้งาน`,
        )
        setIsCategoryDeleteDialogOpen(false)
        setCategoryToDelete(null)
        setIsSubmitting(false)
        return
      }

      await deleteDoc(doc(db, "categories", categoryToDelete.id))
      console.log("ลบหมวดหมู่สำเร็จ")

      // Close dialog and refresh categories
      setCategoryToDelete(null)
      setIsCategoryDeleteDialogOpen(false)
      fetchCategories()
    } catch (err) {
      console.error("ผิดพลาดในการลบหมวดหมู่:", err)
      setError("การลบหมวดหมู่ล้มเหลว กรุณาลองใหม่อีกครั้ง")
    } finally {
      setIsSubmitting(false)
    }
  }

  const openCategoryEditDialog = (category: Category) => {
    setEditCategory({
      id: category.id,
      name: category.name,
      slug: category.slug,
      sequence: category.sequence
    })
    setIsCategoryEditDialogOpen(true)
  }

  const openCategoryDeleteDialog = (category: Category) => {
    setCategoryToDelete(category)
    setIsCategoryDeleteDialogOpen(true)
  }

  // Helper function to generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
  }

  const handleToggleStatus = async (item: MenuItem) => {
    try {
      const newStatus = item.status === "enabled" ? "disabled" : "enabled"
      await updateDoc(doc(db, "menuItems", item.id), {
        status: newStatus
      })
      fetchMenuItems()
    } catch (err) {
      console.error("ผิดพลาดในการเปลี่ยนสถานะ:", err)
      setError("การเปลี่ยนสถานะล้มเหลว กรุณาลองใหม่อีกครั้ง")
    }
  }

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen">
      <div className="p-4 md:p-8 ml-0">
        <div className="flex items-center gap-4 mb-4 sm:mb-6">
          <DashboardDrawer />
          <h1 className="text-2xl sm:text-3xl font-bold">จัดการเมนู</h1>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Label htmlFor="display-language" className="text-sm sm:text-base">
                  ภาษาที่แสดง:
              </Label>
              <Select value={displayLanguage} onValueChange={(value: "en" | "lo" | "th") => setDisplayLanguage(value)}>
                <SelectTrigger id="display-language" className="w-[140px] sm:w-[180px]">
                  <SelectValue placeholder="เลือกภาษา" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      <div className="flex items-center">
                        <Globe className="mr-2 h-4 w-4" />
                        {lang.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setViewMode("grid")}
                className={viewMode === "grid" ? "bg-secondary" : ""}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setViewMode("list")}
                className={viewMode === "list" ? "bg-secondary" : ""}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setViewMode("table")}
                className={viewMode === "table" ? "bg-secondary" : ""}
              >
                <Table className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4 sm:mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="items" className="flex-1 sm:flex-none">เมนู</TabsTrigger>
            <TabsTrigger value="categories" className="flex-1 sm:flex-none">หมวดหมู่</TabsTrigger>
          </TabsList>

          <TabsContent value="items">
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-lg sm:text-xl font-semibold">เมนู</h2>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" />
                    เพิ่มรายการใหม่
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <form onSubmit={handleAddItem}>
                    <DialogHeader>
                      <DialogTitle>เพิ่มรายการอาหารใหม่</DialogTitle>
                      <DialogDescription>
                        กรอกรายละเอียดสำหรับรายการอาหารใหม่ในหลายภาษา
                      </DialogDescription>
                    </DialogHeader>
                    {formError && (
                      <Alert variant="destructive" className="my-4">
                        <AlertDescription>{formError}</AlertDescription>
                      </Alert>
                    )}
                    <div className="grid gap-4 py-4">
                      <Tabs defaultValue="en" className="w-full">
                        <TabsList className="mb-4">
                            <TabsTrigger value="en">อังกฤษ</TabsTrigger>
                          <TabsTrigger value="lo">ลาว</TabsTrigger>
                          <TabsTrigger value="th">ไทย</TabsTrigger>
                        </TabsList>
                        <TabsContent value="en">
                          <div className="grid gap-2">
                            <Label htmlFor="name-en">ชื่อ (อังกฤษ) *</Label>
                            <Input
                              id="name-en"
                              value={newItem.name.en}
                              onChange={(e) =>
                                setNewItem({
                                  ...newItem,
                                  name: { ...newItem.name, en: e.target.value },
                                })
                              }
                              required
                            />
                          </div>
                          <div className="grid gap-2 mt-4">
                            <Label htmlFor="description-en">คำอธิบาย (อังกฤษ) *</Label>
                            <Textarea
                              id="description-en"
                              value={newItem.description.en}
                              onChange={(e) =>
                                setNewItem({
                                  ...newItem,
                                  description: { ...newItem.description, en: e.target.value },
                                })
                              }
                              required
                            />
                          </div>
                        </TabsContent>
                        <TabsContent value="lo">
                          <div className="grid gap-2">
                            <Label htmlFor="name-lo">ชื่อ (ลาว)</Label>
                            <Input
                              id="name-lo"
                              value={newItem.name.lo}
                              onChange={(e) =>
                                setNewItem({
                                  ...newItem,
                                  name: { ...newItem.name, lo: e.target.value },
                                })
                              }
                            />
                          </div>
                          <div className="grid gap-2 mt-4">
                            <Label htmlFor="description-lo">คำอธิบาย (ลาว)</Label>
                            <Textarea
                              id="description-lo"
                              value={newItem.description.lo}
                              onChange={(e) =>
                                setNewItem({
                                  ...newItem,
                                  description: { ...newItem.description, lo: e.target.value },
                                })
                              }
                            />
                          </div>
                        </TabsContent>
                        <TabsContent value="th">
                          <div className="grid gap-2">
                            <Label htmlFor="name-th">ชื่อ (ไทย)</Label>
                            <Input
                              id="name-th"
                              value={newItem.name.th}
                              onChange={(e) =>
                                setNewItem({
                                  ...newItem,
                                  name: { ...newItem.name, th: e.target.value },
                                })
                              }
                            />
                          </div>
                          <div className="grid gap-2 mt-4">
                            <Label htmlFor="description-th">คำอธิบาย (ไทย)</Label>
                            <Textarea
                              id="description-th"
                              value={newItem.description.th}
                              onChange={(e) =>
                                setNewItem({
                                  ...newItem,
                                  description: { ...newItem.description, th: e.target.value },
                                })
                              }
                            />
                          </div>
                        </TabsContent>
                      </Tabs>

                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="grid gap-2">
                          <Label htmlFor="price">ราคา (กีบ) *</Label>
                          <Input
                            id="price"
                            type="number"
                            step="0.01"
                            min="0"
                            value={newItem.price}
                            onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                            required
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="category">หมวดหมู่ *</Label>
                          <Select
                            value={newItem.category}
                            onValueChange={(value) => setNewItem({ ...newItem, category: value })}
                            required
                          >
                            <SelectTrigger id="category">
                              <SelectValue placeholder="เลือกหมวดหมู่" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.length === 0 ? (
                                <SelectItem value="" disabled>
                                  No categories available
                                </SelectItem>
                              ) : (
                                categories.map((category) => (
                                  <SelectItem key={category.id} value={category.slug}>
                                    {category.name.th}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="status">สถานะ</Label>
                        <Select
                          value={newItem.status}
                          onValueChange={(value: "enabled" | "disabled") => setNewItem({ ...newItem, status: value })}
                        >
                          <SelectTrigger id="status">
                            <SelectValue placeholder="เลือกสถานะ" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="enabled">เปิด</SelectItem>
                            <SelectItem value="disabled">ปิด</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="image">รูปภาพ</Label>
                        <Input
                          id="image"
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null
                            setNewItem({ ...newItem, image: file })
                          }}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                        ยกเลิก
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "กำลังเพิ่ม..." : "เพิ่มรายการ"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {viewMode === "grid" && (
              <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {menuItems.length === 0 ? (
                  <p className="col-span-full text-center text-muted-foreground">
                    No menu items yet. Add your first item!
                  </p>
                ) : (
                  menuItems.map((item) => (
                    <Card key={item.id} className={item.status === "disabled" ? "opacity-50" : ""}>
                      <div className="aspect-video w-full overflow-hidden">
                        <img
                          src={item.imageUrl || "/placeholder.svg?height=200&width=400"}
                          alt={item.name[displayLanguage] || item.name.en}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <CardHeader className="p-3 sm:p-4">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg sm:text-xl">{item.name[displayLanguage] || item.name.en}</CardTitle>
                          <div className="flex space-x-1 sm:space-x-2">
                            <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={() => openEditDialog(item)}>
                              <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 sm:h-8 sm:w-8 text-red-500 hover:text-red-600"
                              onClick={() => openDeleteDialog(item.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="px-2 py-1 text-xs sm:text-sm">
                            {item.category}
                          </Badge>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={item.status === "enabled"}
                                onCheckedChange={() => handleToggleStatus(item)}
                                className="data-[state=checked]:bg-green-500"
                              />
                              <span className="text-xs sm:text-sm">
                                {item.status === "enabled" ? "Enabled" : "Disabled"}
                              </span>
                            </div>
                            <span className="font-bold text-sm sm:text-base">${item.price.toFixed(2)}</span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-3 sm:p-4 pt-0">
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {item.description[displayLanguage] || item.description.en}
                        </p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}

            {viewMode === "list" && (
              <div className="space-y-3 sm:space-y-4">
                {menuItems.length === 0 ? (
                  <p className="text-center text-muted-foreground">No menu items yet. Add your first item!</p>
                ) : (
                  menuItems.map((item) => (
                    <Card key={item.id} className={item.status === "disabled" ? "opacity-50" : ""}>
                      <div className="flex flex-col sm:flex-row">
                        <div className="w-full sm:w-48 h-48 sm:h-auto">
                          <img
                            src={item.imageUrl || "/placeholder.svg?height=200&width=400"}
                            alt={item.name[displayLanguage] || item.name.en}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex-1 p-3 sm:p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg sm:text-xl">{item.name[displayLanguage] || item.name.en}</CardTitle>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="text-xs sm:text-sm">
                                  {item.category}
                                </Badge>
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={item.status === "enabled"}
                                    onCheckedChange={() => handleToggleStatus(item)}
                                    className="data-[state=checked]:bg-green-500"
                                  />
                                  <span className="text-xs sm:text-sm">
                                    {item.status === "enabled" ? "Enabled" : "Disabled"}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex space-x-1 sm:space-x-2">
                              <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={() => openEditDialog(item)}>
                                <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 sm:h-8 sm:w-8 text-red-500 hover:text-red-600"
                                onClick={() => openDeleteDialog(item.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              </Button>
                            </div>
                          </div>
                          <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
                            {item.description[displayLanguage] || item.description.en}
                          </p>
                          <div className="mt-4 flex items-center justify-between">
                            <span className="font-bold text-sm sm:text-base">${item.price.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            )}

            {viewMode === "table" && (
              <div className="rounded-md border overflow-x-auto">
                <div className="grid grid-cols-7 gap-2 sm:gap-4 p-2 sm:p-4 font-medium text-xs sm:text-sm">
                  <div className="w-16 sm:w-24">รูปภาพ</div>
                  <div>ชื่อ</div>
                  <div>หมวดหมู่</div>
                  <div className="hidden sm:block">คำอธิบาย</div>
                  <div>สถานะ</div>
                  <div>ราคา</div>
                  <div>การกระทำ</div>
                </div>
                <div className="divide-y">
                  {menuItems.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">ไม่มีรายการเมนูอะไรเลย เพิ่มรายการเมนูของคุณก่อน!</div>
                  ) : (
                    menuItems.map((item) => (
                      <div key={item.id} className="grid grid-cols-7 gap-2 sm:gap-4 p-2 sm:p-4">
                        <div className="w-16 sm:w-24 h-16 sm:h-24 overflow-hidden rounded-md">
                          <img
                            src={item.imageUrl || "/placeholder.svg?height=200&width=400"}
                            alt={item.name[displayLanguage] || item.name.en}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="text-xs sm:text-sm font-medium">{item.name[displayLanguage] || item.name.en}</div>
                        <div className="text-xs sm:text-sm">
                          {item.category}
                        </div>
                        <div className="hidden sm:block text-xs sm:text-sm text-muted-foreground">
                          {item.description[displayLanguage] || item.description.en}
                        </div>
                        <div className="text-xs sm:text-sm">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={item.status === "enabled"}
                              onCheckedChange={() => handleToggleStatus(item)}
                              className="data-[state=checked]:bg-green-500"
                            />
                            <span>{item.status === "enabled" ? "Enabled" : "Disabled"}</span>
                          </div>
                        </div>
                        <div className="text-xs sm:text-sm font-medium">${item.price.toFixed(2)}</div>
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(item)} className="h-7 sm:h-9">
                            <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            <span className="hidden sm:inline ml-2">แก้ไข</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 sm:h-9 text-red-500 hover:text-red-600"
                            onClick={() => openDeleteDialog(item.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            <span className="hidden sm:inline ml-2">ลบ</span>
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="categories">
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-lg sm:text-xl font-semibold">หมวดหมู่</h2>
              <Dialog open={isCategoryAddDialogOpen} onOpenChange={setIsCategoryAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" />
                    เพิ่มหมวดหมู่ใหม่
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <form onSubmit={handleAddCategory}>
                    <DialogHeader>
                      <DialogTitle>เพิ่มหมวดหมู่ใหม่</DialogTitle>
                      <DialogDescription>สร้างหมวดหมู่ใหม่สำหรับรายการเมนูในหลายภาษา</DialogDescription>
                    </DialogHeader>
                    {formError && (
                      <Alert variant="destructive" className="my-4">
                        <AlertDescription>{formError}</AlertDescription>
                      </Alert>
                    )}
                    <div className="grid gap-4 py-4">
                      <Tabs defaultValue="en" className="w-full">
                        <TabsList className="mb-4">
                          <TabsTrigger value="en">อังกฤษ</TabsTrigger>
                          <TabsTrigger value="lo">ลาว</TabsTrigger>
                          <TabsTrigger value="th">ไทย</TabsTrigger>
                        </TabsList>
                        <TabsContent value="en">
                          <div className="grid gap-2">
                            <Label htmlFor="category-name-en">ชื่อ (อังกฤษ) *</Label>
                            <Input
                              id="category-name-en"
                              value={newCategory.name.en}
                              onChange={(e) => {
                                const name = e.target.value
                                setNewCategory({
                                  ...newCategory,
                                  name: { ...newCategory.name, en: name },
                                  slug: newCategory.slug || generateSlug(name),
                                })
                              }}
                              required
                            />
                          </div>
                        </TabsContent>
                        <TabsContent value="lo">
                          <div className="grid gap-2">
                            <Label htmlFor="category-name-lo">ชื่อ (ลาว)</Label>
                            <Input
                              id="category-name-lo"
                              value={newCategory.name.lo}
                              onChange={(e) => {
                                setNewCategory({
                                  ...newCategory,
                                  name: { ...newCategory.name, lo: e.target.value },
                                })
                              }}
                            />
                          </div>
                        </TabsContent>
                        <TabsContent value="th">
                          <div className="grid gap-2">
                            <Label htmlFor="category-name-th">ชื่อ (ไทย)</Label>
                            <Input
                              id="category-name-th"
                              value={newCategory.name.th}
                              onChange={(e) => {
                                setNewCategory({
                                  ...newCategory,
                                  name: { ...newCategory.name, th: e.target.value },
                                })
                              }}
                            />
                          </div>
                        </TabsContent>
                      </Tabs>

                      <div className="grid gap-2 mt-4">
                        <Label htmlFor="category-slug">รหัสสำหรับหมวดหมู่ *</Label>
                        <Input
                          id="category-slug"
                          value={newCategory.slug}
                          onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value })}
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          รหัสสำหรับหมวดหมู่ใช้เป็นตัวระบุที่เฉพาะเจาะจงสำหรับหมวดหมู่ ใช้เฉพาะตัวพิมพ์เล็ก ตัวเลข และเครื่องหมายลบ
                        </p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsCategoryAddDialogOpen(false)}>
                        ยกเลิก
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "กำลังเพิ่ม..." : "เพิ่มหมวดหมู่"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-4 sm:p-6">
                {categories.length === 0 ? (
                  <p className="text-center text-muted-foreground">ไม่มีหมวดหมู่อะไรเลย เพิ่มหมวดหมู่ของคุณก่อน!</p>
                ) : (
                  <div className="rounded-md border">
                    <div className="hidden sm:grid grid-cols-5 gap-4 p-4 font-medium">
                      <div>ลำดับ</div>
                      <div>ชื่อ</div>
                      <div>รหัส</div>
                      <div>รายการเมนู</div>
                      <div>การกระทำ</div>
                    </div>
                    <div className="divide-y">
                      {categories.map((category) => {
                        const itemCount = menuItems.filter((item) => item.category === category.slug).length

                        return (
                          <div key={category.id} className="grid grid-cols-1 sm:grid-cols-5 gap-4 p-4">
                            <div className="space-y-1">
                              <div className="text-sm font-medium sm:hidden">ลำดับ</div>
                              <div className="font-medium">{category.sequence}</div>
                            </div>
                            <div className="space-y-1">
                              <div className="text-sm font-medium sm:hidden">ชื่อ</div>
                              <div className="font-medium">{category.name[displayLanguage] || category.name.en}</div>
                            </div>
                            <div className="space-y-1">
                              <div className="text-sm font-medium sm:hidden">รหัส</div>
                              <div className="text-muted-foreground break-all">{category.slug}</div>
                            </div>
                            <div className="space-y-1">
                              <div className="text-sm font-medium sm:hidden">รายการเมนู</div>
                              <div>{itemCount} รายการ</div>
                            </div>
                            <div className="space-y-1">
                              <div className="text-sm font-medium sm:hidden">การกระทำ</div>
                              <div className="flex flex-wrap gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => openCategoryEditDialog(category)}
                                  className="w-full sm:w-auto"
                                >
                                  <Pencil className="mr-2 h-4 w-4" />
                                  แก้ไข
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-full sm:w-auto text-red-500 hover:text-red-600"
                                  onClick={() => openCategoryDeleteDialog(category)}
                                  disabled={itemCount > 0}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  ลบ
                                </Button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Menu Item Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          {editItem && (
            <form onSubmit={handleEditItem}>
              <DialogHeader>
                <DialogTitle>แก้ไขรายการอาหาร</DialogTitle>
                <DialogDescription>อัปเดตรายละเอียดสำหรับรายการอาหารนี้ในหลายภาษา</DialogDescription>
              </DialogHeader>
              {formError && (
                <Alert variant="destructive" className="my-4">
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}
              <div className="grid gap-4 py-4">
                <Tabs defaultValue="en" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="en">อังกฤษ</TabsTrigger>
                    <TabsTrigger value="lo">ลาว</TabsTrigger>
                    <TabsTrigger value="th">ไทย</TabsTrigger>
                  </TabsList>
                  <TabsContent value="en">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-name-en">ชื่อ (อังกฤษ) *</Label>
                      <Input
                        id="edit-name-en"
                        value={editItem.name.en}
                        onChange={(e) =>
                          setEditItem({
                            ...editItem,
                            name: { ...editItem.name, en: e.target.value },
                          })
                        }
                        required
                      />
                    </div>
                    <div className="grid gap-2 mt-4">
                      <Label htmlFor="edit-description-en">คำอธิบาย (อังกฤษ) *</Label>
                      <Textarea
                        id="edit-description-en"
                        value={editItem.description.en}
                        onChange={(e) =>
                          setEditItem({
                            ...editItem,
                            description: { ...editItem.description, en: e.target.value },
                          })
                        }
                        required
                      />
                    </div>
                  </TabsContent>
                  <TabsContent value="lo">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-name-lo">ชื่อ (ลาว)</Label>
                      <Input
                        id="edit-name-lo"
                        value={editItem.name.lo}
                        onChange={(e) =>
                          setEditItem({
                            ...editItem,
                            name: { ...editItem.name, lo: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-2 mt-4">
                      <Label htmlFor="edit-description-lo">คำอธิบาย (ลาว)</Label>
                      <Textarea
                        id="edit-description-lo"
                        value={editItem.description.lo}
                        onChange={(e) =>
                          setEditItem({
                            ...editItem,
                            description: { ...editItem.description, lo: e.target.value },
                          })
                        }
                      />
                    </div>
                  </TabsContent>
                  <TabsContent value="th">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-name-th">ชื่อ (ไทย)</Label>
                      <Input
                        id="edit-name-th"
                        value={editItem.name.th}
                        onChange={(e) =>
                          setEditItem({
                            ...editItem,
                            name: { ...editItem.name, th: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-2 mt-4">
                      <Label htmlFor="edit-description-th">คำอธิบาย (ไทย)</Label>
                      <Textarea
                        id="edit-description-th"
                        value={editItem.description.th}
                        onChange={(e) =>
                          setEditItem({
                            ...editItem,
                            description: { ...editItem.description, th: e.target.value },
                          })
                        }
                      />
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-price">ราคา ($) *</Label>
                    <Input
                      id="edit-price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={editItem.price}
                      onChange={(e) => setEditItem({ ...editItem, price: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-category">หมวดหมู่ *</Label>
                    <Select
                      value={editItem.category}
                      onValueChange={(value) => setEditItem({ ...editItem, category: value })}
                      required
                    >
                      <SelectTrigger id="edit-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.length === 0 ? (
                          <SelectItem value="" disabled>
                            No categories available
                          </SelectItem>
                        ) : (
                          categories.map((category) => (
                            <SelectItem key={category.id} value={category.slug}>
                              {category.name[displayLanguage] || category.name.en}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-status">สถานะ</Label>
                  <Select
                    value={editItem.status}
                    onValueChange={(value: "enabled" | "disabled") => setEditItem({ ...editItem, status: value })}
                  >
                    <SelectTrigger id="edit-status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="enabled">Enabled</SelectItem>
                      <SelectItem value="disabled">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-image">รูปภาพปัจจุบัน</Label>
                  {editItem.imageUrl && (
                    <div className="mb-2 h-40 w-full overflow-hidden rounded-md">
                      <img
                        src={editItem.imageUrl || "/placeholder.svg"}
                        alt={editItem.name[displayLanguage] || editItem.name.en}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <Label htmlFor="edit-image">อัปโหลดรูปภาพใหม่ (ไม่บังคับ)</Label>
                  <Input
                    id="edit-image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null
                      setEditItem({ ...editItem, image: file })
                    }}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  ยกเลิก
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={isCategoryEditDialogOpen} onOpenChange={setIsCategoryEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          {editCategory && (
            <form onSubmit={handleEditCategory}>
              <DialogHeader>
                <DialogTitle>แก้ไขหมวดหมู่</DialogTitle>
                <DialogDescription>อัปเดตรายละเอียดสำหรับหมวดหมู่นี้ในหลายภาษา</DialogDescription>
              </DialogHeader>
              {formError && (
                <Alert variant="destructive" className="my-4">
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}
              <div className="grid gap-4 py-4">
                <Tabs defaultValue="en" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="en">English</TabsTrigger>
                    <TabsTrigger value="lo">Lao</TabsTrigger>
                    <TabsTrigger value="th">Thai</TabsTrigger>
                  </TabsList>
                  <TabsContent value="en">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-category-name-en">ชื่อ (อังกฤษ) *</Label>
                      <Input
                        id="edit-category-name-en"
                        value={editCategory.name.en}
                        onChange={(e) =>
                          setEditCategory({
                            ...editCategory,
                            name: { ...editCategory.name, en: e.target.value },
                          })
                        }
                        required
                      />
                    </div>
                  </TabsContent>
                  <TabsContent value="lo">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-category-name-lo">ชื่อ (ลาว)</Label>
                      <Input
                        id="edit-category-name-lo"
                        value={editCategory.name.lo}
                        onChange={(e) =>
                          setEditCategory({
                            ...editCategory,
                            name: { ...editCategory.name, lo: e.target.value },
                          })
                        }
                      />
                    </div>
                  </TabsContent>
                  <TabsContent value="th">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-category-name-th">ชื่อ (ไทย)</Label>
                      <Input
                        id="edit-category-name-th"
                        value={editCategory.name.th}
                        onChange={(e) =>
                          setEditCategory({
                            ...editCategory,
                            name: { ...editCategory.name, th: e.target.value },
                          })
                        }
                      />
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="grid gap-2 mt-4">
                  <Label htmlFor="edit-category-slug">Slug *</Label>
                  <Input
                    id="edit-category-slug"
                    value={editCategory.slug}
                    onChange={(e) => setEditCategory({ ...editCategory, slug: e.target.value })}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    คำเตือน: การเปลี่ยน slug จะส่งผลต่อรายการอาหารทั้งหมดในหมวดหมู่นี้
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCategoryEditDialogOpen(false)}>
                  ยกเลิก
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Menu Item Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>คุณแน่ใจหรือไม่?</AlertDialogTitle>
            <AlertDialogDescription>
              การกระทำนี้ไม่สามารถยกเลิกได้ จะลบรายการอาหารนี้ออกจากฐานข้อมูลของคุณอย่างถาวร
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteItem}
              disabled={isSubmitting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isSubmitting ? "กำลังลบ..." : "ลบ"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Category Confirmation Dialog */}
      <AlertDialog open={isCategoryDeleteDialogOpen} onOpenChange={setIsCategoryDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>คุณแน่ใจหรือไม่?</AlertDialogTitle>
            <AlertDialogDescription>
              {categoryToDelete && (
                <>
                  การกระทำนี้ไม่สามารถยกเลิกได้ จะลบหมวดหมู่ "
                  {categoryToDelete.name[displayLanguage] || categoryToDelete.name.en}" ออกจากฐานข้อมูลของคุณอย่างถาวร
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
              disabled={isSubmitting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isSubmitting ? "กำลังลบ..." : "ลบ"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
