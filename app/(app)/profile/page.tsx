"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { X } from "lucide-react";

export default function ProfilePage() {
  const [companyName, setCompanyName] = useState("");
  const [website, setWebsite] = useState("");
  const [naicsCodes, setNaicsCodes] = useState<string[]>([]);
  const [newNaics, setNewNaics] = useState("");
  const [certifications, setCertifications] = useState<string[]>([]);
  const [newCert, setNewCert] = useState("");
  const [regions, setRegions] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);

  const handleAddNaics = () => {
    if (newNaics && !naicsCodes.includes(newNaics)) {
      setNaicsCodes([...naicsCodes, newNaics]);
      setNewNaics("");
    }
  };

  const handleAddCert = () => {
    if (newCert && !certifications.includes(newCert)) {
      setCertifications([...certifications, newCert]);
      setNewCert("");
    }
  };

  const handleSave = () => {
    toast.success("Company profile saved successfully!");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Company Profile</h1>
        <p className="text-muted-foreground">
          Configure your company information to receive better RFP matches
        </p>
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
            <Label htmlFor="company-name">Company Name</Label>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>NAICS Codes</CardTitle>
          <CardDescription>
            Industry classification codes that describe your business
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newNaics}
              onChange={(e) => setNewNaics(e.target.value)}
              placeholder="e.g., 541511 (Custom Computer Programming)"
              onKeyPress={(e) => e.key === "Enter" && handleAddNaics()}
            />
            <Button onClick={handleAddNaics}>Add</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {naicsCodes.map((code) => (
              <Badge key={code} variant="secondary">
                {code}
                <button
                  onClick={() =>
                    setNaicsCodes(naicsCodes.filter((c) => c !== code))
                  }
                  className="ml-2"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
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
              placeholder="e.g., ISO 27001, SOC 2"
              onKeyPress={(e) => e.key === "Enter" && handleAddCert()}
            />
            <Button onClick={handleAddCert}>Add</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {certifications.map((cert) => (
              <Badge key={cert} variant="secondary">
                {cert}
                <button
                  onClick={() =>
                    setCertifications(certifications.filter((c) => c !== cert))
                  }
                  className="ml-2"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
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
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-2">
            {regions.map((region) => (
              <Badge key={region} variant="secondary">
                {region}
                <button
                  onClick={() => setRegions(regions.filter((r) => r !== region))}
                  className="ml-2"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>

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
          <div className="flex flex-wrap gap-2">
            {languages.map((lang) => (
              <Badge key={lang} variant="secondary">
                {lang}
                <button
                  onClick={() => setLanguages(languages.filter((l) => l !== lang))}
                  className="ml-2"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} size="lg">
        Save Profile
      </Button>
    </div>
  );
}
