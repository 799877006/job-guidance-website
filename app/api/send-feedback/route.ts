import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { name, email, category, subject, message } = await request.json()

    // Here you would typically send an email using a service like:
    // - Resend
    // - SendGrid
    // - Nodemailer with SMTP

    // For demonstration, we'll just log the feedback
    console.log("Feedback received:", {
      name,
      email,
      category,
      subject,
      message,
      timestamp: new Date().toISOString(),
    })

    // In a real implementation, you would send an email like this:
    /*
    const emailContent = `
      New feedback received:
      
      Name: ${name}
      Email: ${email}
      Category: ${category}
      Subject: ${subject}
      
      Message:
      ${message}
    `
    
    await sendEmail({
      to: 'support@job-guidance.com',
      subject: `[Feedback] ${subject}`,
      text: emailContent,
    })
    */

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error processing feedback:", error)
    return NextResponse.json({ error: "Failed to process feedback" }, { status: 500 })
  }
}
