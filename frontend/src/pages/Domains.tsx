import { useQuery } from '@tanstack/react-query';
import { domainsApi } from '@/lib/api';

export function Domains() {
  const { data: domains, isLoading } = useQuery({
    queryKey: ['domains'],
    queryFn: () => domainsApi.getAll().then(res => res.data),
  });

  if (isLoading) {
    return <div>Loading domains...</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Domains</h1>
        <p className="mt-2 text-gray-600">
          Manage your organizational domains and subdomains
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {domains?.map((domain: any) => (
          <div
            key={domain.id}
            className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center mb-4">
              <span className="text-3xl mr-3">{domain.icon}</span>
              <h3 className="text-lg font-semibold text-gray-900">
                {domain.name}
              </h3>
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
          </div>
        ))}
      </div>
    </div>
  );
}
