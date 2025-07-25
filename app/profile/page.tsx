"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Upload, Save, User, Mail, Calendar, FileText, X } from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/components/auth-provider"
import { updateProfile } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: "",
    age: "",
    university: "",
    major: "",
    graduation_year: "",
    bio: "",
  })

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        age: profile.age?.toString() || "",
        university: profile.university || "",
        major: profile.major || "",
        graduation_year: profile.graduation_year?.toString() || "",
        bio: profile.bio || "",
      })
    }
  }, [profile])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await updateProfile(user!.id, {
        full_name: formData.full_name,
        age: formData.age ? Number.parseInt(formData.age) : undefined,
        university: formData.university,
        major: formData.major,
        graduation_year: formData.graduation_year ? Number.parseInt(formData.graduation_year) : undefined,
        bio: formData.bio,
      })

      await refreshProfile()
      toast({
        title: "更新完了",
        description: "プロフィールを更新しました",
      })
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "エラー",
        description: "プロフィールの更新に失敗しました",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("You must select an image to upload.")
      }

      const file = event.target.files[0]
      const fileExt = file.name.split(".").pop()
      const fileName = `${user!.id}-${Math.random()}.${fileExt}`

      // 直接上传到 avatars 存储桶
      const { error: uploadError } = await supabase.storage.from("avatars").upload(fileName, file)

      if (uploadError) {
        throw uploadError
      }

      // 获取公共URL
      const { data } = supabase.storage.from("avatars").getPublicUrl(fileName)

      await updateProfile(user!.id, {
        avatar_url: data.publicUrl,
      })

      await refreshProfile()
      toast({
        title: "アップロード完了",
        description: "プロフィール写真を更新しました",
      })
    } catch (error) {
      console.error("Error uploading avatar:", error)
      toast({
        title: "エラー",
        description: "画像のアップロードに失敗しました",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleResumeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("You must select a file to upload.")
      }

      const file = event.target.files[0]
      const fileExt = file.name.split(".").pop()
      const fileName = `${user!.id}-${Math.random()}.${fileExt}`

      console.log("Attempting to upload resume:", fileName)

      // 直接上传到 resumes 存储桶
      const { error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error("Upload error:", uploadError)
        throw uploadError
      }

      // 获取URL（简历不需要公开访问）
      const { data } = supabase.storage
        .from("resumes")
        .getPublicUrl(fileName)

      await updateProfile(user!.id, {
        resume_url: data.publicUrl,
      })

      await refreshProfile()
      toast({
        title: "アップロード完了",
        description: "履歴書をアップロードしました",
      })
    } catch (error: any) {
      console.error("Error uploading resume:", error)
      // 如果是存储错误，显示具体错误信息
      const errorMessage = error.message && error.message.includes("storage")
        ? error.message
        : "ファイルのアップロードに失敗しました"
      
      toast({
        title: "エラー",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleResumeDelete = async () => {
    try {
      setLoading(true)
      
      if (!profile?.resume_url) return
      
      // 从URL中提取文件名
      const urlParts = profile.resume_url.split('/')
      const fileName = urlParts[urlParts.length - 1]
      
      if (!fileName) {
        throw new Error("Invalid file URL")
      }

      console.log("Attempting to delete resume:", fileName)

      // 从存储中删除文件
      const { error: deleteError } = await supabase.storage
        .from("resumes")
        .remove([fileName])

      if (deleteError) {
        console.error("Delete error:", deleteError)
        throw deleteError
      }

      // 更新用户资料，清除简历URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ resume_url: null })
        .eq('id', user!.id)

      if (updateError) {
        console.error("Update error:", updateError)
        throw updateError
      }

      await refreshProfile()
      toast({
        title: "削除完了",
        description: "履歴書を削除しました",
      })
    } catch (error: any) {
      console.error("Error deleting resume:", error)
      // 如果是存储错误，显示具体错误信息
      const errorMessage = error.message && error.message.includes("storage")
        ? error.message
        : "履歴書の削除に失敗しました"
      
      toast({
        title: "エラー",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center">
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm" className="mr-4">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    戻る
                  </Button>
                </Link>
                <h1 className="text-xl font-bold">プロフィール</h1>
              </div>
              <Button onClick={handleSubmit} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? "保存中..." : "保存"}
              </Button>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Picture */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    プロフィール写真
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <Avatar className="w-32 h-32 mx-auto mb-4">
                    <AvatarImage src={profile?.avatar_url || "/placeholder.svg?height=128&width=128"} />
                    <AvatarFallback className="text-2xl">{profile?.full_name?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      disabled={uploading}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Button variant="outline" className="w-full bg-transparent" disabled={uploading}>
                      <Upload className="h-4 w-4 mr-2" />
                      {uploading ? "アップロード中..." : "写真をアップロード"}
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">JPG、PNG形式のファイルをアップロードできます</p>
                </CardContent>
              </Card>
            </div>

            {/* Profile Information */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    基本情報
                  </CardTitle>
                  <CardDescription>個人情報を入力してください</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">氏名</Label>
                        <Input
                          id="name"
                          value={formData.full_name}
                          onChange={(e) => handleInputChange("full_name", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="age">年齢</Label>
                        <Input
                          id="age"
                          type="number"
                          value={formData.age}
                          onChange={(e) => handleInputChange("age", e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="flex items-center">
                        <Mail className="h-4 w-4 mr-2" />
                        メールアドレス
                      </Label>
                      <Input id="email" type="email" value={profile?.email || ""} disabled className="bg-gray-100" />
                      <p className="text-sm text-gray-500">メールアドレスは変更できません</p>
                    </div>

                    {profile?.role === "student" && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="university">大学名</Label>
                            <Input
                              id="university"
                              value={formData.university}
                              onChange={(e) => handleInputChange("university", e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="major">専攻</Label>
                            <Input
                              id="major"
                              value={formData.major}
                              onChange={(e) => handleInputChange("major", e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="graduationYear" className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            卒業予定年
                          </Label>
                          <Input
                            id="graduationYear"
                            type="number"
                            value={formData.graduation_year}
                            onChange={(e) => handleInputChange("graduation_year", e.target.value)}
                          />
                        </div>
                      </>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="bio">自己紹介</Label>
                      <Textarea
                        id="bio"
                        className="min-h-[120px]"
                        value={formData.bio}
                        onChange={(e) => handleInputChange("bio", e.target.value)}
                        placeholder="自己紹介を入力してください..."
                      />
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Resume Section */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                履歴書・エントリーシート
              </CardTitle>
              <CardDescription>履歴書やエントリーシートをアップロードして管理できます</CardDescription>
            </CardHeader>
            <CardContent>
              {profile?.resume_url ? (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <FileText className="h-8 w-8 text-blue-600" />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 hover:bg-red-600 p-0"
                        onClick={handleResumeDelete}
                        disabled={loading}
                      >
                        <X className="h-3 w-3 text-white" />
                      </Button>
                    </div>
                    <div>
                      <div className="font-medium">履歴書がアップロード済み</div>
                      <div className="text-sm text-gray-600">ファイルを表示または新しいファイルをアップロード</div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" asChild>
                      <a href={profile.resume_url} target="_blank" rel="noopener noreferrer">
                        表示
                      </a>
                    </Button>
                    <div className="relative">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleResumeUpload}
                        disabled={uploading}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Button variant="outline" disabled={uploading}>
                        <Upload className="h-4 w-4 mr-2" />
                        更新
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">履歴書をドラッグ&ドロップするか、クリックしてファイルを選択</p>
                  <div className="relative inline-block">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleResumeUpload}
                      disabled={uploading}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Button variant="outline" disabled={uploading}>
                      <Upload className="h-4 w-4 mr-2" />
                      {uploading ? "アップロード中..." : "ファイルを選択"}
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    PDFのファイルをアップロードできます（最大1500KB）
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}
