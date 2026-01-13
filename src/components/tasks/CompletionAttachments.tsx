import { useState, useRef } from 'react';
import { Camera, X, Upload, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUploadTaskAttachment, useDeleteTaskAttachment } from '@/hooks/useTaskAttachments';
import { useAuth } from '@/contexts/AuthContext';

interface CompletionAttachmentsProps {
  taskId: string;
  onAttachmentsChange?: (attachmentIds: string[]) => void;
}

interface UploadedFile {
  id: string;
  file_path: string;
  file_name: string;
}

export function CompletionAttachments({ taskId, onAttachmentsChange }: CompletionAttachmentsProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  
  const uploadAttachment = useUploadTaskAttachment();
  const deleteAttachment = useDeleteTaskAttachment();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) {
        continue;
      }
      
      const result = await uploadAttachment.mutateAsync({
        taskId,
        file,
        attachmentType: 'completion',
        userId: user?.id,
      });

      if (result) {
        const newFile = {
          id: result.id,
          file_path: result.file_path,
          file_name: result.file_name,
        };
        setUploadedFiles(prev => {
          const updated = [...prev, newFile];
          onAttachmentsChange?.(updated.map(f => f.id));
          return updated;
        });
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (file: UploadedFile) => {
    await deleteAttachment.mutateAsync({ id: file.id, filePath: file.file_path, taskId });
    setUploadedFiles(prev => {
      const updated = prev.filter(f => f.id !== file.id);
      onAttachmentsChange?.(updated.map(f => f.id));
      return updated;
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium flex items-center gap-2">
          <Camera className="h-4 w-4" />
          Fotos da Conclusão
        </label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadAttachment.isPending}
        >
          {uploadAttachment.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Upload className="h-4 w-4 mr-2" />
          )}
          Adicionar
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {uploadedFiles.length === 0 ? (
        <div 
          className="border-2 border-dashed rounded-lg p-4 text-center text-muted-foreground cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <ImageIcon className="h-6 w-6 mx-auto mb-1 opacity-50" />
          <p className="text-xs">Clique para adicionar fotos</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {uploadedFiles.map((file) => (
            <div
              key={file.id}
              className="relative group aspect-square rounded-lg overflow-hidden border bg-muted"
            >
              <img
                src={file.file_path}
                alt={file.file_name}
                className="w-full h-full object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleDelete(file)}
                disabled={deleteAttachment.isPending}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
