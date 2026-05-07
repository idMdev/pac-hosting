import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Shield, Globe, Users, Settings, BarChart3, Router } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface SidebarItem {
  title: string;
  icon: React.ComponentType<any>;
  path?: string;
  children?: SidebarItem[];
}

const sidebarItems: SidebarItem[] = [
  {
    title: 'Dashboard',
    icon: BarChart3,
    path: '/'
  },
  {
    title: 'External Identities',
    icon: Users,
    children: [
      { title: 'All users', icon: Users, path: '/external-identities/users' }
    ]
  },
  {
    title: 'Protection',
    icon: Shield,
    children: [
      { title: 'Conditional Access', icon: Shield, path: '/protection/conditional-access' }
    ]
  },
  {
    title: 'Identity Governance',
    icon: Settings,
    children: [
      { title: 'Access Reviews', icon: Settings, path: '/identity-governance/reviews' }
    ]
  },
  {
    title: 'Global Secure Access',
    icon: Globe,
    children: [
      { title: 'Dashboard', icon: BarChart3, path: '/global-secure-access/dashboard' },
      { title: 'Traffic forwarding', icon: Globe, path: '/global-secure-access/traffic-forwarding' },
      { title: 'Client download', icon: Globe, path: '/global-secure-access/client-download' },
      { title: 'Remote networks', icon: Globe, path: '/global-secure-access/remote-networks' },
      { title: 'Explicit Forward Proxy', icon: Router, path: '/global-secure-access/connectors/explicit-forward-proxy' }
    ]
  }
];

interface SidebarSectionProps {
  item: SidebarItem;
  level: number;
}

const SidebarSection: React.FC<SidebarSectionProps> = ({ item, level }) => {
  const [isExpanded, setIsExpanded] = useState(level === 0);
  const location = useLocation();
  const hasChildren = item.children && item.children.length > 0;
  const isActive = item.path === location.pathname;

  const handleToggle = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  const ItemIcon = item.icon;
  const paddingLeft = level * 16 + 16;

  if (!hasChildren && item.path) {
    return (
      <Link
        to={item.path}
        className={cn(
          "flex items-center py-2 px-4 text-sm text-gray-700 hover:bg-gray-100 transition-colors",
          isActive && "bg-blue-50 text-blue-600 border-r-2 border-blue-600"
        )}
        style={{ paddingLeft: `${paddingLeft}px` }}
      >
        <ItemIcon className="w-4 h-4 mr-3" />
        {item.title}
      </Link>
    );
  }

  return (
    <div>
      <button
        onClick={handleToggle}
        className={cn(
          "w-full flex items-center py-2 px-4 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left",
          isActive && "bg-blue-50 text-blue-600"
        )}
        style={{ paddingLeft: `${paddingLeft}px` }}
      >
        <ItemIcon className="w-4 h-4 mr-3" />
        <span className="flex-1">{item.title}</span>
        {hasChildren && (
          isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
        )}
      </button>
      {hasChildren && isExpanded && (
        <div>
          {item.children!.map((child, index) => (
            <SidebarSection key={index} item={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

const Sidebar: React.FC = () => {
  return (
    <div className="w-80 bg-white border-r border-gray-200 h-screen overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-lg font-semibold text-gray-900">Microsoft Entra admin center</h1>
      </div>
      <nav className="py-4">
        {sidebarItems.map((item, index) => (
          <SidebarSection key={index} item={item} level={0} />
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
