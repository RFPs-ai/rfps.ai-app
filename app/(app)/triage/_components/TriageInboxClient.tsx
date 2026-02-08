"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Calendar, DollarSign, MapPin } from "lucide-react";
import { FeedbackButtons } from "./FeedbackButtons";
import type { UserRfp, Rfp } from "@/lib/db/schema";

type TriageRfp = UserRfp & {
  rfp: Rfp;
};

interface TriageInboxClientProps {
  rfps: TriageRfp[];
}

export function TriageInboxClient({ rfps: initialRfps }: TriageInboxClientProps) {
  const [rfps, setRfps] = useState(initialRfps);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleFeedback = (rfpId: string) => {
    // Move to next RFP after feedback
    setCurrentIndex((prev) => prev + 1);
  };

  if (currentIndex >= rfps.length) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">All done!</h2>
        <p className="text-muted-foreground">
          You've triaged all available RFPs. Great work!
        </p>
      </div>
    );
  }

  const currentRfp = rfps[currentIndex];
  const remaining = rfps.length - currentIndex;
  const rfp = currentRfp.rfp;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {currentIndex + 1} of {rfps.length}
        </span>
        <span>{remaining} remaining</span>
      </div>

      <Card className="relative">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-xl mb-2">{rfp.title}</CardTitle>
              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                {rfp.buyerName && (
                  <span className="flex items-center gap-1">
                    {rfp.buyerName}
                  </span>
                )}
                {rfp.solicitationNumber && (
                  <span className="text-xs">#{rfp.solicitationNumber}</span>
                )}
              </div>
            </div>
            {rfp.sourceUrl && (
              <a
                href={rfp.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-primary hover:underline"
              >
                View
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Match Info */}
          {currentRfp.relevanceScore && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                Match Score: {currentRfp.relevanceScore}%
              </Badge>
              {rfp.source && (
                <Badge variant="outline">{rfp.source}</Badge>
              )}
            </div>
          )}

          {/* Match Reasons */}
          {currentRfp.matchReasons && currentRfp.matchReasons.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Why this matches:</p>
              <div className="flex flex-wrap gap-2">
                {currentRfp.matchReasons.map((reason, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {reason}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {rfp.description && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Description:</p>
              <p className="text-sm text-muted-foreground line-clamp-4">
                {rfp.description}
              </p>
            </div>
          )}

          {/* Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            {rfp.deadlineSubmission && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Deadline</p>
                  <p className="font-medium">
                    {new Date(rfp.deadlineSubmission).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
            
            {(rfp.budgetMin || rfp.budgetMax) && (
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Budget</p>
                  <p className="font-medium">
                    {rfp.budgetMin && rfp.budgetMax
                      ? `$${rfp.budgetMin.toLocaleString()} - $${rfp.budgetMax.toLocaleString()}`
                      : rfp.budgetMin
                      ? `From $${rfp.budgetMin.toLocaleString()}`
                      : rfp.budgetMax
                      ? `Up to $${rfp.budgetMax.toLocaleString()}`
                      : "N/A"}
                  </p>
                </div>
              </div>
            )}

            {rfp.region && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Region</p>
                  <p className="font-medium">{rfp.region}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <FeedbackButtons
        rfpId={rfp.id}
        onFeedback={handleFeedback}
      />

      {/* Progress indicator */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / rfps.length) * 100}%` }}
        />
      </div>
    </div>
  );
}
