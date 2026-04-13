import { useState, useEffect } from "react";
import { X, Crown, Star, Zap, Check } from "lucide-react";
import { useUpgradeTier } from "../hooks/useProfile";
import type { PremiumTier } from "../hooks/useProfile";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  currentTier: PremiumTier;
}

const TIERS: Array<{
  id: PremiumTier;
  name: string;
  price: string;
  icon: React.ReactNode;
  color: string;
  borderColor: string;
  features: string[];
}> = [
  {
    id: "fan",
    name: "Fan",
    price: "$2.99/mo",
    icon: <Star className="w-5 h-5" />,
    color: "text-primary",
    borderColor: "border-primary/40",
    features: [
      "Rose-pink verified badge",
      "Exclusive fan stickers",
      "Priority comment visibility",
      "Fan-only creator content",
    ],
  },
  {
    id: "creator",
    name: "Creator",
    price: "$9.99/mo",
    icon: <Zap className="w-5 h-5" />,
    color: "text-gold",
    borderColor: "border-gold/50",
    features: [
      "Gold gradient badge",
      "Creator analytics dashboard",
      "Custom link in bio",
      "Trending boost",
      "Monetisation tools",
      "Everything in Fan",
    ],
  },
  {
    id: "vip",
    name: "VIP",
    price: "$24.99/mo",
    icon: <Crown className="w-5 h-5" />,
    color: "text-gold",
    borderColor: "border-transparent",
    features: [
      "Animated rainbow avatar ring",
      "Crown icon on all posts",
      "Top placement in Explore",
      "Live rooms priority listing",
      "VIP badge across the app",
      "Everything in Creator",
    ],
  },
];

export default function PremiumUpgradeSheet({ open, onClose, currentTier }: Props) {
  const [selected, setSelected] = useState<PremiumTier>("creator");
  const upgradeMutation = useUpgradeTier();

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const handleUpgrade = async () => {
    if (selected === currentTier) {
      toast.info("You're already on this tier!");
      return;
    }
    try {
      await upgradeMutation.mutateAsync(selected);
      toast.success(`Upgraded to ${TIERS.find((t) => t.id === selected)?.name}! 🎉`);
      onClose();
    } catch {
      toast.error("Upgrade failed. Please try again.");
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Premium Upgrade"
    >
      <button
        type="button"
        className="absolute inset-0 bg-dark/80 backdrop-blur-sm w-full"
        onClick={onClose}
        aria-label="Close sheet"
      />

      <div className="relative z-10 w-full sm:max-w-lg bg-surface rounded-t-3xl sm:rounded-3xl max-h-[90dvh] overflow-y-auto scrollbar-hide animate-slide-up">
        <div className="sticky top-0 bg-surface/95 backdrop-blur-sm px-5 pt-5 pb-3 flex items-center justify-between border-b border-white/8 z-10">
          <div>
            <h2 className="text-lg font-display font-semibold text-white flex items-center gap-2">
              <Crown className="w-5 h-5 text-gold" />
              Upgrade to Premium
            </h2>
            <p className="text-white/50 text-sm">Unlock exclusive features</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-higher flex items-center justify-center text-white/60 hover:text-white"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          {TIERS.map((tier) => {
            const isActive = currentTier === tier.id;
            const isSelected = selected === tier.id;
            return (
              <button
                key={tier.id}
                type="button"
                onClick={() => setSelected(tier.id)}
                data-ocid={`tier-option-${tier.id}`}
                className={`w-full text-left rounded-2xl p-4 border transition-smooth ${
                  tier.id === "vip"
                    ? "vip-ring p-0.5"
                    : `${tier.borderColor} ${isSelected ? "bg-surface-higher" : "bg-surface-high"}`
                }`}
              >
                <div className={tier.id === "vip" ? "bg-surface-high rounded-xl p-4" : ""}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          tier.id === "creator"
                            ? "bg-gold/20 text-gold"
                            : tier.id === "vip"
                            ? "bg-gold/20 text-gold"
                            : "bg-primary/20 text-primary"
                        }`}
                      >
                        {tier.icon}
                      </div>
                      <div>
                        <div className={`font-semibold ${tier.color}`}>{tier.name}</div>
                        <div className="text-white/50 text-sm">{tier.price}</div>
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 ${
                        isSelected
                          ? tier.id === "creator" || tier.id === "vip"
                            ? "border-gold bg-gold"
                            : "border-primary bg-primary"
                          : "border-white/20"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-dark" />}
                    </div>
                  </div>

                  <ul className="mt-3 space-y-1.5">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-white/70">
                        <Check className={`w-3.5 h-3.5 flex-shrink-0 ${tier.color}`} />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {isActive && (
                    <div className="mt-3 text-xs text-white/40 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Current plan
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="sticky bottom-0 bg-surface/95 backdrop-blur-sm px-5 pb-6 pb-safe pt-3 border-t border-white/8">
          <button
            type="button"
            onClick={handleUpgrade}
            disabled={upgradeMutation.isPending || selected === currentTier}
            data-ocid="upgrade-confirm-btn"
            className="w-full h-12 btn-gold rounded-full font-semibold text-dark flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {upgradeMutation.isPending ? (
              <div className="w-5 h-5 border-2 border-dark/30 border-t-dark rounded-full animate-spin" />
            ) : (
              <>
                <Crown className="w-4 h-4" />
                {selected === currentTier
                  ? "Already on this tier"
                  : `Upgrade to ${TIERS.find((t) => t.id === selected)?.name}`}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
