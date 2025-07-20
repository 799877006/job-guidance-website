"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Send, MessageSquare, Mail, Phone } from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"

export default function FeedbackPage() {
  const { user, profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [feedback, setFeedback] = useState({
    name: "",
    email: "",
    category: "",
    subject: "",
    message: "",
  })

  // 初始化表单数据，仅在profile首次加载时设置
  useEffect(() => {
    if (profile && !isInitialized) {
      setFeedback((prev) => ({
        ...prev,
        name: profile.full_name || "",
        email: profile.email || "",
      }))
      setIsInitialized(true)
    }
  }, [profile, isInitialized])

  const handleInputChange = (field: string, value: string) => {
    setFeedback((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 调用API发送feedback（包含数据库保存和邮件发送）
      const response = await fetch('/api/send-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id,
          name: feedback.name,
          email: feedback.email,
          category: feedback.category,
          subject: feedback.subject,
          message: feedback.message,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'フィードバックの送信に失敗しました')
      }

      // 显示成功消息
      toast({
        title: "送信完了",
        description: result.message || "フィードバックを送信しました。お返事をお待ちください。",
      })

      // 重置表单
      setFeedback({
        name: profile?.full_name || "",
        email: profile?.email || "",
        category: "",
        subject: "",
        message: "",
      })
      // 不需要重置isInitialized，保持用户信息预填充
    } catch (error) {
      console.error("フィードバック送信エラー:", error)
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "フィードバックの送信に失敗しました",
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
            <div className="flex items-center py-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  戻る
                </Button>
              </Link>
              <h1 className="text-xl font-bold">フィードバック・お問い合わせ</h1>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Information */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2" />
                    お問い合わせ先
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-blue-600" />
                    <div>
                      <div className="font-medium">メール</div>
                      <div className="text-sm text-gray-600">xroffer@gmail.com</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-green-600" />
                    <div>
                      <div className="font-medium">電話</div>
                      <div className="text-sm text-gray-600">03-1234-5678</div>
                      <div className="text-xs text-gray-500">平日 9:00-18:00</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>よくある質問</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div>
                      <div className="font-medium text-gray-900">Q: パスワードを忘れました</div>
                      <div className="text-gray-600">A: ログイン画面の「パスワードを忘れた方」からリセットできます</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Q: 面接予約をキャンセルしたい</div>
                      <div className="text-gray-600">A: スケジュール画面から変更・キャンセルが可能です</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Q: データのエクスポートは可能ですか</div>
                      <div className="text-gray-600">A: 統計画面からCSV形式でエクスポートできます</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Feedback Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Send className="h-5 w-5 mr-2" />
                    フィードバック送信
                  </CardTitle>
                  <CardDescription>ご意見・ご要望・不具合報告などをお聞かせください</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">お名前 *</Label>
                        <Input
                          id="name"
                          required
                          value={feedback.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                          placeholder="田中太郎"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">メールアドレス *</Label>
                        <Input
                          id="email"
                          type="email"
                          required
                          value={feedback.email}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                          placeholder="example@email.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">カテゴリ *</Label>
                      <Select value={feedback.category} onValueChange={(value) => handleInputChange("category", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="選択してください" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bug">不具合報告</SelectItem>
                          <SelectItem value="feature">機能要望</SelectItem>
                          <SelectItem value="improvement">改善提案</SelectItem>
                          <SelectItem value="question">質問</SelectItem>
                          <SelectItem value="other">その他</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">件名 *</Label>
                      <Input
                        id="subject"
                        required
                        value={feedback.subject}
                        onChange={(e) => handleInputChange("subject", e.target.value)}
                        placeholder="お問い合わせの件名を入力してください"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">メッセージ *</Label>
                      <Textarea
                        id="message"
                        required
                        className="min-h-[150px]"
                        value={feedback.message}
                        onChange={(e) => handleInputChange("message", e.target.value)}
                        placeholder="詳細な内容をご記入ください..."
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                      <Send className="h-4 w-4 mr-2" />
                      {loading ? "送信中..." : "送信する"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
