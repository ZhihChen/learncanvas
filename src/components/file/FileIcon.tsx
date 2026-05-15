'use client';

/**
 * 文件图标组件
 * 根据文件类型显示对应的图标
 */

import { memo } from 'react';
import { 
  FileText, 
  Image, 
  FileSpreadsheet, 
  Presentation, 
  File,
} from 'lucide-react';
import type { AttachmentType } from '@/types';

interface FileIconProps {
  type: AttachmentType;
  className?: string;
  size?: number;
}

function FileIconComponent({ type, className = '', size = 24 }: FileIconProps) {
  const iconProps = {
    className,
    size,
    strokeWidth: 1.5,
  };
  
  switch (type) {
    case 'pdf':
      return (
        <div 
          className={className}
          style={{ width: size, height: size }}
        >
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path 
              d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" 
              stroke="currentColor" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
            <path d="M14 2V8H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M10 12H8V15H10C10.5 15 11 14.5 11 14V13C11 12.5 10.5 12 10 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 15V18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M13 12V15C13 15.5 13.5 16 14 16H15C15.5 16 16 15.5 16 15V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      );
      
    case 'markdown':
      return (
        <div 
          className={className}
          style={{ width: size, height: size }}
        >
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path 
              d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" 
              stroke="currentColor" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
            <path d="M14 2V8H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 15V12L10 14L12 12V15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16 12V15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M14 13.5H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
      );
      
    case 'image':
      return <Image {...iconProps} />;
      
    case 'word':
      return (
        <div 
          className={className}
          style={{ width: size, height: size }}
        >
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path 
              d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" 
              stroke="currentColor" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
            <path d="M14 2V8H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 13L10 17L12 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 13L14 17L16 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      );
      
    case 'excel':
      return <FileSpreadsheet {...iconProps} />;
      
    case 'powerpoint':
      return <Presentation {...iconProps} />;
      
    default:
      return <File {...iconProps} />;
  }
}

export const FileIcon = memo(FileIconComponent);
