import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DriveUploadResult {
  success: boolean;
  uploaded: number;
  results: {
    attachmentId: string;
    driveFileId: string;
    driveLink: string;
  }[];
}

export const useDriveUpload = () => {
  return useMutation({
    mutationFn: async ({ 
      attachmentIds, 
      taskNumber 
    }: { 
      attachmentIds: string[]; 
      taskNumber?: number | null;
    }): Promise<DriveUploadResult> => {
      if (attachmentIds.length === 0) {
        return { success: true, uploaded: 0, results: [] };
      }

      console.log(`Uploading ${attachmentIds.length} attachments to Drive for task ${taskNumber}`);

      const { data, error } = await supabase.functions.invoke('upload-to-drive', {
        body: { attachmentIds, taskNumber }
      });

      if (error) {
        console.error('Drive upload error:', error);
        throw new Error(error.message || 'Falha ao enviar para o Drive');
      }

      return data as DriveUploadResult;
    },
    onSuccess: (data) => {
      if (data.uploaded > 0) {
        toast.success(`${data.uploaded} foto(s) enviada(s) para o Google Drive`);
      }
    },
    onError: (error: Error) => {
      console.error('Drive upload failed:', error);
      toast.error(`Erro ao enviar para o Drive: ${error.message}`);
    }
  });
};
