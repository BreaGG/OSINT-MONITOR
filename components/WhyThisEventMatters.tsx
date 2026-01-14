"use client"

type Props = {
  reasons: string[]
}

export default function WhyThisEventMatters({ reasons }: Props) {
  return (
    <section className="border border-gray-800 rounded bg-gray-950/50 overflow-hidden">
      {/* HEADER NATO-STYLE */}
      <div className="bg-gray-900/50 px-3 py-2 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-1 h-1 bg-cyan-500 rounded-full" />
          <span className="text-[9px] uppercase tracking-[0.15em] font-bold text-gray-500">
            Strategic Assessment
          </span>
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-3">
        {reasons.length > 0 ? (
          <ul className="space-y-2 text-[10px]">
            {reasons.map((reason, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-cyan-500 mt-0.5 flex-shrink-0">▸</span>
                <span className="text-gray-400 leading-relaxed">{reason}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-4">
            <div className="text-gray-700 text-[10px]">
              No strategic assessment available
            </div>
          </div>
        )}
      </div>

      {/* FOOTER NOTE */}
      <div className="px-3 py-1.5 bg-gray-950/80 border-t border-gray-800">
        <div className="flex items-center justify-between text-[8px]">
          <span className="text-gray-700 uppercase tracking-wider">
            Intel Analysis
          </span>
          <span className="text-gray-800 font-mono">
            AUTO-GEN
          </span>
        </div>
      </div>
    </section>
  )
}