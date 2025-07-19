"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Briefcase, Eye, EyeOff } from "lucide-react"
import { signUp } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    role: "" as "student" | "instructor" | "",
    university: "",
    major: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { toast } = useToast()

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("开始提交注册表单");
    setLoading(true)
    setError("")

    if (formData.password !== formData.confirmPassword) {
      setError("パスワードが一致しません")
      setLoading(false)
      return
    }

    if (!agreed) {
      setError("利用規約に同意してください")
      setLoading(false)
      return
    }

    try {
      console.log("登録処理開始");
      const result = await signUp(formData.email, formData.password, {
        full_name: formData.fullName,
        role: formData.role || "student",
        university: formData.university,
        major: formData.major,
      });
      
      console.log("登録成功:", result);
      setLoading(false)
      
      toast({
        title: "アカウント作成成功",
        description: "確認メールをお送りしました。メールを確認してアカウントを有効化してください。",
      })
      
      console.log("ログインページに移動");
      router.push("/login")
    } catch (err: any) {
      console.error("登録エラー:", err);
      
      // 重复邮箱的特殊处理
      if (err.message.includes('このメールアドレスは既に登録されています')) {
        setError("このメールアドレスは既に登録されています。ログインページからサインインしてください。")
        // 3秒后自动跳转到登录页面
        setTimeout(() => {
          router.push("/login")
        }, 3000)
      } else {
        setError(err.message || "アカウント作成に失敗しました。再度お試しください。")
      }
      
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Briefcase className="h-8 w-8 text-blue-600 mr-2" />
            <span className="text-2xl font-bold">就職塾</span>
          </div>
          <CardTitle>新規登録</CardTitle>
          <CardDescription>アカウントを作成してください</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4" variant="destructive">
              <AlertDescription>
                {error}
                {error.includes('このメールアドレスは既に登録されています') && (
                  <div className="mt-2">
                    <Link href="/login" className="text-blue-600 hover:underline font-medium">
                      今すぐログインする →
                    </Link>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role">ユーザータイプ *</Label>
              <Select value={formData.role} onValueChange={(value) => handleInputChange("role", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="選択してください" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">学生</SelectItem>
                  <SelectItem value="instructor">指導者</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">氏名 *</Label>
              <Input
                id="fullName"
                placeholder="田中太郎"
                value={formData.fullName}
                onChange={(e) => handleInputChange("fullName", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス *</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                required
              />
            </div>

            {formData.role === "student" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="university">大学名</Label>
                  <Input
                    id="university"
                    placeholder="東京大学"
                    value={formData.university}
                    onChange={(e) => handleInputChange("university", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="major">専攻</Label>
                  <Input
                    id="major"
                    placeholder="情報工学"
                    value={formData.major}
                    onChange={(e) => handleInputChange("major", e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">パスワード *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
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

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">パスワード確認 *</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="terms" checked={agreed} onCheckedChange={(checked) => setAgreed(checked as boolean)} />
              <Label htmlFor="terms" className="text-sm">
                <Link href="/terms" className="text-blue-600 hover:underline">
                  利用規約
                </Link>
                と
                <Link href="/privacy" className="text-blue-600 hover:underline">
                  プライバシーポリシー
                </Link>
                に同意します
              </Label>
            </div>

            <Button type="submit" className="w-full" disabled={loading || !agreed}>
              {loading ? "作成中..." : "アカウント作成"}
            </Button>
          </form>

          <div className="text-center text-sm mt-4">
            <span className="text-gray-600">既にアカウントをお持ちの方は </span>
            <Link href="/login" className="text-blue-600 hover:underline">
              ログイン
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
