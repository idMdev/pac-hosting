
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { generateCleanFileName, getProfileFileName, getGlobalRandomString } from '@/utils/pacFileUtils';

export interface PacFile {
  id: string;
  name: string;
  type: 'uploaded' | 'generated';
  profile?: string;
  dateCreated: string;
  status: 'active' | 'inactive';
  isActive: boolean;
  url: string;
}

export const usePacFiles = () => {
  const [pacFiles, setPacFiles] = useState<PacFile[]>([]);
  const { toast } = useToast();

  // Generate URL using the same random string for all files
  const generatePacFileUrl = (fileName: string): string => {
    const randomString = getGlobalRandomString();
    return `https://pac.gsa.microsoft.com/${randomString}/${fileName}`;
  };

  const handleUpload = (file: File) => {
    const cleanFileName = generateCleanFileName(file.name);
    
    const newPacFile: PacFile = {
      id: Date.now().toString(),
      name: cleanFileName,
      type: 'uploaded',
      dateCreated: new Date().toLocaleDateString(),
      status: 'active',
      isActive: false,
      url: generatePacFileUrl(cleanFileName)
    };
    
    setPacFiles(prev => [...prev, newPacFile]);
    toast({
      title: 'PAC File Uploaded',
      description: `${cleanFileName} has been successfully uploaded.`,
    });
  };

  const handleGenerate = (profile: string) => {
    const profileName = getProfileFileName(profile);
    const fileName = `${profileName}_${Date.now()}.pac`;
    
    const newPacFile: PacFile = {
      id: Date.now().toString(),
      name: fileName,
      type: 'generated',
      profile,
      dateCreated: new Date().toLocaleDateString(),
      status: 'active',
      isActive: false,
      url: generatePacFileUrl(fileName)
    };
    
    setPacFiles(prev => [...prev, newPacFile]);
    toast({
      title: 'PAC File Generated',
      description: `PAC file with ${profile === 'both' ? 'Internet and Private Access' : profile === 'internet' ? 'Internet Access' : 'Private Access'} profile has been created.`,
    });
  };

  const handleDelete = (id: string) => {
    setPacFiles(prev => prev.filter(file => file.id !== id));
    toast({
      title: 'PAC File Deleted',
      description: 'The PAC file has been removed.',
    });
  };

  const handleMarkActive = (id: string) => {
    setPacFiles(prev => prev.map(file => ({
      ...file,
      isActive: file.id === id ? true : file.isActive
    })));
    toast({
      title: 'PAC File Activated',
      description: 'The PAC file has been marked as active.',
    });
  };

  const handleMarkInactive = (id: string) => {
    setPacFiles(prev => prev.map(file => ({
      ...file,
      isActive: file.id === id ? false : file.isActive
    })));
    toast({
      title: 'PAC File Deactivated',
      description: 'The PAC file has been marked as inactive.',
    });
  };

  const handleDownload = (id: string) => {
    const file = pacFiles.find(f => f.id === id);
    if (file) {
      // Create a simple PAC file content
      const pacContent = `function FindProxyForURL(url, host) {
  // PAC file: ${file.name}
  // Generated on: ${file.dateCreated}
  // Profile: ${file.profile || 'Custom'}
  
  return "DIRECT";
}`;
      
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
        title: 'PAC File Downloaded',
        description: `${file.name} has been downloaded.`,
      });
    }
  };

  return {
    pacFiles,
    handleUpload,
    handleGenerate,
    handleDelete,
    handleMarkActive,
    handleMarkInactive,
    handleDownload
  };
};
