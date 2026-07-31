import { StatusPill } from "@/components/status-pill";
import { Card } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";
import { formatMoney } from "@/server/domain";
import { getWallet } from "@/server/smartpark-service";

export default async function WalletPage() {
  const user = await requireRole(["driver"]);
  const wallet = getWallet(user.id);

  return (
    <div className="space-y-5">
      <Card>
        <p className="text-sm font-semibold uppercase tracking-wide text-mint">Wallet</p>
        <h1 className="mt-2 text-4xl font-bold text-ink">
          {formatMoney(wallet.account?.balanceMinor ?? 0, wallet.account?.currency)}
        </h1>
        <p className="mt-2 text-sm text-asphalt/70">Demo top-ups are seeded. Real provider top-up is an adapter.</p>
      </Card>
      <Card>
        <h2 className="text-xl font-bold text-ink">Transactions</h2>
        <div className="mt-5 grid gap-3">
          {wallet.transactions.length === 0 ? (
            <p className="text-sm text-asphalt/70">No wallet transactions yet.</p>
          ) : (
            wallet.transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between rounded-lg border border-ink/10 p-4">
                <div>
                  <p className="font-semibold text-ink">{transaction.description}</p>
                  <p className="text-sm text-asphalt/60">{new Date(transaction.createdAt).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-ink">{formatMoney(transaction.amountMinor)}</p>
                  <StatusPill status={transaction.status} />
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
