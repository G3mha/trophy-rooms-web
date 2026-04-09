"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { toast } from "sonner";
import { X, DollarSign, Calendar } from "lucide-react";
import { MARK_AS_PURCHASED } from "@/graphql/mutations";
import { GET_MY_BUYLIST, GET_BUYLIST_STATS } from "@/graphql/queries";
import { GET_PLATFORMS } from "@/graphql/admin_queries";
import styles from "./MarkAsPurchasedModal.module.css";

interface Platform {
  id: string;
  name: string;
  slug: string;
}

interface BuylistItem {
  id: string;
  displayTitle: string;
  displayCoverUrl: string | null;
  estimatedPrice: number | null;
  itemType: "GAME" | "DLC" | "BUNDLE";
}

interface MarkAsPurchasedModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: BuylistItem;
}

export function MarkAsPurchasedModal({
  isOpen,
  onClose,
  item,
}: MarkAsPurchasedModalProps) {
  const [purchasePrice, setPurchasePrice] = useState<string>("");
  const [purchasedAt, setPurchasedAt] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [platformId, setPlatformId] = useState<string>("");

  const { data: platformsData } = useQuery(GET_PLATFORMS, {
    skip: item.itemType !== "GAME",
  });
  const platforms: Platform[] = platformsData?.platforms ?? [];

  const [markAsPurchased, { loading }] = useMutation(MARK_AS_PURCHASED, {
    refetchQueries: [
      { query: GET_MY_BUYLIST },
      { query: GET_BUYLIST_STATS },
    ],
    onCompleted: (data) => {
      if (data.markAsPurchased.success) {
        onClose();
        resetForm();
        toast.success("Item marked as purchased and added to your collection.");
      } else {
        toast.error(data.markAsPurchased.error?.message || "Failed to mark as purchased.");
      }
    },
    onError: (error) => toast.error(error.message || "Failed to mark as purchased."),
  });

  // Pre-fill with estimated price when item changes
  useEffect(() => {
    if (item.estimatedPrice !== null) {
      setPurchasePrice(item.estimatedPrice.toString());
    } else {
      setPurchasePrice("");
    }
    setPurchasedAt(new Date().toISOString().split("T")[0]);
    setPlatformId("");
  }, [item]);

  const resetForm = () => {
    setPurchasePrice("");
    setPurchasedAt(new Date().toISOString().split("T")[0]);
    setPlatformId("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const price = purchasePrice ? parseFloat(purchasePrice) : null;
    const purchasedAtDate = purchasedAt ? new Date(purchasedAt).toISOString() : null;

    await markAsPurchased({
      variables: {
        id: item.id,
        platformId: platformId || null,
        purchasePrice: price,
        purchasedAt: purchasedAtDate,
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Mark as Purchased</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.itemInfo}>
          {item.displayCoverUrl && (
            <img
              src={item.displayCoverUrl}
              alt={item.displayTitle}
              className={styles.itemCover}
            />
          )}
          <h3 className={styles.itemTitle}>{item.displayTitle}</h3>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>
              <DollarSign size={14} />
              Purchase Price
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              className={styles.input}
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              <Calendar size={14} />
              Purchase Date
            </label>
            <input
              type="date"
              className={styles.input}
              value={purchasedAt}
              onChange={(e) => setPurchasedAt(e.target.value)}
            />
          </div>

          {item.itemType === "GAME" && (
            <div className={styles.field}>
              <label className={styles.label}>Platform (optional)</label>
              <select
                className={styles.select}
                value={platformId}
                onChange={(e) => setPlatformId(e.target.value)}
              >
                <option value="">Select platform...</option>
                {platforms.map((platform) => (
                  <option key={platform.id} value={platform.id}>
                    {platform.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? "Saving..." : "Mark as Purchased"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
