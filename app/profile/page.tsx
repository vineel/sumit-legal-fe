"use client"

import { useEffect, useState } from "react"
import { getMe } from "@/lib/auth"
import { updateUser, type UpdateUserPayload } from "@/lib/user"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

interface UserProfileFormState {
  name: string
  email: string
  status?: string
  street?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
  photo?: File | null
  signature?: File | null
  photoUrl?: string // for preview
  signatureUrl?: string // for preview
}

export default function ProfilePage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState<boolean>(true)
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [form, setForm] = useState<UserProfileFormState>({
    name: "",
    email: "",
    status: "",
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    photo: null,
    signature: null,
    photoUrl: "",
    signatureUrl: "",
  })

  useEffect(() => {
    let isMounted = true
    ;(async () => {
      try {
        const me = await getMe()
        if (!isMounted) return
        setForm((prev) => ({
          ...prev,
          name: me.name ?? "",
          email: me.email ?? "",
          status: me.status ?? "",
          street: me.address?.street ?? "",
          city: me.address?.city ?? "",
          state: me.address?.state ?? "",
          postalCode: me.address?.postalCode ?? "",
          country: me.address?.country ?? "",
          photoUrl: me.photo?.url ?? "",
          signatureUrl: me.signature?.url ?? "",
        }))
      } catch (error: any) {
        toast({
          title: "Failed to load profile",
          description: error?.message ?? "Please try again",
          variant: "destructive",
        })
      } finally {
        if (isMounted) setLoading(false)
      }
    })()
    return () => {
      isMounted = false
    }
  }, [toast])

  function handleChange<K extends keyof UserProfileFormState>(key: K, value: UserProfileFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    try {
      const payload: UpdateUserPayload = {
        name: form.name?.trim() || undefined,
        status: form.status?.trim() || undefined,
        street: form.street?.trim() || undefined,
        city: form.city?.trim() || undefined,
        state: form.state?.trim() || undefined,
        postalCode: form.postalCode?.trim() || undefined,
        country: form.country?.trim() || undefined,
        photo: form.photo ?? undefined,
        signature: form.signature ?? undefined,
      }
      const res = await updateUser(payload)
      toast({ title: "Profile updated", description: res?.message ?? "Your profile has been saved." })
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error?.message ?? "Please try again",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto w-full p-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>View and update your profile. Email cannot be changed.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={form.email} disabled readOnly />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Input
                  id="status"
                  value={form.status ?? ""}
                  readOnly
                  className="bg-gray-100 text-gray-600 cursor-default"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="street">Street</Label>
                <Input
                  id="street"
                  value={form.street ?? ""}
                  onChange={(e) => handleChange("street", e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={form.city ?? ""}
                  onChange={(e) => handleChange("city", e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={form.state ?? ""}
                  onChange={(e) => handleChange("state", e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input
                  id="postalCode"
                  value={form.postalCode ?? ""}
                  onChange={(e) => handleChange("postalCode", e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={form.country ?? ""}
                  onChange={(e) => handleChange("country", e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="photo">Photo</Label>
                {form.photoUrl && (
                  <img src={form.photoUrl} alt="Current Photo" className="h-20 w-20 object-cover rounded mb-2" />
                )}
                <Input
                  id="photo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleChange("photo", e.target.files?.[0] ?? null)}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signature">Signature</Label>
                {form.signatureUrl && (
                  <img
                    src={form.signatureUrl}
                    alt="Current Signature"
                    className="h-20 w-20 object-contain border rounded mb-2"
                  />
                )}
                <Input
                  id="signature"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleChange("signature", e.target.files?.[0] ?? null)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="submit" disabled={loading || submitting}>
                {submitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
