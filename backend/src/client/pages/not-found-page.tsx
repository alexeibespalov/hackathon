import { Link } from 'react-router-dom';

export function NotFoundPage() {
	return (
		<div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-8 text-center">
			<p className="mono text-xs uppercase tracking-[0.3em] text-slate-400">Route not found</p>
			<h3 className="mt-4 text-3xl font-semibold tracking-tight text-white">This panel has not been charted yet.</h3>
			<p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-300">
				The manager shell is live, but that route has not been implemented. Head back to one of the configured work surfaces.
			</p>
			<Link className="mt-6 inline-flex rounded-2xl border border-cyan-400/40 bg-cyan-400/15 px-4 py-3 text-sm font-medium text-cyan-100" to="/">
				Return to dashboard
			</Link>
		</div>
	);
}