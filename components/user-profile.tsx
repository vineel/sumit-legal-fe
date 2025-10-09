"use client"

import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { User, Mail, Calendar, Shield, Edit, Save, X, Upload, Camera, PenTool, Loader2, Home, ArrowLeft, Eye } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { getUserProfile, updateUserProfile, uploadSignature, uploadProfilePhoto, getUserStatistics, type User as UserType, type UserStatistics } from "@/lib/user"

export function UserProfile() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  
  // Get token from localStorage
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [userProfile, setUserProfile] = useState<UserType | null>(null)
  const [statistics, setStatistics] = useState<UserStatistics | null>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(false)
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

  // Helper function to validate file types
  const validateFileType = (file: File): boolean => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg']
    return allowedTypes.includes(file.type)
  }

  // Load user profile on component mount
  useEffect(() => {
    if (token) {
      loadUserProfile()
      loadUserStatistics()
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

  const loadUserStatistics = async () => {
    try {
      setIsLoadingStats(true)
      const response = await getUserStatistics(token!)
      console.log('Loaded user statistics:', response.statistics)
      setStatistics(response.statistics)
    } catch (error) {
      console.error('Error loading user statistics:', error)
      toast({
        title: "Error",
        description: "Failed to load account statistics",
        variant: "destructive",
      })
    } finally {
      setIsLoadingStats(false)
    }
  }

  const handleImageUpload = async (file: File, type: 'profile' | 'signature') => {
    // Validate file type - only PNG and JPG allowed
    if (!file || !validateFileType(file)) {
      toast({
        title: "Invalid File Type",
        description: "Please select a PNG or JPG image file only.",
        variant: "destructive",
      })
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select a file smaller than 10MB.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      console.log(`Uploading ${type} file:`, {
        name: file.name,
        size: file.size,
        type: file.type
      })
      
      if (type === 'profile') {
        const response = await uploadProfilePhoto(token!, file)
        console.log('Profile photo upload response:', response)
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
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      })
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
      console.log('Saving profile data:', formData)
      const response = await updateUserProfile(token!, formData)
      console.log('Profile update response:', response)
      setUserProfile(response.user)
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      })
      setIsEditing(false)
    } catch (error: any) {
      console.error('Error updating profile:', error)
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      })
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
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-xl font-heading font-semibold">IBD Contracting Platform</h1>
              </div>
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
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")} className="h-auto p-0 text-muted-foreground hover:text-foreground">
              <Home className="w-4 h-4 mr-1" />
              Dashboard
            </Button>
            <span>/</span>
            <span className="text-foreground">Profile</span>
          </div>
          {/* Profile Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden border-2 border-primary/20 shadow-sm">
                      {userProfile?.photo?.url ? (
                        <img 
                          src={userProfile.photo.url} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-10 h-10 text-primary" />
                      )}
                    </div>
                    {isEditing && (
                      <Button
                        size="sm"
                        className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full p-0 shadow-md hover:shadow-lg transition-shadow"
                        onClick={() => profileImageRef.current?.click()}
                        disabled={isLoading}
                      >
                        <Camera className="w-4 h-4" />
                      </Button>
                    )}
                    <input
                      ref={profileImageRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
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
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Information
              </CardTitle>
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
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-medium">Address Information</h4>
                  <Badge variant="outline" className="text-xs">
                    Optional
                  </Badge>
                </div>
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
                        <span className={userProfile?.address?.street ? "text-foreground" : "text-muted-foreground"}>
                          {userProfile?.address?.street || "Not provided"}
                        </span>
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
                        <span className={userProfile?.address?.city ? "text-foreground" : "text-muted-foreground"}>
                          {userProfile?.address?.city || "Not provided"}
                        </span>
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
                        <span className={userProfile?.address?.state ? "text-foreground" : "text-muted-foreground"}>
                          {userProfile?.address?.state || "Not provided"}
                        </span>
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
                        <span className={userProfile?.address?.postalCode ? "text-foreground" : "text-muted-foreground"}>
                          {userProfile?.address?.postalCode || "Not provided"}
                        </span>
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
                        <span className={userProfile?.address?.country ? "text-foreground" : "text-muted-foreground"}>
                          {userProfile?.address?.country || "Not provided"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Signature Upload Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Digital Signature</Label>
                  {userProfile?.signature?.url && (
                    <Badge variant="secondary" className="text-xs">
                      <PenTool className="w-3 h-3 mr-1" />
                      Uploaded
                    </Badge>
                  )}
                </div>
                
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 bg-muted/30">
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    {/* Signature Preview */}
                    <div className="w-40 h-20 border border-muted-foreground/20 rounded-lg flex items-center justify-center overflow-hidden bg-white shadow-sm">
                      {userProfile?.signature?.url ? (
                        <img 
                          src={userProfile.signature.url} 
                          alt="Signature" 
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="text-center text-muted-foreground">
                          <PenTool className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm font-medium">No signature</p>
                          <p className="text-xs text-muted-foreground">Upload to add one</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Upload Controls */}
                    <div className="flex-1 space-y-3">
                      <div>
                        <h4 className="font-medium text-sm mb-1">Upload Digital Signature</h4>
                        <p className="text-sm text-muted-foreground">
                          Upload your signature for document signing. Only PNG and JPG files are allowed.
                        </p>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          variant={userProfile?.signature?.url ? "default" : "outline"}
                          size="sm"
                          onClick={() => signatureImageRef.current?.click()}
                          disabled={!isEditing || isLoading}
                          className="flex-1"
                        >
                          {isLoading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4 mr-2" />
                          )}
                          {userProfile?.signature?.url ? 'Change Signature' : 'Upload Signature'}
                        </Button>
                        
                        {userProfile?.signature?.url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(userProfile.signature?.url, '_blank')}
                            className="flex-1"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                        )}
                      </div>
                      
                      {!isEditing && (
                        <p className="text-xs text-muted-foreground">
                          Click "Edit Profile" to upload or change your signature
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <input
                    ref={signatureImageRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleImageUpload(file, 'signature')
                    }}
                  />
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
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Account Statistics
              </CardTitle>
              <CardDescription>
                Overview of your account activity and usage
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-muted-foreground">Loading statistics...</span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-6 border rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 hover:shadow-md transition-shadow">
                    <div className="text-3xl font-bold text-primary mb-2">
                      {statistics?.agreementsCreated ?? 0}
                    </div>
                    <div className="text-sm font-medium text-muted-foreground">Agreements Created</div>
                  </div>
                  <div className="text-center p-6 border rounded-lg bg-gradient-to-br from-green-50 to-green-100 hover:shadow-md transition-shadow">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {statistics?.agreementsSigned ?? 0}
                    </div>
                    <div className="text-sm font-medium text-muted-foreground">Agreements Signed</div>
                  </div>
                  <div className="text-center p-6 border rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-md transition-shadow">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {statistics?.templatesUsed ?? 0}
                    </div>
                    <div className="text-sm font-medium text-muted-foreground">Templates Used</div>
                  </div>
                </div>
              )}
              
              {/* Additional Statistics */}
              {statistics && !isLoadingStats && (
                <div className="mt-6 pt-6 border-t">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded-lg bg-gradient-to-br from-orange-50 to-orange-100">
                      <div className="text-2xl font-bold text-orange-600 mb-1">
                        {statistics.totalAgreementsParticipated}
                      </div>
                      <div className="text-xs font-medium text-muted-foreground">Total Participated</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg bg-gradient-to-br from-yellow-50 to-yellow-100">
                      <div className="text-2xl font-bold text-yellow-600 mb-1">
                        {statistics.pendingAgreements}
                      </div>
                      <div className="text-xs font-medium text-muted-foreground">Pending</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg bg-gradient-to-br from-purple-50 to-purple-100">
                      <div className="text-2xl font-bold text-purple-600 mb-1">
                        {statistics.completedAgreements}
                      </div>
                      <div className="text-xs font-medium text-muted-foreground">Completed</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
