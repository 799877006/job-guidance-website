import { NextResponse } from 'next/server';
import { scheduleJobScraping } from '@/lib/scraper/job-scraper';

// 这个API路由会被Vercel Cron Jobs调用
// 配置在vercel.json中：每天凌晨3点执行
export async function GET() {
  try {
    await scheduleJobScraping();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in job scraping cron:', error);
    return NextResponse.json({ success: false, error: 'Failed to scrape jobs' }, { status: 500 });
  }
} 