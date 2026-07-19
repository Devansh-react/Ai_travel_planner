import type { LeadState } from "../types";

function FieldRow({ label, value }: { label: string; value: string | number | null }): JSX.Element {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-200/70 py-2 last:border-b-0">
      <dt className="text-sm font-medium text-slate-500">{label}</dt>
      <dd className="max-w-[55%] text-right text-sm text-slate-900">{value ?? "—"}</dd>
    </div>
  );
}

export function CapturedFieldsPanel({ leadState }: { leadState: LeadState }): JSX.Element {
  return (
    <aside className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_24px_90px_rgba(15,23,42,0.12)] backdrop-blur">
      <h2 className="text-lg font-semibold text-ink-900">Captured Fields</h2>
      <p className="mt-1 text-sm text-slate-500">Live view of the current conversation state.</p>

      <div className="mt-5 space-y-5">
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-coral-500">Customer</h3>
          <dl className="mt-3">
            <FieldRow label="Name" value={leadState.customer.name} />
            <FieldRow label="Phone" value={leadState.customer.phone} />
            <FieldRow label="Email" value={leadState.customer.email} />
          </dl>
        </section>
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-coral-500">Travel</h3>
          <dl className="mt-3">
            <FieldRow label="Destination" value={leadState.travel.destination} />
            <FieldRow label="Departure City" value={leadState.travel.departureCity} />
            <FieldRow label="Travel Date" value={leadState.travel.travelDate} />
            <FieldRow label="Travellers" value={leadState.travel.travellers} />
            <FieldRow label="Budget" value={leadState.travel.budget} />
            <FieldRow label="Duration" value={leadState.travel.duration} />
            <FieldRow label="Trip Type" value={leadState.travel.tripType} />
            <FieldRow label="Special Requirements" value={leadState.travel.specialRequirements} />
          </dl>
        </section>
      </div>
    </aside>
  );
}
