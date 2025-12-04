import { Link } from 'react-router-dom';
import { useDomains } from '../hooks/useEntities';
import { ChevronRight } from 'lucide-react';

export function Domains() {
  const { data: domains, isLoading } = useDomains();

  if (isLoading) {
    return <div className="max-w-7xl mx-auto px-4 py-8">Loading domains...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Domains</h1>
        <p className="mt-2 text-gray-600">
          Manage your organizational domains and subdomains
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {domains?.map((domain: any) => (
          <Link
            key={domain.id}
            to={`/domains/${domain.id}`}
            className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <span className="text-3xl mr-3">{domain.icon}</span>
                <h3 className="text-lg font-semibold text-gray-900">
                  {domain.name}
                </h3>
              </div>
              <ChevronRight
                size={20}
                className="text-gray-400 group-hover:text-gray-600 transition-colors"
              />
            </div>
            <p className="text-sm text-gray-600 mb-4">{domain.description}</p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">
                {domain.subdomains?.length || 0} subdomains
              </span>
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: domain.color }}
              />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
