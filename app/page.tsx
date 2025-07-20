import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Users, BarChart3, MessageSquare, User, Briefcase, Star, ArrowRight } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Briefcase className="h-8 w-8 text-green-600 mr-2" />
              <h1 className="text-2xl font-bold text-gray-900">向日offer</h1>
            </div>
            <div className="flex space-x-4">
              <Link href="/login">
                <Button variant="outline">ログイン</Button>
              </Link>
              <Link href="/register">
                <Button>新規登録</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            あなたの就職活動を
            <span className="text-green-600">全面サポート</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            面接スケジュール管理から選考状況の統計まで、就職活動に必要な全ての機能を一つのプラットフォームで。
            学生と指導者が連携して、理想の就職を実現しましょう。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="text-lg px-8 py-3">
                今すぐ始める
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-lg px-8 py-3 bg-transparent">
                ログイン
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-4">主な機能</h3>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            就職活動を効率的に進めるための包括的なツールセット
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Calendar className="h-10 w-10 text-blue-600 mb-2" />
                <CardTitle>スケジュール管理</CardTitle>
                <CardDescription>面接予約と進行中の面接を効率的に管理。リマインダー機能付き。</CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <BarChart3 className="h-10 w-10 text-green-600 mb-2" />
                <CardTitle>選考状況統計</CardTitle>
                <CardDescription>応募・落選・合格状況を視覚的に把握。進捗を一目で確認。</CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Users className="h-10 w-10 text-purple-600 mb-2" />
                <CardTitle>学生・教師連携</CardTitle>
                <CardDescription>役割に応じた専用ダッシュボードで効果的な指導を実現。</CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <User className="h-10 w-10 text-orange-600 mb-2" />
                <CardTitle>プロフィール管理</CardTitle>
                <CardDescription>履歴書・写真アップロード機能付きの包括的なプロフィール。</CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <MessageSquare className="h-10 w-10 text-red-600 mb-2" />
                <CardTitle>フィードバック</CardTitle>
                <CardDescription>メール通知付きのお問い合わせ・要望受付システム。</CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Briefcase className="h-10 w-10 text-green-600 mb-2" />
                <CardTitle>求人広告</CardTitle>
                <CardDescription>企業からの最新求人情報を効率的に閲覧・管理。</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">利用者の声</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <CardDescription className="text-base">
                  「面接スケジュールの管理が本当に楽になりました。統計機能で自分の進捗も把握しやすく、就活が効率的に進められています。」
                </CardDescription>
                <div className="mt-4">
                  <p className="font-semibold">田中 太郎</p>
                  <p className="text-sm text-gray-600">東京大学 4年生</p>
                </div>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <CardDescription className="text-base">
                  「学生の進捗を一元管理できるので、指導がとても効率的になりました。個別のサポートもしやすくなっています。」
                </CardDescription>
                <div className="mt-4">
                  <p className="font-semibold">佐藤 花子</p>
                  <p className="text-sm text-gray-600">キャリアカウンセラー</p>
                </div>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <CardDescription className="text-base">
                  「UIが直感的で使いやすく、就活に必要な機能が全て揃っています。おかげで第一志望の企業から内定をいただけました！」
                </CardDescription>
                <div className="mt-4">
                  <p className="font-semibold">山田 次郎</p>
                  <p className="text-sm text-gray-600">早稲田大学 4年生</p>
                </div>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-green-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-white mb-4">今すぐ就職活動を始めましょう</h3>
          <p className="text-xl text-green-100 mb-8">無料でアカウントを作成して、効率的な就職活動をスタート</p>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
              無料で始める
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Briefcase className="h-6 w-6 mr-2" />
                <span className="text-lg font-semibold">向日offer</span>
              </div>
              <p className="text-gray-400">学生の就職活動を成功に導く総合プラットフォーム</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">サービス</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/features" className="hover:text-white">
                    機能一覧
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-white">
                    料金プラン
                  </Link>
                </li>
                <li>
                  <Link href="/support" className="hover:text-white">
                    サポート
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">企業向け</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/corporate" className="hover:text-white">
                    法人サービス
                  </Link>
                </li>
                <li>
                  <Link href="/advertising" className="hover:text-white">
                    広告掲載
                  </Link>
                </li>
                <li>
                  <Link href="/partnership" className="hover:text-white">
                    パートナーシップ
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">お問い合わせ</h4>
              <p className="text-gray-400">
                Email: xroffer@gmail.com
                <br />
                Tel: 03-1234-5678
                <br />
                平日 9:00-18:00
              </p>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 向日offer. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
