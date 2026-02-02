"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { updateUserRole, type UpdateRoleResult } from "./actions";
import { Shield, ShieldOff, Loader2 } from "lucide-react";

interface UserRoleButtonProps {
  userId: string;
  currentRole: "user" | "admin" | null;
  isCurrentUser: boolean;
}

export function UserRoleButton({
  userId,
  currentRole,
  isCurrentUser,
}: UserRoleButtonProps) {
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const isAdmin = currentRole === "admin";
  const newRole = isAdmin ? "user" : "admin";

  async function handleClick() {
    setIsPending(true);
    setMessage(null);

    try {
      const result: UpdateRoleResult = await updateUserRole(userId, newRole);

      if (result.success) {
        setMessage({ type: "success", text: result.message });
        // Clear success message after 3 seconds
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: "error", text: result.error });
      }
    } catch (error) {
      setMessage({ type: "error", text: "An unexpected error occurred" });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={isAdmin ? "outline" : "default"}
        size="sm"
        onClick={handleClick}
        disabled={isPending}
        className="min-w-[100px]"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isAdmin ? (
          <>
            <ShieldOff className="h-4 w-4 mr-1" />
            Demote
          </>
        ) : (
          <>
            <Shield className="h-4 w-4 mr-1" />
            Promote
          </>
        )}
      </Button>
      {isCurrentUser && (
        <span className="text-xs text-muted-foreground">(You)</span>
      )}
      {message && (
        <span
          className={`text-xs ${
            message.type === "success" ? "text-green-600" : "text-red-600"
          }`}
        >
          {message.text}
        </span>
      )}
    </div>
  );
}
