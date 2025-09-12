"use client"

import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { User, Mail, Calendar, Shield, Edit, Save, X, Upload, Camera, PenTool } from "lucide-react"
import { useState, useRef } from "react"
import { useToast } from "@/hooks/use-toast"

export function UserProfile() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
  })
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [signatureImage, setSignatureImage] = useState<string | null>(null)
  const profileImageRef = useRef<HTMLInputElement>(null)
  const signatureImageRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = (file: File, type: 'profile' | 'signature') => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        if (type === 'profile') {
          setProfileImage(result)
        } else {
          setSignatureImage(result)
        }
        toast({
          title: "Image Uploaded",
          description: `${type === 'profile' ? 'Profile' : 'Signature'} image uploaded successfully.`,
        })
      }
      reader.readAsDataURL(file)
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a valid image file.",
        variant: "destructive",
      })
    }
  }

  const handleSave = () => {
    // Here you would typically call an API to update the user profile
    toast({
      title: "Profile Updated",
      description: "Your profile has been updated successfully.",
    })
    setIsEditing(false)
  }

  const handleCancel = () => {
    setFormData({
      name: user?.name || "",
      email: user?.email || "",
    })
    setIsEditing(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "inactive":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-heading font-semibold">Legal Collaboration Platform</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Profile</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Profile Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden">
                      {profileImage ? (
                        <img 
                          src={profileImage} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-8 h-8 text-primary" />
                      )}
                    </div>
                    {isEditing && (
                      <Button
                        size="sm"
                        className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full p-0"
                        onClick={() => profileImageRef.current?.click()}
                      >
                        <Camera className="w-3 h-3" />
                      </Button>
                    )}
                    <input
                      ref={profileImageRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleImageUpload(file, 'profile')
                      }}
                    />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">{user?.name}</CardTitle>
                    <CardDescription className="text-base">{user?.email}</CardDescription>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={getStatusColor(user?.status || "active")}>
                        {user?.status || "active"}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {user?.role}
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button
                  variant={isEditing ? "outline" : "default"}
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? (
                    <>
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Manage your personal information and account settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  {isEditing ? (
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span>{user?.name}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  {isEditing ? (
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span>{user?.email}</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Signature Upload Section */}
              <div className="space-y-4">
                <Label>Digital Signature</Label>
                <div className="flex items-center gap-4">
                  <div className="w-32 h-16 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center overflow-hidden">
                    {signatureImage ? (
                      <img 
                        src={signatureImage} 
                        alt="Signature" 
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="text-center text-muted-foreground">
                        <PenTool className="w-6 h-6 mx-auto mb-1" />
                        <p className="text-xs">No signature</p>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-2">
                      Upload your digital signature for document signing
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => signatureImageRef.current?.click()}
                      disabled={!isEditing}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {signatureImage ? 'Change Signature' : 'Upload Signature'}
                    </Button>
                    <input
                      ref={signatureImageRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleImageUpload(file, 'signature')
                      }}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Account Status</Label>
                  <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    <Badge className={getStatusColor(user?.status || "active")}>
                      {user?.status || "active"}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>User Role</Label>
                  <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    <Badge variant="outline" className="capitalize">
                      {user?.role}
                    </Badge>
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Account Statistics</CardTitle>
              <CardDescription>
                Overview of your account activity and usage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">0</div>
                  <div className="text-sm text-muted-foreground">Agreements Created</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">0</div>
                  <div className="text-sm text-muted-foreground">Agreements Signed</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">0</div>
                  <div className="text-sm text-muted-foreground">Templates Used</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
