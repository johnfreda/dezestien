'use client';

import { useState } from 'react';
import { MessageSquare, Send, Loader2, CheckCircle, Mail } from 'lucide-react';

export default function Comments({ slug }: { slug: string }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Vul een geldig e-mailadres in.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/comment-interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), slug }),
      });

      if (res.ok) {
        setSubmitted(true);
        setEmail('');
      } else {
        const data = await res.json();
        setError(data.error || 'Er ging iets mis. Probeer het later opnieuw.');
      }
    } catch {
      setError('Er ging iets mis. Probeer het later opnieuw.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl p-6 md:p-8 mt-12">
      <h3 className="text-xl font-display font-bold text-white mb-2 flex items-center gap-2">
        <MessageSquare className="text-green-500" /> Reacties
      </h3>

      {submitted ? (
        <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-6 text-center">
          <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
          <p className="text-white font-bold text-lg mb-1">Bedankt voor je interesse!</p>
          <p className="text-[var(--text-muted)] text-sm">
            We houden je op de hoogte zodra de reactiefunctie live gaat.
          </p>
        </div>
      ) : (
        <>
          <p className="text-[var(--text-muted)] mb-6 text-sm leading-relaxed">
            We bouwen momenteel aan een reactiesysteem voor DeZestien.nl. 
            Wil jij straks meepraten over het Nederlandse voetbal? Laat je e-mailadres achter 
            en we laten je weten wanneer het zover is. Hoe meer interesse, hoe sneller we het bouwen!
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="je@email.nl"
                  className="w-full bg-gray-900 border border-[var(--border-primary)] rounded-lg pl-11 pr-4 py-3 text-white text-sm focus:outline-none focus:border-green-500 transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm whitespace-nowrap"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Send size={18} />
                )}
                Hou me op de hoogte
              </button>
            </div>
            {error && (
              <p className="text-red-400 text-xs">{error}</p>
            )}
            <p className="text-[var(--text-muted)] text-xs">
              We sturen alleen een bericht als reacties live gaan. Geen spam, beloofd.
            </p>
          </form>
        </>
      )}
    </div>
  );
}
