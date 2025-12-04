import { CrossDomainView } from '../components/cross-domain';

export function CrossDomain() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Cross-Domain Analysis</h1>
        <p className="text-gray-600 mt-2">
          Explore connections, dependencies, and impact across airline operational domains
        </p>
      </div>

      <CrossDomainView />
    </div>
  );
}
