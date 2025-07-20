import { type NextRequest, NextResponse } from "next/server"
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

// 初始化Resend邮件服务客户端
const resend = new Resend(process.env.RESEND_API_KEY)

// 初始化Supabase服务端客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // 1. 验证环境变量
    console.log('🔍 检查环境变量...')
    const envVars = {
      RESEND_API_KEY: !!process.env.RESEND_API_KEY,
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    }
    console.log('环境变量状态:', envVars)
    
    if (!process.env.RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY 未设置')
      return NextResponse.json(
        { error: "邮件服务未配置，请联系管理员" }, 
        { status: 500 }
      )
    }

    // 2. 解析请求数据
    console.log('📥 解析请求数据...')
    const { userId, name, email, category, subject, message } = await request.json()
    console.log('请求数据:', { userId, name, email, category, subject, messageLength: message?.length })

    // 3. 验证必填字段
    if (!name || !email || !category || !subject || !message) {
      console.log('❌ 必填字段验证失败')
      return NextResponse.json(
        { error: "すべての必須フィールドを入力してください" }, 
        { status: 400 }
      )
    }

    // 4. 保存feedback到Supabase数据库
    console.log('💾 保存到数据库...')
    const { data: feedbackData, error: dbError } = await supabase
      .from('feedback')
      .insert([
        {
          user_id: userId || null,
          name,
          email,
          category,
          subject,
          message,
          status: 'pending'
        }
      ])
      .select()
      .single()

    if (dbError) {
      console.error("❌ 数据库保存错误:", dbError)
      return NextResponse.json(
        { error: "データの保存に失敗しました" }, 
        { status: 500 }
      )
    }
    
    console.log('✅ 数据库保存成功, ID:', feedbackData.id)

    // 5. 发送邮件给管理员 (xroffer@gmail.com)
    console.log('📧 准备发送邮件...')
    try {
      // 分类标签转换
      const categoryLabels: Record<string, string> = {
        'bug': '不具合報告',
        'feature': '機能要望',
        'improvement': '改善提案',
        'question': '質問',
        'other': 'その他'
      }
      const categoryLabel = categoryLabels[category] || category
      console.log('📝 邮件内容准备完成, 分类:', categoryLabel)

      // 邮件文本内容
      const emailText = `
就職指導ウェブサイトから新しいフィードバックが届きました

送信者: ${name}
メールアドレス: ${email}
カテゴリ: ${categoryLabel}
件名: ${subject}

メッセージ内容:
${message}

---
フィードバックID: ${feedbackData.id}
送信日時: ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}
      `.trim()

      // HTML邮件模板
      const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>新しいフィードバック</title>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif; 
      line-height: 1.6; 
      margin: 0; 
      padding: 20px; 
      background-color: #f5f5f5; 
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      background: white; 
      border-radius: 8px; 
      overflow: hidden; 
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header { 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
      color: white; 
      padding: 30px 20px; 
      text-align: center; 
    }
    .header h1 { 
      margin: 0; 
      font-size: 24px; 
      font-weight: 600; 
    }
    .content { 
      padding: 30px 20px; 
    }
    .field { 
      margin-bottom: 20px; 
      border-bottom: 1px solid #eee; 
      padding-bottom: 15px; 
    }
    .field:last-child { 
      border-bottom: none; 
      margin-bottom: 0; 
    }
    .label { 
      font-weight: 600; 
      color: #333; 
      display: block; 
      margin-bottom: 8px; 
      font-size: 14px; 
      text-transform: uppercase; 
      letter-spacing: 0.5px; 
    }
    .value { 
      color: #666; 
      font-size: 16px; 
    }
    .message-content { 
      background: #f8f9fa; 
      padding: 20px; 
      border-radius: 6px; 
      border-left: 4px solid #667eea; 
      white-space: pre-wrap; 
      word-wrap: break-word; 
    }
    .footer { 
      background: #f8f9fa; 
      padding: 20px; 
      text-align: center; 
      font-size: 12px; 
      color: #666; 
    }
    .badge {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📬 新しいフィードバック</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">就職指導ウェブサイトより</p>
    </div>
    
    <div class="content">
      <div class="field">
        <span class="label">送信者</span>
        <div class="value">${name}</div>
      </div>
      
      <div class="field">
        <span class="label">メールアドレス</span>
        <div class="value"><a href="mailto:${email}" style="color: #667eea; text-decoration: none;">${email}</a></div>
      </div>
      
      <div class="field">
        <span class="label">カテゴリ</span>
        <div class="value">
          <span class="badge">${categoryLabel}</span>
        </div>
      </div>
      
      <div class="field">
        <span class="label">件名</span>
        <div class="value" style="font-weight: 500; font-size: 18px; color: #333;">${subject}</div>
      </div>
      
      <div class="field">
        <span class="label">メッセージ内容</span>
        <div class="message-content">${message}</div>
      </div>
    </div>
    
    <div class="footer">
      <p style="margin: 0;">
        フィードバックID: <strong>${feedbackData.id}</strong><br>
        受信日時: ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}
      </p>
    </div>
  </div>
</body>
</html>
      `.trim()

      // 发送邮件到管理员邮箱
      console.log('🚀 开始发送邮件到 xroffer@gmail.com...')
      const emailResult = await resend.emails.send({
        from: 'Job Guidance System <noreply@resend.dev>', // 使用Resend的测试发送地址
        to: ['xroffer@gmail.com'], // 你的管理员邮箱
        replyTo: email, // 设置回复地址为用户邮箱
        subject: `[就職指導] ${subject}`,
        text: emailText,
        html: emailHtml
      })

      console.log('✅ 邮件发送成功:', emailResult)

      // 更新数据库状态为已发送
      console.log('🔄 更新数据库状态...')
      await supabase
        .from('feedback')
        .update({ status: 'sent' })
        .eq('id', feedbackData.id)

      console.log(`✅ 完整流程成功: ${feedbackData.id}`)

    } catch (emailError) {
      console.error("❌ 邮件发送失败:", emailError)
      if (emailError instanceof Error) {
        console.error("错误详细信息:", {
          message: emailError.message,
          stack: emailError.stack,
          name: emailError.name
        })
      }
      
      // 更新数据库状态为邮件发送失败
      try {
        await supabase
          .from('feedback')
          .update({ status: 'email_failed' })
          .eq('id', feedbackData.id)
        console.log('📝 已更新数据库状态为 email_failed')
      } catch (updateError) {
        console.error("❌ 更新数据库状态失败:", updateError)
      }
      
      // 即使邮件发送失败，也返回成功（因为数据已保存）
      // 但在日志中记录错误
    }

    return NextResponse.json({ 
      success: true, 
      message: "フィードバックを送信しました。ありがとうございます。",
      feedbackId: feedbackData.id 
    })

  } catch (error) {
    console.error("フィードバック処理エラー:", error)
    return NextResponse.json(
      { error: "フィードバックの送信に失敗しました。しばらく後でもう一度お試しください。" }, 
      { status: 500 }
    )
  }
}
