/**
 * 文件上传 API
 * 支持多种文件格式上传到对象存储（S3兼容）
 * 使用 AWS SDK for S3
 */

import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// 初始化 S3 客户端
const createS3Client = () => {
  const endpoint = process.env.S3_ENDPOINT;
  const region = process.env.S3_REGION || 'cn-beijing';
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  
  // 如果没有配置 S3，返回 null
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
    forcePathStyle: true, // 必需，用于兼容某些 S3 兼容存储
  });
};

// 支持的文件类型
const SUPPORTED_MIME_TYPES: Record<string, string> = {
  // 图片
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/gif': 'image',
  'image/webp': 'image',
  'image/svg+xml': 'image',
  
  // PDF
  'application/pdf': 'pdf',
  
  // Word
  'application/msword': 'word',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'word',
  
  // Excel
  'application/vnd.ms-excel': 'excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'excel',
  
  // PowerPoint
  'application/vnd.ms-powerpoint': 'powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'powerpoint',
  
  // Markdown
  'text/markdown': 'markdown',
  'text/x-markdown': 'markdown',
  
  // 文本
  'text/plain': 'file',
  'text/csv': 'file',
  
  // 其他
  'application/json': 'file',
  'application/xml': 'file',
};

// 文件大小限制（50MB）
const MAX_FILE_SIZE = 50 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: '未提供文件' },
        { status: 400 }
      );
    }
    
    // 检查文件大小
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: '文件大小超过限制（最大50MB）' },
        { status: 400 }
      );
    }
    
    // 检查文件类型
    const mimeType = file.type || 'application/octet-stream';
    const attachmentType = SUPPORTED_MIME_TYPES[mimeType] || 'file';
    
    // 读取文件内容
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // 生成文件名
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `uploads/${timestamp}_${sanitizedName}`;
    
    // 初始化 S3 客户端
    const s3Client = createS3Client();
    const bucketName = process.env.S3_BUCKET_NAME;
    
    if (!s3Client || !bucketName) {
      // 如果没有配置 S3，返回本地数据URL作为后备（仅用于开发）
      const base64 = buffer.toString('base64');
      const dataUrl = `data:${mimeType};base64,${base64}`;
      
      return NextResponse.json({
        id: `file_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        type: attachmentType,
        mimeType: mimeType,
        size: file.size,
        storageKey: null,
        url: dataUrl, // 临时使用 base64 URL
        status: 'ready',
        warning: 'S3 未配置，使用本地存储（仅开发模式）'
      });
    }
    
    // 上传到 S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: fileName,
        Body: buffer,
        ContentType: mimeType,
      })
    );
    
    // 生成预览 URL（有效期7天）
    // 直接构建 URL 格式（兼容 S3 兼容存储）
    const previewUrl = `${process.env.S3_ENDPOINT}/${bucketName}/${fileName}`;
    
    // 返回文件信息
    const response = {
      id: `file_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      type: attachmentType,
      mimeType: mimeType,
      size: file.size,
      storageKey: fileName,
      url: previewUrl,
      status: 'ready',
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('[File Upload API] Error:', error);
    
    return NextResponse.json(
      { error: '文件上传失败' },
      { status: 500 }
    );
  }
}
