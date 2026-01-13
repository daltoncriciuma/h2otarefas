import { useState, useRef } from 'react';
import { Camera, X, Upload, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTaskAttachments, useUploadTaskAttachment, useDeleteTaskAttachment } from '@/hooks/useTaskAttachments';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';

interface TaskAttachmentsProps {
  taskId: string;
  attachmentType?: 'general' | 'completion';
  readOnly?: boolean;
  title?: string;
}

export function TaskAttachments({ 
  taskId, 
  attachmentType = 'general',
  readOnly = false,
  title = 'Fotos'
}: TaskAttachmentsProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  const { data: attachments, isLoading } = useTaskAttachments(taskId);
  const uploadAttachment = useUploadTaskAttachment();
  const deleteAttachment = useDeleteTaskAttachment();

  const filteredAttachments = attachments?.filter(a => a.attachment_type === attachmentType) || [];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) {
        continue;
      }
      
      await uploadAttachment.mutateAsync({
        taskId,
        file,
        attachmentType,
        userId: user?.id,
      });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string, filePath: string) => {
    await deleteAttachment.mutateAsync({ id, filePath, taskId });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Camera className="h-4 w-4" />
          {title}
        </h4>
        {!readOnly && (
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
            Adicionar foto
          </Button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredAttachments.length === 0 ? (
        <div className="border-2 border-dashed rounded-lg p-6 text-center text-muted-foreground">
          <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Nenhuma foto anexada</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {filteredAttachments.map((attachment) => (
            <div
              key={attachment.id}
              className="relative group aspect-square rounded-lg overflow-hidden border bg-muted"
            >
              <Dialog>
                <DialogTrigger asChild>
                  <img
                    src={attachment.file_path}
                    alt={attachment.file_name}
                    className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setPreviewImage(attachment.file_path)}
                  />
                </DialogTrigger>
                <DialogContent className="max-w-4xl p-0 overflow-hidden">
                  <img
                    src={attachment.file_path}
                    alt={attachment.file_name}
                    className="w-full h-auto max-h-[80vh] object-contain"
                  />
                </DialogContent>
              </Dialog>
              
              {!readOnly && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDelete(attachment.id, attachment.file_path)}
                  disabled={deleteAttachment.isPending}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
