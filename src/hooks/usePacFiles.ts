import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { generateCleanFileName, generatePacFileUrl } from '@/utils/pacFileUtils';

export interface PacFile {
  id: string;
  name: string;
  type: 'default' | 'uploaded';
  dateCreated: string;
  dateModified: string;
  status: 'active' | 'inactive';
  isActive: boolean;
  url: string;
}

const DEFAULT_PAC: PacFile = {
  id: 'default',
  name: 'default.pac',
  type: 'default',
  dateCreated: '-',
  dateModified: '-',
  status: 'active',
  isActive: true,
  url: generatePacFileUrl('default.pac'),
};

export const usePacFiles = () => {
  const [pacFiles, setPacFiles] = useState<PacFile[]>([DEFAULT_PAC]);
  const { toast } = useToast();

  const handleUpload = (file: File) => {
    const cleanFileName = generateCleanFileName(file.name);
    const today = new Date().toLocaleDateString();
    const newPacFile: PacFile = {
      id: Date.now().toString(),
      name: cleanFileName,
      type: 'uploaded',
      dateCreated: today,
      dateModified: today,
      status: 'inactive',
      isActive: false,
      url: generatePacFileUrl(cleanFileName),
    };
    setPacFiles(prev => [...prev, newPacFile]);
    toast({
      title: 'PAC file uploaded',
      description: cleanFileName + ' was added. It is currently inactive — activate it when ready.',
    });
  };

  const handleUpdate = (id: string, file: File) => {
    const target = pacFiles.find(f => f.id === id);
    if (target?.type === 'default') {
      toast({
        title: 'Cannot update the default PAC file',
        description: 'The default PAC file is read-only.',
        variant: 'destructive',
      });
      return;
    }
    const cleanFileName = generateCleanFileName(file.name);
    setPacFiles(prev => prev.map(f =>
      f.id === id
        ? {
            ...f,
            name: cleanFileName,
            dateModified: new Date().toLocaleDateString(),
          }
        : f
    ));
    toast({
      title: 'PAC file replaced',
      description: 'Browsers using this PAC URL will receive the new content on their next fetch.',
    });
  };

  const handleDelete = (id: string) => {
    const file = pacFiles.find(f => f.id === id);
    if (file?.type === 'default') {
      toast({
        title: 'Cannot delete the default PAC file',
        description: 'The default PAC file is system-provided and cannot be deleted.',
        variant: 'destructive',
      });
      return;
    }
    setPacFiles(prev => prev.filter(f => f.id !== id));
    toast({
      title: 'PAC file deleted',
      description: 'The PAC file was removed. Its hosted URL no longer responds.',
    });
  };

  const handleMarkActive = (id: string) => {
    setPacFiles(prev => prev.map(file =>
      file.id === id
        ? { ...file, isActive: true, status: 'active' as const }
        : file
    ));
    toast({
      title: 'PAC file activated',
      description: 'Browsers can now fetch this PAC URL.',
    });
  };

  const canDeactivate = (id: string): boolean => {
    const target = pacFiles.find(f => f.id === id);
    if (!target?.isActive) return true;
    const activeCount = pacFiles.filter(f => f.isActive).length;
    return activeCount > 1;
  };

  const handleMarkInactive = (id: string) => {
    if (!canDeactivate(id)) {
      toast({
        title: 'Cannot deactivate the only active PAC file',
        description: 'EFP requires at least one active PAC file. Add or activate another PAC file first.',
        variant: 'destructive',
      });
      return;
    }
    setPacFiles(prev => prev.map(file =>
      file.id === id
        ? { ...file, isActive: false, status: 'inactive' as const }
        : file
    ));
    toast({
      title: 'PAC file deactivated',
      description: 'Browsers using this PAC URL will stop receiving proxy configuration on their next fetch.',
    });
  };

  const handleDownload = (id: string) => {
    const file = pacFiles.find(f => f.id === id);
    if (file) {
      const pacContent = 'function FindProxyForURL(url, host) {\n  // PAC file: ' + file.name + '\n  return "DIRECT";\n}';
      const blob = new Blob([pacContent], { type: 'application/x-ns-proxy-autoconfig' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: 'PAC file downloaded',
        description: file.name + ' was downloaded.',
      });
    }
  };

  return {
    pacFiles,
    handleUpload,
    handleUpdate,
    handleDelete,
    handleMarkActive,
    handleMarkInactive,
    handleDownload,
    canDeactivate,
  };
};
