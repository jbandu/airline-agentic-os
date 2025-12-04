interface BuildProgressProps {
  built: number;
  inProgress: number;
  planned: number;
  total: number;
}

export function BuildProgress({ built, inProgress, planned, total }: BuildProgressProps) {
  const builtPct = total > 0 ? (built / total) * 100 : 0;
  const inProgressPct = total > 0 ? (inProgress / total) * 100 : 0;
  const plannedPct = total > 0 ? (planned / total) * 100 : 0;

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Build Progress</h3>

      {/* Progress Bar */}
      <div className="w-full h-8 bg-gray-200 rounded-full overflow-hidden flex mb-4">
        {builtPct > 0 && (
          <div
            className="bg-green-500 flex items-center justify-center text-white text-xs font-medium"
            style={{ width: `${builtPct}%` }}
            title={`Built: ${built} (${Math.round(builtPct)}%)`}
          >
            {builtPct > 10 && `${Math.round(builtPct)}%`}
          </div>
        )}
        {inProgressPct > 0 && (
          <div
            className="bg-blue-500 flex items-center justify-center text-white text-xs font-medium"
            style={{ width: `${inProgressPct}%` }}
            title={`In Progress: ${inProgress} (${Math.round(inProgressPct)}%)`}
          >
            {inProgressPct > 10 && `${Math.round(inProgressPct)}%`}
          </div>
        )}
        {plannedPct > 0 && (
          <div
            className="bg-gray-400 flex items-center justify-center text-white text-xs font-medium"
            style={{ width: `${plannedPct}%` }}
            title={`Planned: ${planned} (${Math.round(plannedPct)}%)`}
          >
            {plannedPct > 10 && `${Math.round(plannedPct)}%`}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <div className="flex items-center mb-1">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span className="text-sm font-medium text-gray-700">Built</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{built}</p>
          <p className="text-xs text-gray-500">{Math.round(builtPct)}% complete</p>
        </div>
        <div>
          <div className="flex items-center mb-1">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            <span className="text-sm font-medium text-gray-700">In Progress</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{inProgress}</p>
          <p className="text-xs text-gray-500">{Math.round(inProgressPct)}% of total</p>
        </div>
        <div>
          <div className="flex items-center mb-1">
            <div className="w-3 h-3 bg-gray-400 rounded-full mr-2"></div>
            <span className="text-sm font-medium text-gray-700">Planned</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{planned}</p>
          <p className="text-xs text-gray-500">{Math.round(plannedPct)}% of total</p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          Total Tools: <span className="font-semibold text-gray-900">{total}</span>
        </p>
      </div>
    </div>
  );
}
