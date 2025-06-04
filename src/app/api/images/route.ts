import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { promises as fsPromises } from 'fs';

const MEDIA_DIR = path.join(process.cwd(), 'public', 'media');

export async function GET() {
  try {
    // Ensure the media directory exists
    await fsPromises.mkdir(MEDIA_DIR, { recursive: true });

    // Read all files from the media directory
    const files = await fsPromises.readdir(MEDIA_DIR);
    
    // Filter for supported media files
    const mediaFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.webm', '.mov'].includes(ext);
    });

    // Get file information
    const mediaData = await Promise.all(
      mediaFiles.map(async (file) => {
        const filePath = path.join(MEDIA_DIR, file);
        const stats = await fsPromises.stat(filePath);
        const ext = path.extname(file).toLowerCase();
        
        return {
          src: `/media/${file}`,
          type: ['.mp4', '.webm', '.mov'].includes(ext) ? 'video' : 'image',
          alt: path.parse(file).name,
          size: stats.size,
          lastModified: stats.mtime.toISOString(),
          width: 0, // These will be updated for images
          height: 0, // These will be updated for images
        };
      })
    );

    return NextResponse.json(mediaData);
  } catch (error) {
    console.error('Error reading media directory:', error);
    return NextResponse.json({ error: 'Failed to read media directory' }, { status: 500 });
  }
} 