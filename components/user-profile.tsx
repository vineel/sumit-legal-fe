"use client"

import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { User, Mail, Calendar, Shield, Edit, Save, X, Upload, Camera, PenTool, Loader2 } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { getUserProfile, updateUserProfile, uploadSignature, uploadProfilePhoto, type User as UserType } from "@/lib/user"

export function UserProfile() {
  const { user } = useAuth()
  const { toast } = useToast()
  
  // Get token from localStorage
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [userProfile, setUserProfile] = useState<UserType | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
  })
  const profileImageRef = useRef<HTMLInputElement>(null)
  const signatureImageRef = useRef<HTMLInputElement>(null)

  // Load user profile on component mount
  useEffect(() => {
    if (token) {
      loadUserProfile()
    }
  }, [token])

  const loadUserProfile = async () => {
    try {
      setIsLoading(true)
      const response = await getUserProfile(token!)
      console.log('Loaded user profile:', response.user)
      console.log('Signature URL:', response.user.signature?.url)
      setUserProfile(response.user)
      setFormData({
        name: response.user.name || "",
        street: response.user.address?.street || "",
        city: response.user.address?.city || "",
        state: response.user.address?.state || "",
        postalCode: response.user.address?.postalCode || "",
        country: response.user.address?.country || "",
      })
    } catch (error) {
      console.error('Error loading user profile:', error)
      toast({
        title: "Error",
        description: "Failed to load user profile",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageUpload = async (file: File, type: 'profile' | 'signature') => {
    if (!file || !file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select a valid image file.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      
      if (type === 'profile') {
        const response = await uploadProfilePhoto(token!, file)
        setUserProfile(response.user)
        toast({
          title: "Profile Photo Updated",
          description: "Your profile photo has been updated successfully.",
        })
      } else {
        const response = await uploadSignature(token!, file)
        console.log('Signature upload response:', response)
        console.log('Updated user profile:', response.user)
        console.log('New signature URL:', response.user.signature?.url)
        setUserProfile(response.user)
        toast({
          title: "Signature Updated",
          description: "Your signature has been updated successfully.",
        })
      }
    } catch (error: any) {
      console.error(`Error uploading ${type}:`, error)
      toast({
        title: "Upload Failed",
        description: error.message || `Failed to upload ${type} image.`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setIsLoading(true)
      const response = await updateUserProfile(token!, formData)
      setUserProfile(response.user)
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      })
      setIsEditing(false)
    } catch (error: any) {
      console.error('Error updating profile:', error)
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      name: userProfile?.name || "",
      street: userProfile?.address?.street || "",
      city: userProfile?.address?.city || "",
      state: userProfile?.address?.state || "",
      postalCode: userProfile?.address?.postalCode || "",
      country: userProfile?.address?.country || "",
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

  if (isLoading && !userProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading profile...</span>
        </div>
      </div>
    )
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
                      {userProfile?.photo?.url ? (
                        <img 
                          src={userProfile.photo.url} 
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
                        disabled={isLoading}
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
                    <CardTitle className="text-2xl">{userProfile?.name || user?.name}</CardTitle>
                    <CardDescription className="text-base">{userProfile?.email || user?.email}</CardDescription>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={getStatusColor(userProfile?.status || user?.status || "active")}>
                        {userProfile?.status || user?.status || "active"}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {userProfile?.role || user?.role}
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button
                  variant={isEditing ? "outline" : "default"}
                  onClick={() => setIsEditing(!isEditing)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : isEditing ? (
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
                      <span>{userProfile?.name || user?.name}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{userProfile?.email || user?.email}</span>
                    <Badge variant="outline" className="ml-auto text-xs">
                      Read Only
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Email address cannot be changed for security reasons
                  </p>
                </div>
              </div>

              {/* Address Fields */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium">Address Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="street">Street Address</Label>
                    {isEditing ? (
                      <Input
                        id="street"
                        value={formData.street}
                        onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                        placeholder="Enter street address"
                      />
                    ) : (
                      <div className="p-3 border rounded-md bg-muted/50">
                        <span>{userProfile?.address?.street || "Not provided"}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    {isEditing ? (
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="Enter city"
                      />
                    ) : (
                      <div className="p-3 border rounded-md bg-muted/50">
                        <span>{userProfile?.address?.city || "Not provided"}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">State/Province</Label>
                    {isEditing ? (
                      <Input
                        id="state"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        placeholder="Enter state/province"
                      />
                    ) : (
                      <div className="p-3 border rounded-md bg-muted/50">
                        <span>{userProfile?.address?.state || "Not provided"}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal Code</Label>
                    {isEditing ? (
                      <Input
                        id="postalCode"
                        value={formData.postalCode}
                        onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                        placeholder="Enter postal code"
                      />
                    ) : (
                      <div className="p-3 border rounded-md bg-muted/50">
                        <span>{userProfile?.address?.postalCode || "Not provided"}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="country">Country</Label>
                    {isEditing ? (
                      <Input
                        id="country"
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        placeholder="Enter country"
                      />
                    ) : (
                      <div className="p-3 border rounded-md bg-muted/50">
                        <span>{userProfile?.address?.country || "Not provided"}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Signature Upload Section */}
              <div className="space-y-4">
                <Label>Digital Signature</Label>
                <div className="flex items-center gap-4">
                  <div className="w-32 h-16 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center overflow-hidden">
                    {userProfile?.signature?.url ? (
                      <img 
                        src={userProfile.signature.url} 
                        alt="Signature" 
                        className="w-full h-full object-contain"
                        onLoad={() => console.log('Signature image loaded successfully')}
                        onError={(e) => console.error('Signature image failed to load:', e)}
                      />
                    ) : (
                      <div className="text-center text-muted-foreground">
                        <PenTool className="w-6 h-6 mx-auto mb-1" />
                        <p className="text-xs">No signature</p>
                        <p className="text-xs text-red-500">Debug: {userProfile ? 'Profile loaded' : 'No profile'}</p>
                        <p className="text-xs text-red-500">Signature: {userProfile?.signature ? 'Has signature object' : 'No signature object'}</p>
                        <p className="text-xs text-red-500">URL: {userProfile?.signature?.url || 'No URL'}</p>
                        {userProfile?.signature?.url && (
                          <a 
                            href={userProfile.signature.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-blue-500 underline"
                          >
                            Open in new tab
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-2">
                      Upload your digital signature for document signing
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => signatureImageRef.current?.click()}
                        disabled={!isEditing || isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4 mr-2" />
                        )}
                        {userProfile?.signature?.url ? 'Change Signature' : 'Upload Signature'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={loadUserProfile}
                        disabled={isLoading}
                      >
                        <Loader2 className="w-4 h-4 mr-2" />
                        Refresh
                      </Button>
                    </div>
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
                    <Badge className={getStatusColor(userProfile?.status || user?.status || "active")}>
                      {userProfile?.status || user?.status || "active"}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>User Role</Label>
                  <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    <Badge variant="outline" className="capitalize">
                      {userProfile?.role || user?.role}
                    </Badge>
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {isLoading ? 'Saving...' : 'Save Changes'}
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
