"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import { supabase } from "@/lib/supabase"
import { ArrowLeft, User, Building, GraduationCap, Mail, Phone } from "lucide-react"
import Link from "next/link"

export default function InstructorProfilePage() {
  const { user, profile } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    university: "",
    department: "",
    position: "",
    specialization: "",
    bio: "",
    avatar_url: ""
  })

  useEffect(() => {
    if (profile?.role !== 'instructor') {
      router.push('/dashboard')
      return
    }

    if (user && profile) {
      setFormData({
        full_name: profile.full_name || "",
        email: user.email || "",
        phone: profile.phone || "",
        university: profile.university || "",
        department: profile.department || "",
        position: profile.position || "",
        specialization: profile.specialization || "",
        bio: profile.bio || "",
        avatar_url: profile.avatar_url || ""
      })
    }
  }, [user, profile, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          university: formData.university,
          department: formData.department,
          position: formData.position,
          specialization: formData.specialization,
          bio: formData.bio,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      toast({
        title: "プロフィールを更新しました",
        description: "変更が保存されました",
      })
    } catch (error: any) {
      toast({
        title: "エラー",
        description: "プロフィールの更新に失敗しました",
        variant: "destructive",
      })
    }
    setLoading(false)
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files || !e.target.files[0]) return

    const file = e.target.files[0]
    const fileExt = file.name.split('.').pop()
    const filePath = `${user.id}/avatar.${fileExt}`

    setLoading(true)
    try {
      // アップロード
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      // 公開URLを取得
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // プロフィール更新
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)

      if (updateError) throw updateError

      setFormData(prev => ({ ...prev, avatar_url: publicUrl }))
      toast({
        title: "アバターを更新しました",
        description: "新しいプロフィール画像が保存されました",
      })
    } catch (error: any) {
      toast({
        title: "エラー",
        description: "画像のアップロードに失敗しました",
        variant: "destructive",
      })
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center">
              <Link href="/instructor-dashboard">
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  戻る
                </Button>
              </Link>
              <h1 className="text-xl font-bold">プロフィール設定</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* プロフィール画像 */}
          <Card>
            <CardHeader>
              <CardTitle>プロフィール画像</CardTitle>
              <CardDescription>あなたのプロフィール画像を設定します</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={formData.avatar_url || undefined} />
                <AvatarFallback>
                  <User className="h-12 w-12" />
                </AvatarFallback>
              </Avatar>
              <div>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  disabled={loading}
                />
                <p className="text-sm text-muted-foreground mt-2">
                  推奨: 500x500px以上のJPEG、PNG画像
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 基本情報 */}
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>基本情報</CardTitle>
                <CardDescription>プロフィール情報を編集します</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">氏名</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                      placeholder="山田 太郎"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">メールアドレス</Label>
                    <Input
                      id="email"
                      value={formData.email}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">電話番号</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="090-1234-5678"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="university">所属大学</Label>
                    <Input
                      id="university"
                      value={formData.university}
                      onChange={(e) => setFormData(prev => ({ ...prev, university: e.target.value }))}
                      placeholder="○○大学"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department">学部・研究科</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                      placeholder="○○学部"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="position">職位</Label>
                    <Input
                      id="position"
                      value={formData.position}
                      onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                      placeholder="教授・准教授など"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specialization">専門分野</Label>
                  <Input
                    id="specialization"
                    value={formData.specialization}
                    onChange={(e) => setFormData(prev => ({ ...prev, specialization: e.target.value }))}
                    placeholder="情報工学・人工知能など"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">自己紹介</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="経歴や研究内容、指導方針などを記入してください"
                    rows={5}
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={loading}>
                    {loading ? "更新中..." : "保存"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </div>
      </div>
    </div>
  )
} 