"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { toast } from "sonner";

interface FeedbackButtonsProps {
  rfpId: string;
  onFeedback: (rfpId: string) => void;
}

export function FeedbackButtons({ rfpId, onFeedback }: FeedbackButtonsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFeedback = async (feedback: "up" | "down") => {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rfpId,
          feedback,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit feedback");
      }

      toast.success(
        feedback === "up"
          ? "Thanks! We'll show you more like this."
          : "Got it. We'll adjust your recommendations."
      );

      onFeedback(rfpId);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center gap-4">
      <Button
        size="lg"
        variant="outline"
        onClick={() => handleFeedback("down")}
        disabled={isSubmitting}
        className="gap-2"
      >
        <ThumbsDown className="h-5 w-5" />
        Not Relevant
      </Button>
      <Button
        size="lg"
        onClick={() => handleFeedback("up")}
        disabled={isSubmitting}
        className="gap-2"
      >
        <ThumbsUp className="h-5 w-5" />
        Relevant
      </Button>
    </div>
  );
}
