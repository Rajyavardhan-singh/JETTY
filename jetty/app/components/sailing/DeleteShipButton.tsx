"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Props {
  shipId: string;
  vesselName: string;
  variant?: "icon" | "full";
  className?: string;
  userId: string;
}

export default function DeleteShipButton({ shipId, vesselName, variant = "full", className, userId }: Props) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm(`Are you sure you want to delete "${vesselName}"? This action cannot be undone and will remove all associated documentation and details.`)) {
      return;
    }

    setIsDeleting(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("sailing_history")
      .delete()
      .eq("id", shipId)
      .eq("user_id", userId);

    setIsDeleting(false);

    if (error) {
      alert("Failed to delete vessel: " + error.message);
      return;
    }

    // Refresh layout, redirect to main page to clear old views
    router.refresh();
    router.replace("/sailing-history");
  }

  if (variant === "icon") {
    return (
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className={className}
        title="Delete Vessel"
        style={{ background: "none", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
      >
        <span className="msi msi-sm" style={{ color: "#ffb4ab", opacity: isDeleting ? 0.5 : 1 }}>delete</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.25rem",
        color: "#ffb4ab",
        background: "rgba(255, 75, 75, 0.1)",
        border: "1px solid rgba(255, 75, 75, 0.3)",
        padding: "0.625rem 1rem",
        borderRadius: "999px",
        cursor: "pointer",
        fontFamily: "var(--font-inter)",
        fontWeight: 600,
        opacity: isDeleting ? 0.7 : 1,
        transition: "all 0.2s"
      }}
    >
      <span className="msi msi-sm">{isDeleting ? "hourglass_empty" : "delete"}</span>
      {isDeleting ? "Deleting..." : "Delete Vessel"}
    </button>
  );
}
