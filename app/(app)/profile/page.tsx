"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Pencil, Building2, Globe, FileText, Award, MapPin, Languages } from "lucide-react";
import { useNAICS } from "@/components/naics-provider";

interface CompanyProfile {
  id: string;
  name: string;
  website: string | null;
  description: string | null;
  naicsCodes: string[];
  unspscCodes: string[];
  certifications: string[];
  regions: string[];
  languages: string[];
  budgetMin: number | null;
  budgetMax: number | null;
  negativeKeywords: string[];
  buyerBlacklist: string[];
}

export default function ProfilePage() {
  const router = useRouter();
  const { getCodeDescription } = useNAICS();

  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load existing profile on mount
  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch("/api/profile");
        if (response.ok) {
          const data = await response.json();
          if (data.company) {
            setCompany(data.company);
          } else {
            // No profile exists, redirect to create one
            router.push("/profile/edit");
          }
        }
      } catch (error) {
        console.error("Failed to load profile:", error);
        toast.error("Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!company) {
    return null; // Will redirect to edit page
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Company Profile</h1>
          <p className="text-muted-foreground">
            Your company information for RFP matching
          </p>
        </div>
        <Link href="/profile/edit">
          <Button>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-sm font-medium text-muted-foreground">Company Name</div>
            <div className="text-lg font-semibold">{company.name}</div>
          </div>
          
          {company.website && (
            <div>
              <div className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Globe className="h-3.5 w-3.5" />
                Website
              </div>
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {company.website}
              </a>
            </div>
          )}
          
          {company.description && (
            <div>
              <div className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" />
                Description
              </div>
              <div>{company.description}</div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>NAICS Codes</CardTitle>
          <CardDescription>
            Industry classification codes that describe your business
          </CardDescription>
        </CardHeader>
        <CardContent>
          {company.naicsCodes && company.naicsCodes.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {company.naicsCodes.map((code) => {
                const description = getCodeDescription(code);
                return (
                  <Badge
                    key={code}
                    variant="secondary"
                    className="py-1.5 px-3 text-sm"
                  >
                    <span className="font-mono font-medium">{code}</span>
                    {description && (
                      <span className="ml-1 text-muted-foreground">
                        - {description.length > 40 ? description.substring(0, 40) + "..." : description}
                      </span>
                    )}
                  </Badge>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No NAICS codes configured</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Certifications
          </CardTitle>
          <CardDescription>
            Professional certifications your company holds
          </CardDescription>
        </CardHeader>
        <CardContent>
          {company.certifications && company.certifications.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {company.certifications.map((cert) => (
                <Badge key={cert} variant="secondary">
                  {cert}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No certifications configured</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Geographic Preferences
          </CardTitle>
          <CardDescription>
            Regions and languages for opportunity matching
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-2">Regions</div>
            {company.regions && company.regions.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {company.regions.map((region) => (
                  <Badge key={region} variant="outline">
                    {region}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No regions configured</p>
            )}
          </div>
          
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <Languages className="h-3.5 w-3.5" />
              Languages
            </div>
            {company.languages && company.languages.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {company.languages.map((lang) => (
                  <Badge key={lang} variant="outline">
                    {lang === "EN" ? "English" : lang === "FR" ? "French" : lang}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No languages configured</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
