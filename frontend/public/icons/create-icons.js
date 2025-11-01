// Script para criar ícones PWA básicos
// Execute este script no navegador para gerar os ícones

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

sizes.forEach(size => {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  
  const ctx = canvas.getContext('2d');
  
  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#3b82f6');
  gradient.addColorStop(1, '#1e40af');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  
  // Boat icon
  ctx.fillStyle = 'white';
  ctx.beginPath();
  
  // Boat hull
  ctx.moveTo(size * 0.2, size * 0.7);
  ctx.quadraticCurveTo(size * 0.5, size * 0.5, size * 0.8, size * 0.7);
  ctx.lineTo(size * 0.75, size * 0.85);
  ctx.quadraticCurveTo(size * 0.5, size * 0.75, size * 0.25, size * 0.85);
  ctx.closePath();
  ctx.fill();
  
  // Mast
  ctx.fillRect(size * 0.48, size * 0.3, size * 0.04, size * 0.55);
  
  // Sail
  ctx.beginPath();
  ctx.moveTo(size * 0.5, size * 0.35);
  ctx.lineTo(size * 0.7, size * 0.35);
  ctx.lineTo(size * 0.5, size * 0.65);
  ctx.closePath();
  ctx.fill();
  
  // Download
  const link = document.createElement('a');
  link.download = `icon-${size}x${size}.png`;
  link.href = canvas.toDataURL();
  link.click();
});

