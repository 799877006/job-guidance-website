import axios from 'axios';
import * as cheerio from 'cheerio';
import { supabase } from '../supabase';

interface JobListing {
  title: string;
  company_name: string;
  location: string;
  salary_range?: string;
  description: string;
  requirements?: string;
  benefits?: string[];
  employment_type?: string;
  source_url: string;
  source_site: string;
  image_url?: string;
  posted_at?: string;
}

// Indeed Japan爬虫
async function scrapeIndeed(keyword: string, location: string = '東京都'): Promise<JobListing[]> {
  try {
    const url = `https://jp.indeed.com/jobs?q=${encodeURIComponent(keyword)}&l=${encodeURIComponent(location)}`;
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const jobs: JobListing[] = [];

    $('.job_seen_beacon').each((_, element) => {
      const title = $(element).find('.jobTitle').text().trim();
      const company = $(element).find('.company_location .companyName').text().trim();
      const location = $(element).find('.company_location .companyLocation').text().trim();
      const salary = $(element).find('.salary-snippet').text().trim();
      const description = $(element).find('.job-snippet').text().trim();
      const link = 'https://jp.indeed.com' + $(element).find('a').attr('href');

      if (title && company) {
        jobs.push({
          title,
          company_name: company,
          location,
          salary_range: salary || undefined,
          description,
          source_url: link,
          source_site: 'Indeed'
        });
      }
    });

    return jobs;
  } catch (error) {
    console.error('Error scraping Indeed:', error);
    return [];
  }
}

// マイナビ爬虫
async function scrapeMyNavi(keyword: string): Promise<JobListing[]> {
  try {
    const url = `https://tenshoku.mynavi.jp/list/${encodeURIComponent(keyword)}`;
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const jobs: JobListing[] = [];

    $('.cassetteRecruit').each((_, element) => {
      const title = $(element).find('.cassetteRecruit__name').text().trim();
      const company = $(element).find('.cassetteRecruit__company').text().trim();
      const description = $(element).find('.cassetteRecruit__description').text().trim();
      const link = $(element).find('.cassetteRecruit__copy a').attr('href');
      const image = $(element).find('.cassetteRecruit__thumbnail img').attr('src');

      if (title && company) {
        jobs.push({
          title,
          company_name: company,
          description,
          source_url: link || '',
          source_site: 'マイナビ転職',
          image_url: image
        });
      }
    });

    return jobs;
  } catch (error) {
    console.error('Error scraping MyNavi:', error);
    return [];
  }
}

// Wantedly爬虫
async function scrapeWantedly(keyword: string): Promise<JobListing[]> {
  try {
    const url = `https://www.wantedly.com/projects?type=mixed&page=1&q=${encodeURIComponent(keyword)}`;
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const jobs: JobListing[] = [];

    $('.projects-index-single').each((_, element) => {
      const title = $(element).find('.project-title').text().trim();
      const company = $(element).find('.project-company-name').text().trim();
      const description = $(element).find('.project-excerpt').text().trim();
      const link = 'https://www.wantedly.com' + $(element).find('a').attr('href');
      const image = $(element).find('.project-eyecatch img').attr('src');

      if (title && company) {
        jobs.push({
          title,
          company_name: company,
          description,
          source_url: link,
          source_site: 'Wantedly',
          image_url: image
        });
      }
    });

    return jobs;
  } catch (error) {
    console.error('Error scraping Wantedly:', error);
    return [];
  }
}

// 保存到数据库
async function saveJobListings(jobs: JobListing[]) {
  for (const job of jobs) {
    const { error } = await supabase
      .from('advertisements')
      .insert([{
        title: job.title,
        company_name: job.company_name,
        description: job.description,
        image_url: job.image_url,
        link_url: job.source_url,
        source: job.source_site,
        is_active: true,
        salary_range: job.salary_range,
        location: job.location,
        employment_type: job.employment_type,
        requirements: job.requirements,
        benefits: job.benefits,
        posted_at: job.posted_at || new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Error saving job listing:', error);
    }
  }
}

// 主函数：抓取所有来源的数据
export async function scrapeAllJobSites(keywords: string[]) {
  const allJobs: JobListing[] = [];

  for (const keyword of keywords) {
    // Indeed
    const indeedJobs = await scrapeIndeed(keyword);
    allJobs.push(...indeedJobs);

    // マイナビ
    const mynaviJobs = await scrapeMyNavi(keyword);
    allJobs.push(...mynaviJobs);

    // Wantedly
    const wantedlyJobs = await scrapeWantedly(keyword);
    allJobs.push(...wantedlyJobs);
  }

  // 保存到数据库
  await saveJobListings(allJobs);

  return allJobs;
}

// 定期执行爬虫的函数
export async function scheduleJobScraping() {
  const keywords = [
    'フロントエンドエンジニア',
    'バックエンドエンジニア',
    'フルスタックエンジニア',
    'データエンジニア',
    'DevOps エンジニア',
    'UI/UXデザイナー'
  ];

  try {
    const jobs = await scrapeAllJobSites(keywords);
    console.log(`Successfully scraped ${jobs.length} jobs`);
  } catch (error) {
    console.error('Error in job scraping schedule:', error);
  }
} 