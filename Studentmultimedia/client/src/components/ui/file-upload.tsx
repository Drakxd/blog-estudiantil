import { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, File as FileIcon, Image as ImageIcon, Video, FileText } from 'lucide-react';

interface FileUploadProps {
  onUpload: (file: File) => void;
  accept?: string;
  maxSize?: number; // in MB
  className?: string;
  buttonText?: string;
  allowedTypes?: string[];
}

export function FileUpload({
  onUpload,
  accept = "image/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  maxSize = 10, // 10MB default
  className,
  buttonText = "Subir archivo",
  allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/svg+xml',
    'video/mp4', 'video/webm', 
    'application/pdf', 'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const validateFile = (file: File): boolean => {
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Tipo de archivo no permitido",
        description: "Por favor, sube un archivo de tipo permitido",
        variant: "destructive",
      });
      return false;
    }

    if (file.size > maxSize * 1024 * 1024) {
      toast({
        title: "Archivo demasiado grande",
        description: `El tamaño máximo permitido es de ${maxSize}MB`,
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (validateFile(file)) {
        setSelectedFile(file);
        onUpload(file);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      
      if (validateFile(file)) {
        setSelectedFile(file);
        onUpload(file);
      }
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileTypeIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="h-8 w-8 text-blue-500" />;
    } else if (file.type.startsWith('video/')) {
      return <Video className="h-8 w-8 text-red-500" />;
    } else if (
      file.type === 'application/pdf' || 
      file.type === 'application/msword' || 
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      return <FileText className="h-8 w-8 text-amber-500" />;
    } else {
      return <FileIcon className="h-8 w-8 text-gray-500" />;
    }
  };

  return (
    <div className={cn('w-full', className)}>
      <div
        className={cn(
          'flex items-center justify-center w-full rounded-md border-2 border-dashed p-6 transition-colors',
          isDragOver ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400',
          selectedFile ? 'bg-gray-50' : 'bg-white'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {selectedFile ? (
          <div className="flex items-center gap-3">
            {getFileTypeIcon(selectedFile)}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{selectedFile.name}</p>
              <p className="text-xs text-gray-500">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={clearSelectedFile}
              type="button"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="space-y-2 text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="text-sm text-gray-600">
              <label
                htmlFor="file-upload"
                className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary/90 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary"
              >
                <span>{buttonText}</span>
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  className="sr-only"
                  accept={accept}
                  onChange={handleFileSelect}
                  ref={fileInputRef}
                />
              </label>
              <p className="pl-1 inline">o arrastra y suelta</p>
            </div>
            <p className="text-xs text-gray-500">
              {allowedTypes.includes('image/jpeg') && 'PNG, JPG, GIF, SVG, '}
              {allowedTypes.includes('video/mp4') && 'MP4, WebM, '}
              {allowedTypes.includes('application/pdf') && 'PDF, Word '}
              hasta {maxSize}MB
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
