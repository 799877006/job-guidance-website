"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Briefcase, Eye, EyeOff } from "lucide-react"
import { signIn } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const { user, session } = await signIn(email, password)
      
      if (!user || !session) {
        throw new Error("ログインに失敗しました：ユーザー情報が不完全です。")
      }
      
      // 手动设置会话，确保后续请求使用新的token
      await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      })

      // 获取用户角色
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()


      if (profileError) {
        console.error("获取用户角色失败:", profileError)
        throw new Error("ログイン失敗：ユーザー情報の取得中にエラーが発生しました。")
      }

      if (!profile) {
        throw new Error("ログイン失敗：ユーザー役割情報を取得できませんでした。")
      }

      toast({
        title: "ログイン成功",
        description: "ダッシュボードにリダイレクトしています...",
      })

      const redirectPath = profile.role === 'instructor' ? '/instructor-dashboard' : '/dashboard'
      router.push(redirectPath)

    } catch (err: any) {
      setError(err.message || "ログインに失敗しました")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Briefcase className="h-8 w-8 text-green-600 mr-2" />
            <span className="text-2xl font-bold">向日offer</span>
          </div>
          <CardTitle>ログイン</CardTitle>
          <CardDescription>アカウントにログインしてください</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4" variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "ログイン中..." : "ログイン"}
            </Button>
          </form>

          <div className="text-center text-sm mt-4">
            <span className="text-gray-600">アカウントをお持ちでない方は </span>
            <Link href="/register" className="text-green-600 hover:underline">
              新規登録
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
