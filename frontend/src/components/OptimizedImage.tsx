import { useState, useRef, useEffect } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  loading?: 'lazy' | 'eager';
  fallback?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
}

/**
 * Componente de imagem otimizada com:
 * - Lazy loading nativo
 * - Suporte a WebP com fallback
 * - Placeholder enquanto carrega
 * - Erro handling
 */
export default function OptimizedImage({
  src,
  alt,
  className = '',
  width,
  height,
  loading = 'lazy',
  fallback,
  objectFit = 'cover',
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Tenta converter para WebP se possível
  const getWebPSrc = (url: string): string | null => {
    // Se a URL já é WebP, retorna como está
    if (url.toLowerCase().endsWith('.webp')) {
      return url;
    }

    // Se é uma URL externa que não suporta conversão, retorna original
    if (url.startsWith('http://') || url.startsWith('https://')) {
      // Para URLs externas, podemos tentar usar CDN com conversão WebP
      // ou simplesmente retornar a URL original
      return url;
    }

    // Para assets locais, poderia converter, mas por enquanto retorna original
    return url;
  };

  useEffect(() => {
    if (!src) {
      setIsLoading(false);
      setHasError(true);
      return;
    }

    const webpSrc = getWebPSrc(src);
    setImageSrc(webpSrc || src);
    setIsLoading(true);
    setHasError(false);
  }, [src]);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    
    // Tenta fallback se fornecido
    if (fallback && imageSrc !== fallback) {
      setImageSrc(fallback);
      setHasError(false);
      setIsLoading(true);
    }
  };

  const containerStyle: React.CSSProperties = {
    width: width ? `${width}px` : '100%',
    height: height ? `${height}px` : '100%',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
  };

  const imageStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit,
    transition: 'opacity 0.3s ease-in-out',
    opacity: isLoading ? 0 : 1,
  };

  if (hasError && !fallback) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-200 ${className}`}
        style={containerStyle}
      >
        <span className="text-gray-400 text-sm">Imagem não disponível</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={containerStyle}>
      {/* Placeholder enquanto carrega */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 animate-pulse">
          <svg
            className="w-12 h-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      )}

      {/* Imagem otimizada */}
      {imageSrc && (
        <picture>
          {/* Tenta WebP primeiro se não for já WebP */}
          {!imageSrc.toLowerCase().endsWith('.webp') && imageSrc.startsWith('/') && (
            <source srcSet={imageSrc.replace(/\.(jpg|jpeg|png)$/i, '.webp')} type="image/webp" />
          )}
          <img
            ref={imgRef}
            src={imageSrc}
            alt={alt}
            loading={loading}
            width={width}
            height={height}
            style={imageStyle}
            onLoad={handleLoad}
            onError={handleError}
            decoding="async"
            className={className}
          />
        </picture>
      )}
    </div>
  );
}






