const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const app = express();
const port = process.env.PORT || 3000;

// Serve static files from the public directory
app.use(express.static('public'));

// API endpoint to get media files
app.get('/api/images', async (req, res) => {
  try {
    const mediaDir = path.join(__dirname, 'public', 'media');
    
    // Ensure the media directory exists
    await fs.mkdir(mediaDir, { recursive: true });
    
    // Read all files from the media directory
    const files = await fs.readdir(mediaDir);
    
    // Filter for supported media files
    const mediaFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.webm', '.mov'].includes(ext);
    });

    // Get file information
    const mediaData = await Promise.all(
      mediaFiles.map(async (file) => {
        const filePath = path.join(mediaDir, file);
        const stats = await fs.stat(filePath);
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

    res.json(mediaData);
  } catch (error) {
    console.error('Error reading media directory:', error);
    res.status(500).json({ error: 'Failed to read media directory' });
  }
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}); 