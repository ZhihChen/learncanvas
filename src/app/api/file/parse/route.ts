/**
 * 文件解析 API
 * 提取文件文本内容用于AI对话
 * 支持本地 base64 文件和 S3 存储的文件
 */

import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// 初始化 S3 客户端
const createS3Client = () => {
  const endpoint = process.env.S3_ENDPOINT;
  const region = process.env.S3_REGION || 'cn-beijing';
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  
  if (!endpoint || !accessKeyId || !secretAccessKey) {
    return null;
  }
  
  return new S3Client({
    endpoint,
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: true,
  });
};

// 简单的文本提取函数
async function extractTextContent(buffer: Buffer, mimeType: string): Promise<string> {
  // 文本文件直接返回内容
  if (mimeType.startsWith('text/')) {
    return buffer.toString('utf-8');
  }
  
  // JSON 文件
  if (mimeType === 'application/json') {
    try {
      const json = JSON.parse(buffer.toString('utf-8'));
      return JSON.stringify(json, null, 2);
    } catch {
      return buffer.toString('utf-8');
    }
  }
  
  // CSV 文件
  if (mimeType === 'text/csv') {
    const content = buffer.toString('utf-8');
    // 简单处理：返回 CSV 原文
    return `CSV 文件内容：\n${content}`;
  }
  
  // PDF 文件 - 简单提取（实际项目建议使用专业 PDF 解析库）
  if (mimeType === 'application/pdf') {
    // 尝试提取可读文本
    const text = buffer.toString('latin1');
    const readableText = text.replace(/[^\x20-\x7E\n]/g, ' ').replace(/\s+/g, ' ');
    return `PDF 文件（无法直接解析，请上传纯文本或 Markdown 文件以获得更好的解析效果）\n\n文件大小：${buffer.length} 字节`;
  }
  
  // Office 文件 - 返回提示信息
  if (mimeType.includes('wordprocessingml') || 
      mimeType.includes('spreadsheetml') ||
      mimeType.includes('presentationml')) {
    return `${mimeType.includes('word') ? 'Word' : mimeType.includes('spreadsheet') ? 'Excel' : 'PowerPoint'} 文件（建议另存为 PDF 或纯文本格式以便 AI 更好地理解内容）\n\n文件大小：${buffer.length} 字节`;
  }
  
  // 其他格式
  return `文件类型 ${mimeType}，内容无法直接解析\n\n文件大小：${buffer.length} 字节`;
}

export async function POST(request: NextRequest) {
  try {
    const { fileUrl, storageKey, fileName } = await request.json();
    
    if (!fileUrl && !storageKey) {
      return NextResponse.json(
        { error: '未提供文件URL或存储Key' },
        { status: 400 }
      );
    }
    
    let buffer: Buffer;
    let mimeType = 'application/octet-stream';
    
    // 情况1：本地 base64 数据 URL
    if (fileUrl && fileUrl.startsWith('data:')) {
      const match = fileUrl.match(/data:([^;]+);base64,(.+)/);
      if (match) {
        mimeType = match[1];
        buffer = Buffer.from(match[2], 'base64');
      } else {
        return NextResponse.json({ error: '无效的 base64 数据' }, { status: 400 });
      }
    }
    // 情况2：S3 存储的文件
    else if (storageKey) {
      const s3Client = createS3Client();
      const bucketName = process.env.S3_BUCKET_NAME;
      
      if (!s3Client || !bucketName) {
        return NextResponse.json(
          { error: 'S3 未配置，无法解析存储的文件' },
          { status: 500 }
        );
      }
      
      try {
        const response = await s3Client.send(
          new GetObjectCommand({
            Bucket: bucketName,
            Key: storageKey,
          })
        );
        
        // 获取内容类型
        mimeType = response.ContentType || 'application/octet-stream';
        
        // 读取内容
        const chunks: Uint8Array[] = [];
        if (response.Body) {
          const stream = response.Body as AsyncIterable<Uint8Array>;
          for await (const chunk of stream) {
            chunks.push(chunk);
          }
        }
        buffer = Buffer.concat(chunks);
      } catch (s3Error) {
        console.error('S3 get object error:', s3Error);
        return NextResponse.json(
          { error: '无法从存储中获取文件' },
          { status: 500 }
        );
      }
    }
    // 情况3：远程 URL
    else if (fileUrl) {
      try {
        const response = await fetch(fileUrl);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        mimeType = response.headers.get('content-type') || 'application/octet-stream';
        const arrayBuffer = await response.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
      } catch (fetchError) {
        console.error('Fetch file error:', fetchError);
        return NextResponse.json(
          { error: '无法获取远程文件' },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { error: '无法确定文件来源' },
        { status: 400 }
      );
    }
    
    // 提取文本内容
    const textContent = await extractTextContent(buffer, mimeType);
    
    // 返回解析结果
    return NextResponse.json({
      success: true,
      title: fileName || '未命名文件',
      textContent: textContent,
      images: [], // 图片提取需要额外处理
      metadata: {
        fileType: mimeType,
        fileSize: buffer.length,
      },
    });
    
  } catch (error) {
    console.error('[File Parse API] Error:', error);
    
    return NextResponse.json(
      { error: '文件解析失败' },
      { status: 500 }
    );
  }
}
