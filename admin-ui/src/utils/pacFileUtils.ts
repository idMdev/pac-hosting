
// Generate a single random string to be used for all PAC files
const generateRandomString = () => {
  return Math.random().toString(36).substring(2, 10);
};

// Store the random string globally for consistency
let globalRandomString: string | null = null;

export const getGlobalRandomString = (): string => {
  if (!globalRandomString) {
    globalRandomString = generateRandomString();
  }
  return globalRandomString;
};

export const generatePacFileUrl = (fileName: string): string => {
  const randomString = getGlobalRandomString();
  return `https://pac.gsa.microsoft.com/${randomString}/${fileName}`;
};

export const generateCleanFileName = (originalName: string): string => {
  return originalName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
};

export const getProfileDisplayName = (profile: string): string => {
  switch (profile) {
    case 'internet':
      return 'Internet Access';
    case 'private':
      return 'Private Access';
    case 'both':
      return 'Internet and Private Access';
    default:
      return '-';
  }
};

export const getProfileFileName = (profile: string): string => {
  const profileNames = {
    internet: 'IA',
    private: 'PA',
    both: 'IA_and_PA'
  };
  return profileNames[profile as keyof typeof profileNames] || 'Unknown';
};
