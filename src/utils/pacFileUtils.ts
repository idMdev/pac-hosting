
// Static per-tenant identifiers. In production these come from the signed-in tenant context.
const TENANT_GUID = '8f4e3c2a-5b1d-4f7e-9a6c-2d8e1b3f4a5c';
const TENANT_PATH_TOKEN = 'k9x7m2qp';

const generateRandomString = () => {
  return Math.random().toString(36).substring(2, 10);
};

let globalRandomString: string | null = null;

export const getGlobalRandomString = (): string => {
  if (!globalRandomString) {
    globalRandomString = generateRandomString();
  }
  return globalRandomString;
};

export const generatePacFileUrl = (fileName: string): string => {
  return `https://pac.gsa.microsoft.com/${TENANT_GUID}/${TENANT_PATH_TOKEN}/${fileName}`;
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
