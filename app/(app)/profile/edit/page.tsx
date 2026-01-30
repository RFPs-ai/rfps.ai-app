"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { X, Loader2, ArrowLeft } from "lucide-react";
import { useNAICS } from "@/components/naics-provider";
import { NAICSCombobox } from "@/components/ui/combobox";

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

export default function EditProfilePage() {
  const router = useRouter();
  const { codes, isLoading: isLoadingNAICS, searchCodes, getCodeDescription } = useNAICS();

  // Form state
  const [companyName, setCompanyName] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [naicsCodes, setNaicsCodes] = useState<string[]>([]);
  const [certifications, setCertifications] = useState<string[]>([]);
  const [newCert, setNewCert] = useState("");
  const [regions, setRegions] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isNewProfile, setIsNewProfile] = useState(false);

  // Load existing profile on mount
  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch("/api/profile");
        if (response.ok) {
          const data = await response.json();
          if (data.company) {
            const company: CompanyProfile = data.company;
            setCompanyName(company.name || "");
            setWebsite(company.website || "");
            setDescription(company.description || "");
            setNaicsCodes(company.naicsCodes || []);
            setCertifications(company.certifications || []);
            setRegions(company.regions || []);
            setLanguages(company.languages || []);
          } else {
            setIsNewProfile(true);
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
  }, []);

  const handleAddNaics = (code: string) => {
    if (code && !naicsCodes.includes(code)) {
      setNaicsCodes([...naicsCodes, code]);
    }
  };

  const handleRemoveNaics = (code: string) => {
    setNaicsCodes(naicsCodes.filter((c) => c !== code));
  };

  const handleAddCert = () => {
    if (newCert && !certifications.includes(newCert)) {
      setCertifications([...certifications, newCert]);
      setNewCert("");
    }
  };

  const handleSave = async () => {
    if (!companyName.trim()) {
      toast.error("Company name is required");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: companyName,
          website,
          description,
          naicsCodes,
          certifications,
          regions,
          languages,
        }),
      });

      if (response.ok) {
        toast.success(isNewProfile ? "Profile created successfully!" : "Profile updated successfully!");
        router.push("/profile");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to save profile");
      }
    } catch (error) {
      console.error("Failed to save profile:", error);
      toast.error("Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/profile">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">
            {isNewProfile ? "Create Company Profile" : "Edit Company Profile"}
          </h1>
          <p className="text-muted-foreground">
            {isNewProfile
              ? "Set up your company information to receive better RFP matches"
              : "Update your company information"}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            Your company details and website
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company-name">Company Name *</Label>
            <Input
              id="company-name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Acme Corporation"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of your company"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>NAICS Codes</CardTitle>
          <CardDescription>
            Industry classification codes that describe your business. Search by code or description.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Add NAICS Code</Label>
            <NAICSCombobox
              codes={codes}
              searchCodes={searchCodes}
              isLoading={isLoadingNAICS}
              onValueChange={handleAddNaics}
              placeholder={isLoadingNAICS ? "Loading NAICS codes..." : "Search NAICS codes..."}
            />
            <p className="text-xs text-muted-foreground">
              Type a code number or search by industry description. You can also enter a custom code.
            </p>
          </div>
          
          {naicsCodes.length > 0 && (
            <div className="space-y-2">
              <Label>Selected NAICS Codes</Label>
              <div className="flex flex-wrap gap-2">
                {naicsCodes.map((code) => {
                  const desc = getCodeDescription(code);
                  return (
                    <Badge
                      key={code}
                      variant="secondary"
                      className="py-1.5 px-3 text-sm"
                    >
                      <span className="font-mono font-medium">{code}</span>
                      {desc && (
                        <span className="ml-1 text-muted-foreground">
                          - {desc.length > 30 ? desc.substring(0, 30) + "..." : desc}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveNaics(code)}
                        className="ml-2 hover:text-destructive transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Certifications</CardTitle>
          <CardDescription>
            Professional certifications your company holds
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newCert}
              onChange={(e) => setNewCert(e.target.value)}
              placeholder="e.g., ISO 27001, SOC 2, 8(a), HUBZone"
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddCert())}
            />
            <Button type="button" onClick={handleAddCert}>Add</Button>
          </div>
          {certifications.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {certifications.map((cert) => (
                <Badge key={cert} variant="secondary">
                  {cert}
                  <button
                    type="button"
                    onClick={() =>
                      setCertifications(certifications.filter((c) => c !== cert))
                    }
                    className="ml-2 hover:text-destructive transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Geographic Preferences</CardTitle>
          <CardDescription>
            Regions where you want to find opportunities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Regions</Label>
            <Select
              onValueChange={(value) => {
                if (!regions.includes(value)) {
                  setRegions([...regions, value]);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select regions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Ontario">Ontario</SelectItem>
                <SelectItem value="British Columbia">British Columbia</SelectItem>
                <SelectItem value="Quebec">Quebec</SelectItem>
                <SelectItem value="Alberta">Alberta</SelectItem>
                <SelectItem value="Saskatchewan">Saskatchewan</SelectItem>
                <SelectItem value="Manitoba">Manitoba</SelectItem>
                <SelectItem value="Nova Scotia">Nova Scotia</SelectItem>
                <SelectItem value="New Brunswick">New Brunswick</SelectItem>
                <SelectItem value="Newfoundland and Labrador">Newfoundland and Labrador</SelectItem>
                <SelectItem value="Prince Edward Island">Prince Edward Island</SelectItem>
                <SelectItem value="Northwest Territories">Northwest Territories</SelectItem>
                <SelectItem value="Yukon">Yukon</SelectItem>
                <SelectItem value="Nunavut">Nunavut</SelectItem>
                <SelectItem value="Federal">Federal (Canada-wide)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {regions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {regions.map((region) => (
                <Badge key={region} variant="secondary">
                  {region}
                  <button
                    type="button"
                    onClick={() => setRegions(regions.filter((r) => r !== region))}
                    className="ml-2 hover:text-destructive transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <Label>Languages</Label>
            <Select
              onValueChange={(value) => {
                if (!languages.includes(value)) {
                  setLanguages([...languages, value]);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select languages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EN">English</SelectItem>
                <SelectItem value="FR">French</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {languages.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {languages.map((lang) => (
                <Badge key={lang} variant="secondary">
                  {lang === "EN" ? "English" : lang === "FR" ? "French" : lang}
                  <button
                    type="button"
                    onClick={() => setLanguages(languages.filter((l) => l !== lang))}
                    className="ml-2 hover:text-destructive transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button onClick={handleSave} size="lg" disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            isNewProfile ? "Create Profile" : "Save Changes"
          )}
        </Button>
        <Link href="/profile">
          <Button variant="outline" size="lg">
            Cancel
          </Button>
        </Link>
      </div>
    </div>
  );
}
