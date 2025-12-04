import { Link } from 'react-router-dom';
import { usePersonas } from '../hooks/useEntities';
import { ChevronRight, Users, Briefcase } from 'lucide-react';

export function Personas() {
  const { data: personas, isLoading } = usePersonas();

  if (isLoading) {
    return <div className="max-w-7xl mx-auto px-4 py-8">Loading personas...</div>;
  }

  // Group personas by subdomain
  const personasBySubdomain = personas?.reduce((acc: any, persona: any) => {
    const subdomainName = persona.subdomain?.name || 'Unknown';
    if (!acc[subdomainName]) {
      acc[subdomainName] = [];
    }
    acc[subdomainName].push(persona);
    return acc;
  }, {});

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Personas</h1>
        <p className="mt-2 text-gray-600">
          Human roles in airline operations - who does the work and their pain points
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">Total Personas</p>
              <p className="text-3xl font-semibold text-gray-900">
                {personas?.length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
              <Briefcase className="h-6 w-6 text-white" />
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">Total Use Cases</p>
              <p className="text-3xl font-semibold text-gray-900">
                {personas?.reduce((sum: number, p: any) => sum + (p.useCases?.length || 0), 0) || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">Subdomains</p>
              <p className="text-3xl font-semibold text-gray-900">
                {Object.keys(personasBySubdomain || {}).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Personas grouped by subdomain */}
      <div className="space-y-8">
        {Object.entries(personasBySubdomain || {}).map(([subdomainName, subdomainPersonas]: [string, any]) => (
          <div key={subdomainName}>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <span className="text-2xl mr-2">{(subdomainPersonas[0] as any).subdomain?.domain?.icon}</span>
              {subdomainName}
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {(subdomainPersonas as any[]).map((persona: any) => (
                <Link
                  key={persona.id}
                  to={`/personas/${persona.id}`}
                  className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      {persona.icon && <span className="text-3xl mr-3">{persona.icon}</span>}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {persona.name}
                        </h3>
                        {persona.fullTitle && (
                          <p className="text-xs text-gray-500">{persona.fullTitle}</p>
                        )}
                      </div>
                    </div>
                    <ChevronRight
                      size={20}
                      className="text-gray-400 group-hover:text-gray-600 transition-colors"
                    />
                  </div>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {persona.description}
                  </p>

                  {/* Pain Points Preview */}
                  {persona.painPoints && persona.painPoints.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-red-600 mb-1">
                        Top Pain Point:
                      </p>
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {persona.painPoints[0]}
                      </p>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm pt-4 border-t border-gray-100">
                    <span className="text-gray-500">
                      {persona.useCases?.length || 0} use cases
                    </span>
                    {persona.systemsUsed && (
                      <span className="text-gray-500">
                        {persona.systemsUsed.length} systems
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {(!personas || personas.length === 0) && (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No personas</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating your first persona.
          </p>
        </div>
      )}
    </div>
  );
}
