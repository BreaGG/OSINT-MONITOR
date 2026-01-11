"use client"

type Props = {
  reasons: string[]
}

export default function WhyThisEventMatters({ reasons }: Props) {
  return (
    <section className="border border-gray-800 rounded-lg bg-black/40 p-4 space-y-2">
      <div className="text-[11px] uppercase tracking-wide text-gray-500">
        Why this event matters
      </div>

      <ul className="list-disc list-inside space-y-1 text-sm text-gray-200">
        {reasons.map((r, idx) => (
          <li key={idx}>{r}</li>
        ))}
      </ul>
    </section>
  )
}
